package asr

import (
	"context"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/james/backend-go/internal/model"
	"go.uber.org/zap"
	"github.com/go-resty/resty/v2"
)

// QwenClient 阿里云 Qwen ASR 客户端
type QwenClient struct {
	apiKey     string
	timeout    time.Duration
	logger     *zap.Logger
	httpClient *resty.Client
}

// QwenConfig Qwen 配置
type QwenConfig struct {
	APIKey  string
	Timeout time.Duration
	Logger  *zap.Logger
}

// NewQwenClient 创建阿里云 Qwen ASR 客户端
func NewQwenClient(cfg *QwenConfig) *QwenClient {
	if cfg.Timeout == 0 {
		cfg.Timeout = 30 * time.Second
	}

	client := resty.New().
		SetTimeout(cfg.Timeout).
		SetRetryCount(2).
		SetRetryWaitTime(500 * time.Millisecond)

	return &QwenClient{
		apiKey:     cfg.APIKey,
		timeout:    cfg.Timeout,
		logger:     cfg.Logger,
		httpClient: client,
	}
}

// Transcribe 转录音频
func (c *QwenClient) Transcribe(ctx context.Context, audioData []byte) (*model.TranscriptResult, error) {
	// 构建请求头
	headers := map[string]string{
		"Authorization":  "Bearer " + c.apiKey,
		"Content-Type":   "application/json",
		"Accept":         "application/json",
	}

	// 构建请求体
	requestBody := c.buildRequestBody(audioData)

	c.logger.Info("Sending request to Qwen ASR",
		zap.Int("audio_size", len(audioData)))

	// 发送请求
	var response QwenResponse
	resp, err := c.httpClient.R().
		SetContext(ctx).
		SetHeaders(headers).
		SetBody(requestBody).
		SetResult(&response).
		Post("https://bailian.cn-beijing.aliyuncs.com/v2/api/asr/invoke")

	if err != nil {
		c.logger.Error("Qwen ASR request failed",
			zap.Error(err))
		return nil, model.NewASRError("QWEN_REQUEST_FAILED", "Request to Qwen ASR failed", err.Error())
	}

	// 检查响应状态
	if resp.StatusCode() != 200 {
		c.logger.Error("Qwen ASR returned error",
			zap.Int("status_code", resp.StatusCode()),
			zap.String("response", string(resp.Body())))
		return nil, model.NewASRError("QWEN_API_ERROR", fmt.Sprintf("Qwen ASR returned status %d", resp.StatusCode()), string(resp.Body()))
	}

	// 解析响应
	result, err := c.parseResponse(&response)
	if err != nil {
		return nil, err
	}

	c.logger.Info("Qwen ASR transcription completed",
		zap.Int("word_count", result.WordCount))

	return result, nil
}

// buildRequestBody 构建请求体
func (c *QwenClient) buildRequestBody(audioData []byte) map[string]interface{} {
	// Base64 编码音频
	audioBase64 := base64.StdEncoding.EncodeToString(audioData)

	// 阿里云 Qwen API 请求格式
	return map[string]interface{}{
		"audio_type": "mp3",
		"audio_data": audioBase64,
		"sample_rate": 16000,
		"format": "mp3",
	}
}

// parseResponse 解析响应
func (c *QwenClient) parseResponse(response *QwenResponse) (*model.TranscriptResult, error) {
	if response.Code != "200" && response.Code != "Success" {
		return nil, model.NewASRError("QWEN_TRANSCRIPTION_FAILED", response.Message, response.Code)
	}

	// 提取文本和词级时间戳
	result := &model.TranscriptResult{
		Text:      response.Data.Text,
		Engine:    model.EngineTypeQwen,
		LogID:     response.RequestID,
		Timestamp: time.Now(),
	}

	// 解析词级时间戳
	if response.Data.Sentences != nil {
		var words []model.TranscriptWord
		for _, sentence := range response.Data.Sentences {
			if sentence.Words != nil {
				for _, word := range sentence.Words {
					words = append(words, model.TranscriptWord{
						Text: word.Text,
						Start: word.StartTime,
						End:   word.EndTime,
					})
				}
			}
		}
		result.Words = words
		result.WordCount = len(words)

		// 计算音频时长
		if len(words) > 0 {
			lastWord := words[len(words)-1]
			result.Duration = lastWord.End / 1000 // 转换为秒
		}
	}

	return result, nil
}

// GetEngineName 获取引擎名称
func (c *QwenClient) GetEngineName() string {
	return "Qwen"
}

// GetEngineType 获取引擎类型
func (c *QwenClient) GetEngineType() model.EngineType {
	return model.EngineTypeQwen
}

// QwenResponse Qwen API 响应结构
type QwenResponse struct {
	Code      string   `json:"code"`
	Message   string   `json:"message"`
	RequestID string   `json:"request_id"`
	Data      QwenData `json:"data"`
}

// QwenData 转录数据
type QwenData struct {
	Text      string          `json:"text"`
	Sentences []QwenSentence  `json:"sentences,omitempty"`
}

// QwenSentence 句子
type QwenSentence struct {
	Text  string      `json:"text"`
	Words []QwenWord  `json:"words,omitempty"`
}

// QwenWord 词
type QwenWord struct {
	Text      string `json:"text"`
	StartTime int    `json:"start_time"`
	EndTime   int    `json:"end_time"`
}
