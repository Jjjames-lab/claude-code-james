package router

import (
	"github.com/gin-gonic/gin"
	"github.com/james/backend-go/internal/api/handler"
	"github.com/james/backend-go/internal/api/middleware"
	"github.com/james/backend-go/internal/config"
	"github.com/james/backend-go/internal/service/asr"
	"github.com/james/backend-go/internal/service/crawler"
	"go.uber.org/zap"
)

// Setup 设置路由
func Setup(r *gin.Engine, cfg *config.Config, log *zap.Logger, asrService *asr.MultiEngineService, crawlerClient *crawler.HTTPClient) {
	// 设置中间件日志
	middleware.SetLogger(log)

	// 全局中间件
	r.Use(middleware.Logger())
	r.Use(middleware.CORS())
	r.Use(gin.Recovery())

	// 创建处理器
	asrHandler := handler.NewASRHandler(asrService, log)

	// 创建爬虫处理器（如果配置了）
	var crawlerHandler *handler.CrawlerHandler
	if crawlerClient != nil {
		crawlerHandler = handler.NewCrawlerHandler(crawlerClient, log)
		log.Info("Crawler handler initialized")
	}

	// API v1 路由组
	v1 := r.Group("/api/v1")
	{
		// 健康检查
		v1.GET("/health", handler.HealthCheck)

		// ASR 转录
		asrGroup := v1.Group("/asr")
		{
			asrGroup.POST("/transcribe", asrHandler.Transcribe)
			asrGroup.GET("/engines", asrHandler.GetEngines)
		}

		// 爬虫服务
		if crawlerHandler != nil {
			v1.POST("/episode/parse", crawlerHandler.ParseURL)
		}
	}
}
