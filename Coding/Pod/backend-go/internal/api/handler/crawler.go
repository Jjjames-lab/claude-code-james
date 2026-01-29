package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/james/backend-go/internal/service/crawler"
	"go.uber.org/zap"
)

// CrawlerHandler 爬虫处理器
type CrawlerHandler struct {
	crawler *crawler.HTTPClient
	logger  *zap.Logger
}

// NewCrawlerHandler 创建爬虫处理器
func NewCrawlerHandler(crawlerClient *crawler.HTTPClient, logger *zap.Logger) *CrawlerHandler {
	return &CrawlerHandler{
		crawler: crawlerClient,
		logger:  logger,
	}
}

// ParseURLRequest 解析请求
type ParseURLRequest struct {
	URL      string `json:"url" binding:"required"`
	WaitTime int    `json:"wait_time"`
}

// ParseURL 解析小宇宙链接
// @Summary 解析小宇宙播客链接
// @Description 通过爬虫服务解析小宇宙播客链接，获取音频URL等信息
// @Tags Crawler
// @Accept json
// @Produce json
// @Param request body ParseURLRequest true "解析请求"
// @Success 200 {object} APIResponse
// @Router /api/v1/crawler/parse [post]
func (h *CrawlerHandler) ParseURL(c *gin.Context) {
	var req ParseURLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid request parameters",
			zap.Error(err))
		Error(c, 400, "INVALID_REQUEST", "Invalid request parameters: "+err.Error())
		return
	}

	h.logger.Info("Received crawler request",
		zap.String("url", req.URL),
		zap.Int("wait_time", req.WaitTime))

	// 调用爬虫服务
	data, err := h.crawler.ParseURL(c.Request.Context(), req.URL, req.WaitTime)
	if err != nil {
		h.logger.Error("Failed to parse URL",
			zap.String("url", req.URL),
			zap.Error(err))
		Error(c, 500, "PARSE_FAILED", err.Error())
		return
	}

	Success(c, gin.H{
		"episode_id":    data.EpisodeID,
		"episode_title": data.Title,
		"podcast_name":  data.PodcastName,
		"audio_url":     data.AudioURL,
		"duration":      data.Duration,
		"cover_image":   data.CoverImage,
		"show_notes":    data.ShowNotes,
	})
}
