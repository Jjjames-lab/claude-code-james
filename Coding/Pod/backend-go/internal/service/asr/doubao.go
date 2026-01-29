package asr

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/james/backend-go/internal/model"
	"go.uber.org/zap"
	"github.com/go-resty/resty/v2"
)

// DoubaoClient 豆包 ASR 客户端
type DoubaoClient struct {
	appID       string
	accessToken string
	timeout     time.Duration
	hotwords    []string
	logger      *zap.Logger
	httpClient  *resty.Client
}

// DoubaoConfig 豆包配置
type DoubaoConfig struct {
	AppID       string
	AccessToken string
	Timeout     time.Duration
	Hotwords    []string
	Logger      *zap.Logger
}

// NewDoubaoClient 创建豆包 ASR 客户端
func NewDoubaoClient(cfg *DoubaoConfig) *DoubaoClient {
	if cfg.Timeout == 0 {
		cfg.Timeout = 30 * time.Second
	}

	client := resty.New().
		SetTimeout(cfg.Timeout).
		SetRetryCount(2).
		SetRetryWaitTime(500 * time.Millisecond)

	return &DoubaoClient{
		appID:       cfg.AppID,
		accessToken: cfg.AccessToken,
		timeout:     cfg.Timeout,
		hotwords:    cfg.Hotwords,
		logger:      cfg.Logger,
		httpClient:  client,
	}
}

// Transcribe 转录音频
func (c *DoubaoClient) Transcribe(ctx context.Context, audioData []byte) (*model.TranscriptResult, error) {
	// 构建请求头
	headers := map[string]string{
		"X-Api-App-Key":       c.appID,
		"X-Api-Access-Key":    c.accessToken,
		"X-Api-Resource-Id":   "volc.bigasr.auc_turbo",
		"X-Api-Request-Id":    uuid.New().String(),
		"X-Api-Sequence":      "-1",
		"Content-Type":        "application/json",
	}

	// 构建请求体
	requestBody := c.buildRequestBody(audioData)

	c.logger.Info("Sending request to Doubao ASR",
		zap.String("request_id", headers["X-Api-Request-Id"]),
		zap.Int("audio_size", len(audioData)))

	// 发送请求
	var response DoubaoResponse
	resp, err := c.httpClient.R().
		SetContext(ctx).
		SetHeaders(headers).
		SetBody(requestBody).
		SetResult(&response).
		Post("https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash")

	if err != nil {
		c.logger.Error("Doubao ASR request failed",
			zap.Error(err))
		return nil, model.NewASRError("DOUBAO_REQUEST_FAILED", "Request to Doubao ASR failed", err.Error())
	}

	// 检查响应头状态码
	statusCode := resp.Header().Get("X-Api-Status-Code")
	apiMessage := resp.Header().Get("X-Api-Message")
	logID := resp.Header().Get("X-Tt-Logid")

	if statusCode != "20000000" {
		c.logger.Error("Doubao ASR returned error",
			zap.String("status_code", statusCode),
			zap.String("message", apiMessage),
			zap.String("log_id", logID))
		return nil, model.NewASRError("DOUBAO_API_ERROR", fmt.Sprintf("Doubao ASR error: %s", apiMessage), statusCode)
	}

	// 解析响应
	result, err := c.parseResponse(&response, logID)
	if err != nil {
		return nil, err
	}

	c.logger.Info("Doubao ASR transcription completed",
		zap.String("log_id", logID),
		zap.Int("word_count", result.WordCount))

	return result, nil
}

// buildRequestBody 构建请求体
func (c *DoubaoClient) buildRequestBody(audioData []byte) map[string]interface{} {
	// Base64 编码音频
	audioBase64 := base64.StdEncoding.EncodeToString(audioData)

	// 构建请求对象
	requestObj := map[string]interface{}{
		"model_name": "bigmodel",
	}

	// 添加热词
	if len(c.hotwords) > 0 {
		hotwords := make([]map[string]string, len(c.hotwords))
		for i, word := range c.hotwords {
			hotwords[i] = map[string]string{"word": word}
		}
		contextJSON, _ := json.Marshal(map[string]interface{}{
			"hotwords": hotwords,
		})
		requestObj["corpus"] = map[string]interface{}{
			"context": string(contextJSON),
		}
	}

	// 完整请求体
	return map[string]interface{}{
		"user": map[string]string{
			"uid": c.appID,
		},
		"audio": map[string]string{
			"data": audioBase64,
		},
		"request": requestObj,
	}
}

// parseResponse 解析响应
func (c *DoubaoClient) parseResponse(response *DoubaoResponse, logID string) (*model.TranscriptResult, error) {
	// 提取完整文本
	var fullText string
	var words []model.TranscriptWord

	if response.Result != nil {
		for _, utterance := range response.Result.Utterances {
			fullText += utterance.Text
			for _, word := range utterance.Words {
				words = append(words, model.TranscriptWord{
					Text:     word.Text,
					Start:    word.StartTime,
					End:      word.EndTime,
					Speaker:  utterance.Speaker,
				})
			}
		}
	}

	result := &model.TranscriptResult{
		Text:      fullText,
		Duration:  0, // 需要从 words 计算或从音频获取
		Engine:    model.EngineTypeDoubao,
		Words:     words,
		WordCount: len(words),
		LogID:     logID,
		Timestamp: time.Now(),
	}

	// 计算音频时长
	if len(words) > 0 {
		lastWord := words[len(words)-1]
		result.Duration = lastWord.End / 1000 // 转换为秒
	}

	return result, nil
}

// GetEngineName 获取引擎名称
func (c *DoubaoClient) GetEngineName() string {
	return "Doubao"
}

// GetEngineType 获取引擎类型
func (c *DoubaoClient) GetEngineType() model.EngineType {
	return model.EngineTypeDoubao
}

// DoubaoResponse 豆包 API 响应结构
type DoubaoResponse struct {
	Result *DoubaoResult `json:"result"`
}

// DoubaoResult 转录结果
type DoubaoResult struct {
	Utterances []DoubaoUtterance `json:"utterances"`
}

// DoubaoUtterance 句子
type DoubaoUtterance struct {
	Text     string          `json:"text"`
	Speaker  string          `json:"speaker"`
	Words    []DoubaoWord    `json:"words"`
	StartTime int            `json:"start_time"`
	EndTime   int            `json:"end_time"`
}

// DoubaoWord 词
type DoubaoWord struct {
	Text      string `json:"text"`
	StartTime int    `json:"start_time"`
	EndTime   int    `json:"end_time"`
}
