package asr

import (
	"github.com/james/backend-go/internal/config"
	"github.com/james/backend-go/internal/model"
	"github.com/james/backend-go/internal/service/storage"
	"go.uber.org/zap"
)

// NewASRClients 根据配置创建 ASR 客户端
func NewASRClients(cfg *config.Config, logger *zap.Logger) (primary, backup Client) {
	// 创建豆包客户端（主引擎）
	doubaoClient := NewDoubaoClient(&DoubaoConfig{
		AppID:       cfg.DoubaoAppID,
		AccessToken: cfg.DoubaoAccessToken,
		Logger:      logger,
	})

	// 创建阿里云 Qwen 客户端（备用引擎）
	qwenClient := NewQwenClient(&QwenConfig{
		APIKey: cfg.QwenAPIKey,
		Logger: logger,
	})

	return doubaoClient, qwenClient
}

// NewMultiEngineService 创建多引擎服务（带 MinIO 存储）
func NewMultiEngineService(cfg *config.Config, logger *zap.Logger, minioClient *storage.MinIOClient) *MultiEngineService {
	primary, backup := NewASRClients(cfg, logger)

	return &MultiEngineService{
		primary: primary,
		backup:  backup,
		logger:  logger,
		storage: minioClient,
	}
}

// NewMultiEngineServiceFromConfig 创建多引擎服务（从配置，不含 MinIO）
// 保留此函数以兼容旧代码
func NewMultiEngineServiceFromConfig(cfg *config.Config, logger *zap.Logger) *MultiEngineService {
	primary, backup := NewASRClients(cfg, logger)

	return &MultiEngineService{
		primary: primary,
		backup:  backup,
		logger:  logger,
		storage: nil,
	}
}

// GetClientByEngineType 根据引擎类型获取客户端
func GetClientByEngineType(engineType model.EngineType, cfg *config.Config, logger *zap.Logger) Client {
	switch engineType {
	case model.EngineTypeDoubao:
		return NewDoubaoClient(&DoubaoConfig{
			AppID:       cfg.DoubaoAppID,
			AccessToken: cfg.DoubaoAccessToken,
			Logger:      logger,
		})
	case model.EngineTypeQwen:
		return NewQwenClient(&QwenConfig{
			APIKey: cfg.QwenAPIKey,
			Logger: logger,
		})
	default:
		logger.Warn("Unknown engine type, using default", zap.String("engine_type", string(engineType)))
		return NewDoubaoClient(&DoubaoConfig{
			AppID:       cfg.DoubaoAppID,
			AccessToken: cfg.DoubaoAccessToken,
			Logger:      logger,
		})
	}
}
