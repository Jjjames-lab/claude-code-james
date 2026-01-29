package main

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/james/backend-go/internal/api/router"
	"github.com/james/backend-go/internal/config"
	"github.com/james/backend-go/internal/service/asr"
	"github.com/james/backend-go/internal/service/crawler"
	"github.com/james/backend-go/internal/service/storage"
	"github.com/james/backend-go/pkg/logger"
	"go.uber.org/zap"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 初始化日志
	log := logger.New(cfg.LogLevel)
	defer log.Sync()

	// 初始化 MinIO 客户端
	var minioClient *storage.MinIOClient
	minioClient, err := storage.NewMinIOClient(&storage.MinIOConfig{
		Endpoint:  cfg.MinIOEndpoint,
		AccessKey: cfg.MinIOAccessKey,
		SecretKey: cfg.MinIOSecretKey,
		UseSSL:    cfg.MinIOUseSSL,
		Logger:    log,
	})
	if err != nil {
		log.Error("Failed to initialize MinIO client",
			zap.Error(err))
		log.Warn("Continuing without MinIO storage")
		minioClient = nil
	} else {
		log.Info("MinIO client initialized successfully",
			zap.String("endpoint", cfg.MinIOEndpoint))

		// 启动文件清理服务
		cleanupService := storage.NewCleanupService(&storage.CleanupConfig{
			Client:    minioClient,
			Logger:    log,
			Retention: time.Duration(cfg.FileRetentionDays) * 24 * time.Hour,
		})
		go cleanupService.Start(context.Background())
	}

	// 初始化爬虫客户端
	var crawlerClient *crawler.HTTPClient
	crawlerClient = crawler.NewHTTPClient(&crawler.Config{
		BaseURL: cfg.CrawlerServiceURL,
		Timeout: time.Duration(cfg.CrawlerTimeout) * time.Second,
		Logger:  log,
	})

	// 检查爬虫服务连接
	if err := crawlerClient.HealthCheck(context.Background()); err != nil {
		log.Warn("Crawler service health check failed",
			zap.String("url", cfg.CrawlerServiceURL),
			zap.Error(err))
		log.Warn("Crawler service may not be available")
	} else {
		log.Info("Crawler client initialized successfully",
			zap.String("url", cfg.CrawlerServiceURL))
	}

	// 初始化 ASR 服务（带 MinIO）
	var asrService *asr.MultiEngineService
	if minioClient != nil {
		asrService = asr.NewMultiEngineService(cfg, log, minioClient)
	} else {
		asrService = asr.NewMultiEngineServiceFromConfig(cfg, log)
	}

	log.Info("ASR service initialized",
		zap.String("primary_engine", "doubao"),
		zap.String("backup_engine", "qwen"),
		zap.Bool("minio_enabled", minioClient != nil),
		zap.Bool("crawler_enabled", crawlerClient != nil))

	// 设置 Gin 模式
	if !cfg.Debug {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建路由
	r := gin.New()
	router.Setup(r, cfg, log, asrService, crawlerClient)

	// 启动服务
	log.Info("Starting server",
		zap.String("port", cfg.Port),
		zap.String("env", cfg.Env),
		zap.Bool("debug", cfg.Debug),
	)

	r.Run(":" + cfg.Port)
}
