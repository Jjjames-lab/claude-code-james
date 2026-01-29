package config

import (
	"log"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

// Config 应用配置
type Config struct {
	Env     string
	Debug   bool
	Port    string
	LogLevel string

	// ASR 配置
	DoubaoAppID       string
	DoubaoAccessToken string
	QwenAPIKey        string

	// MinIO 配置
	MinIOEndpoint  string
	MinIOAccessKey string
	MinIOSecretKey string
	MinIOUseSSL    bool

	// 文件清理配置
	CleanupInterval    string // 例如 "1h"
	FileRetentionDays  int

	// 爬虫服务配置
	CrawlerServiceURL string
	CrawlerTimeout    int // 秒
}

// Load 加载配置
func Load() *Config {
	// 加载 .env 文件
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found or error loading: %v", err)
		// 不返回错误，继续使用默认值或系统环境变量
	} else {
		log.Println("Successfully loaded .env file")
	}

	viper.SetDefault("env", "development")
	viper.SetDefault("debug", true)
	viper.SetDefault("port", "8000")
	viper.SetDefault("loglevel", "info")

	// MinIO 默认配置
	viper.SetDefault("minio_endpoint", "localhost:9000")
	viper.SetDefault("minio_access_key", "minioadmin")
	viper.SetDefault("minio_secret_key", "minioadmin")
	viper.SetDefault("minio_use_ssl", false)
	viper.SetDefault("cleanup_interval", "1h")
	viper.SetDefault("file_retention_days", 7)

	// 爬虫服务默认配置
	viper.SetDefault("crawler_service_url", "http://localhost:8001")
	viper.SetDefault("crawler_timeout", 30)

	// 从环境变量读取
	viper.AutomaticEnv()
	viper.SetEnvPrefix("APP")
	viper.BindEnv("port")
	viper.BindEnv("debug")

	// ASR 配置
	viper.BindEnv("doubao_app_id")
	viper.BindEnv("doubao_access_token")
	viper.BindEnv("qwen_api_key")

	// MinIO 配置
	viper.BindEnv("minio_endpoint")
	viper.BindEnv("minio_access_key")
	viper.BindEnv("minio_secret_key")
	viper.BindEnv("minio_use_ssl")
	viper.BindEnv("cleanup_interval")
	viper.BindEnv("file_retention_days")

	// 爬虫服务配置
	viper.BindEnv("crawler_service_url")
	viper.BindEnv("crawler_timeout")

	cfg := &Config{
		Env:     viper.GetString("env"),
		Debug:   viper.GetBool("debug"),
		Port:    viper.GetString("port"),
		LogLevel: viper.GetString("loglevel"),

		DoubaoAppID:       viper.GetString("doubao_app_id"),
		DoubaoAccessToken: viper.GetString("doubao_access_token"),
		QwenAPIKey:        viper.GetString("qwen_api_key"),

		MinIOEndpoint:     viper.GetString("minio_endpoint"),
		MinIOAccessKey:    viper.GetString("minio_access_key"),
		MinIOSecretKey:    viper.GetString("minio_secret_key"),
		MinIOUseSSL:       viper.GetBool("minio_use_ssl"),
		CleanupInterval:   viper.GetString("cleanup_interval"),
		FileRetentionDays: viper.GetInt("file_retention_days"),

		CrawlerServiceURL: viper.GetString("crawler_service_url"),
		CrawlerTimeout:    viper.GetInt("crawler_timeout"),
	}

	log.Printf("Loaded config: CrawlerURL=%s", cfg.CrawlerServiceURL)

	return cfg
}
