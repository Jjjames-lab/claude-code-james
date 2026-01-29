package crawler

import (
	"context"
	"fmt"
	"time"

	"github.com/go-resty/resty/v2"
	"go.uber.org/zap"
)

// HTTPClient 爬虫 HTTP 客户端
type HTTPClient struct {
	baseURL    string
	httpClient *resty.Client
	logger     *zap.Logger
	timeout    time.Duration
}

// Config 配置
type Config struct {
	BaseURL string        // Python 服务地址
	Timeout time.Duration // 超时时间
	Logger  *zap.Logger
}

// NewHTTPClient 创建爬虫 HTTP 客户端
func NewHTTPClient(cfg *Config) *HTTPClient {
	if cfg.Timeout == 0 {
		cfg.Timeout = 30 * time.Second
	}

	client := resty.New().
		SetBaseURL(cfg.BaseURL).
		SetTimeout(cfg.Timeout).
		SetRetryCount(2).
		SetRetryWaitTime(500 * time.Millisecond)

	return &HTTPClient{
		baseURL:    cfg.BaseURL,
		httpClient: client,
		logger:     cfg.Logger,
		timeout:    cfg.Timeout,
	}
}

// ParseURLRequest 解析请求
type ParseURLRequest struct {
	URL      string `json:"url"`
	WaitTime int    `json:"wait_time,omitempty"`
}

// ParseURLResponse 解析响应
type ParseURLResponse struct {
	Success bool   `json:"success"`
	Data    *Data  `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
}

// Data 解析结果
type Data struct {
	Title       string `json:"title"`
	PodcastName string `json:"podcast_name,omitempty"` // 播客名称
	AudioURL    string `json:"audio_url"`
	Duration    int    `json:"duration"`
	EpisodeID   string `json:"episode_id"`
	CoverImage  string `json:"cover_image,omitempty"`
	ShowNotes   string `json:"show_notes,omitempty"`
}

// ParseURL 解析小宇宙链接
func (c *HTTPClient) ParseURL(ctx context.Context, url string, waitTime int) (*Data, error) {
	c.logger.Info("Parsing URL via Python crawler service",
		zap.String("url", url),
		zap.Int("wait_time", waitTime))

	// 构建请求
	req := ParseURLRequest{
		URL:      url,
		WaitTime: waitTime,
	}

	// 发送请求
	var resp ParseURLResponse
	r, err := c.httpClient.R().
		SetContext(ctx).
		SetHeader("Content-Type", "application/json").
		SetBody(req).
		SetResult(&resp).
		Post("/api/crawler/parse")

	if err != nil {
		c.logger.Error("Failed to call crawler service",
			zap.String("url", url),
			zap.Error(err))
		return nil, fmt.Errorf("failed to call crawler service: %w", err)
	}

	// 检查 HTTP 状态码
	if r.StatusCode() != 200 {
		c.logger.Error("Crawler service returned error",
			zap.Int("status_code", r.StatusCode()),
			zap.String("response", r.String()))
		return nil, fmt.Errorf("crawler service error: status %d", r.StatusCode())
	}

	// 检查业务逻辑
	if !resp.Success {
		c.logger.Error("Parse failed",
			zap.String("error", resp.Error))
		return nil, fmt.Errorf("parse failed: %s", resp.Error)
	}

	c.logger.Info("Parse success",
		zap.String("title", resp.Data.Title),
		zap.String("episode_id", resp.Data.EpisodeID))

	return resp.Data, nil
}

// HealthCheck 健康检查
func (c *HTTPClient) HealthCheck(ctx context.Context) error {
	r, err := c.httpClient.R().
		SetContext(ctx).
		Get("/api/crawler/health")

	if err != nil {
		return fmt.Errorf("health check failed: %w", err)
	}

	if r.StatusCode() != 200 {
		return fmt.Errorf("health check failed: status %d", r.StatusCode())
	}

	return nil
}
