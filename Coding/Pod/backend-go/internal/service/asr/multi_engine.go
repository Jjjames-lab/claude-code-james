package asr

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/james/backend-go/internal/model"
	"github.com/james/backend-go/internal/service/storage"
	"go.uber.org/zap"
)

// MultiEngineService 多引擎服务
type MultiEngineService struct {
	primary Client
	backup  Client
	logger  *zap.Logger
	storage *storage.MinIOClient // MinIO 存储客户端
}

// TranscribeWithFallback 使用 Fallback 策略转录
// 优先使用主引擎，失败时自动切换到备用引擎
func (s *MultiEngineService) TranscribeWithFallback(ctx context.Context, audioData []byte) (*model.TranscriptResult, error) {
	s.logger.Info("Starting ASR transcription with fallback strategy",
		zap.String("primary_engine", s.primary.GetEngineName()),
		zap.String("backup_engine", s.backup.GetEngineName()),
		zap.Int("audio_size", len(audioData)))

	// 1. 调用 ASR 引擎转录
	result, err := s.transcribeWithEngines(ctx, audioData)
	if err != nil {
		return nil, err
	}

	// 2. 保存到 MinIO（如果配置了存储）
	if s.storage != nil {
		s.saveToMinIO(ctx, audioData, result)
	}

	return result, nil
}

// transcribeWithEngines 使用引擎进行转录
func (s *MultiEngineService) transcribeWithEngines(ctx context.Context, audioData []byte) (*model.TranscriptResult, error) {
	// 尝试主引擎
	result, err := s.primary.Transcribe(ctx, audioData)
	if err == nil {
		s.logger.Info("Primary engine succeeded",
			zap.String("engine", result.Engine.String()))
		return result, nil
	}

	s.logger.Warn("Primary engine failed, switching to backup",
		zap.String("primary_engine", s.primary.GetEngineName()),
		zap.Error(err))

	// 主引擎失败，尝试备用引擎
	result, err = s.backup.Transcribe(ctx, audioData)
	if err != nil {
		s.logger.Error("Backup engine also failed",
			zap.String("backup_engine", s.backup.GetEngineName()),
			zap.Error(err))
		return nil, model.NewASRError("ALL_ENGINES_FAILED", "All ASR engines failed", fmt.Sprintf("Primary: %v, Backup: %v", err, err))
	}

	s.logger.Info("Backup engine succeeded",
		zap.String("engine", result.Engine.String()))

	return result, nil
}

// saveToMinIO 保存音频和转录结果到 MinIO
func (s *MultiEngineService) saveToMinIO(ctx context.Context, audioData []byte, result *model.TranscriptResult) {
	timestamp := time.Now().Format("20060102-150405")

	// 1. 上传音频文件
	audioObjectName := fmt.Sprintf("episode-%s.mp3", timestamp)
	audioURL, err := s.storage.UploadAudio(ctx, audioObjectName, bytes.NewReader(audioData), int64(len(audioData)))
	if err != nil {
		s.logger.Warn("Failed to upload audio to MinIO", zap.Error(err))
		// 继续执行，不影响转录结果
	} else {
		result.AudioURL = audioURL
	}

	// 2. 上传转录结果
	transcriptObjectName := fmt.Sprintf("transcript-%s.json", timestamp)
	transcriptJSON, err := json.Marshal(result)
	if err != nil {
		s.logger.Warn("Failed to marshal transcript", zap.Error(err))
	} else {
		transcriptURL, err := s.storage.UploadTranscript(ctx, transcriptObjectName, transcriptJSON)
		if err != nil {
			s.logger.Warn("Failed to upload transcript to MinIO", zap.Error(err))
			// 继续执行
		} else {
			result.TranscriptURL = transcriptURL
		}
	}

	s.logger.Info("ASR transcription completed and saved to MinIO",
		zap.String("engine", string(result.Engine)),
		zap.String("audio_url", result.AudioURL),
		zap.String("transcript_url", result.TranscriptURL))
}
