package asr

import (
	"context"
	"github.com/james/backend-go/internal/model"
)

// Client ASR 客户端接口
type Client interface {
	// Transcribe 转录音频
	Transcribe(ctx context.Context, audioData []byte) (*model.TranscriptResult, error)

	// GetEngineName 获取引擎名称
	GetEngineName() string

	// GetEngineType 获取引擎类型
	GetEngineType() model.EngineType
}

// Config ASR 客户端配置
type Config struct {
	Timeout int // 超时时间（秒）
}

// DefaultConfig 默认配置
func DefaultConfig() *Config {
	return &Config{
		Timeout: 30,
	}
}
