package unit_test

import (
	"context"
	"testing"
	"time"

	"github.com/james/backend-go/internal/model"
	"github.com/james/backend-go/internal/service/asr"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

// MockDoubaoClient 豆包客户端的 Mock 实现
type MockDoubaoClient struct {
	ShouldFail bool
}

func (m *MockDoubaoClient) Transcribe(ctx context.Context, audioData []byte) (*model.TranscriptResult, error) {
	if m.ShouldFail {
		return nil, model.NewASRError("MOCK_ERROR", "Mock error", "Test failure")
	}

	return &model.TranscriptResult{
		Text:      "This is a mock transcription from Doubao",
		Duration:  10,
		Engine:    model.EngineTypeDoubao,
		Words:     []model.TranscriptWord{},
		WordCount: 10,
		LogID:     "mock-log-id",
		Timestamp: time.Now(),
	}, nil
}

func (m *MockDoubaoClient) GetEngineName() string {
	return "Doubao"
}

func (m *MockDoubaoClient) GetEngineType() model.EngineType {
	return model.EngineTypeDoubao
}

// MockQwenClient Qwen 客户端的 Mock 实现
type MockQwenClient struct {
	ShouldFail bool
}

func (m *MockQwenClient) Transcribe(ctx context.Context, audioData []byte) (*model.TranscriptResult, error) {
	if m.ShouldFail {
		return nil, model.NewASRError("MOCK_ERROR", "Mock error", "Test failure")
	}

	return &model.TranscriptResult{
		Text:      "This is a mock transcription from Qwen",
		Duration:  10,
		Engine:    model.EngineTypeQwen,
		Words:     []model.TranscriptWord{},
		WordCount: 10,
		LogID:     "mock-log-id",
		Timestamp: time.Now(),
	}, nil
}

func (m *MockQwenClient) GetEngineName() string {
	return "Qwen"
}

func (m *MockQwenClient) GetEngineType() model.EngineType {
	return model.EngineTypeQwen
}

// TestMultiEngineService_Fallback_Success 测试 Fallback 策略成功
func TestMultiEngineService_Fallback_Success(t *testing.T) {
	logger := zap.NewNop()
	primary := &MockDoubaoClient{ShouldFail: false}
	backup := &MockQwenClient{ShouldFail: false}

	service := asr.NewMultiEngineService(&asr.MultiEngineConfig{
		Primary: primary,
		Backup:  backup,
		Logger:  logger,
	})

	audioData := []byte("mock audio data")
	result, err := service.TranscribeWithFallback(context.Background(), audioData)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, model.EngineTypeDoubao, result.Engine)
	assert.Contains(t, result.Text, "Doubao")
}

// TestMultiEngineService_Fallback_PrimaryFails 测试主引擎失败时切换到备用引擎
func TestMultiEngineService_Fallback_PrimaryFails(t *testing.T) {
	logger := zap.NewNop()
	primary := &MockDoubaoClient{ShouldFail: true}
	backup := &MockQwenClient{ShouldFail: false}

	service := asr.NewMultiEngineService(&asr.MultiEngineConfig{
		Primary: primary,
		Backup:  backup,
		Logger:  logger,
	})

	audioData := []byte("mock audio data")
	result, err := service.TranscribeWithFallback(context.Background(), audioData)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, model.EngineTypeQwen, result.Engine)
	assert.Contains(t, result.Text, "Qwen")
}

// TestMultiEngineService_Fallback_BothFail 测试两个引擎都失败
func TestMultiEngineService_Fallback_BothFail(t *testing.T) {
	logger := zap.NewNop()
	primary := &MockDoubaoClient{ShouldFail: true}
	backup := &MockQwenClient{ShouldFail: true}

	service := asr.NewMultiEngineService(&asr.MultiEngineConfig{
		Primary: primary,
		Backup:  backup,
		Logger:  logger,
	})

	audioData := []byte("mock audio data")
	result, err := service.TranscribeWithFallback(context.Background(), audioData)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "All ASR engines failed")
}

// TestTranscriptResult 测试转录结果模型
func TestTranscriptResult(t *testing.T) {
	result := &model.TranscriptResult{
		Text:     "Test transcription",
		Duration: 100,
		Engine:   model.EngineTypeDoubao,
		Words: []model.TranscriptWord{
			{
				Text:    "Test",
				Start:   0,
				End:     500,
				Speaker: "Speaker 0",
			},
			{
				Text:    "transcription",
				Start:   500,
				End:     1500,
				Speaker: "Speaker 0",
			},
		},
		WordCount: 2,
		LogID:     "test-log-id",
		Timestamp: time.Now(),
	}

	assert.Equal(t, "Test transcription", result.Text)
	assert.Equal(t, 100, result.Duration)
	assert.Equal(t, model.EngineTypeDoubao, result.Engine)
	assert.Equal(t, 2, result.WordCount)
	assert.Equal(t, "test-log-id", result.LogID)
	assert.Len(t, result.Words, 2)
}

// TestASRError 测试 ASR 错误
func TestASRError(t *testing.T) {
	err := model.NewASRError("TEST_CODE", "Test message", "Test detail")

	assert.Equal(t, "TEST_CODE", err.Code)
	assert.Equal(t, "Test message", err.Message)
	assert.Equal(t, "Test detail", err.Detail)
	assert.Contains(t, err.Error(), "Test message")
}

// TestEngineType_String 测试引擎类型字符串
func TestEngineType_String(t *testing.T) {
	assert.Equal(t, "doubao", model.EngineTypeDoubao.String())
	assert.Equal(t, "qwen", model.EngineTypeQwen.String())
}
