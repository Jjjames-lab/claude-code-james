package handler

import (
	"io"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/james/backend-go/internal/model"
	"github.com/james/backend-go/internal/service/asr"
	"go.uber.org/zap"
)

// ASRHandler ASR 处理器
type ASRHandler struct {
	asrService *asr.MultiEngineService
	logger     *zap.Logger
}

// NewASRHandler 创建 ASR 处理器
func NewASRHandler(asrService *asr.MultiEngineService, logger *zap.Logger) *ASRHandler {
	return &ASRHandler{
		asrService: asrService,
		logger:     logger,
	}
}

// TranscribeRequest 转录请求
type TranscribeRequest struct {
	Engine string `form:"engine" binding:"omitempty,oneof=doubao qwen auto"`
}

// TranscribeResponse 转录响应
type TranscribeResponse struct {
	Text      string                      `json:"text"`
	Duration  int                         `json:"duration"`
	Engine    model.EngineType            `json:"engine"`
	Words     []model.TranscriptWord      `json:"words"`
	WordCount int                         `json:"word_count"`
	LogID     string                      `json:"log_id"`
	Timestamp time.Time                   `json:"timestamp"`
}

// Transcribe 转录音频文件
// @Summary 转录音频文件
// @Description 上传音频文件并返回转录结果
// @Tags ASR
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "音频文件"
// @Param engine formData string false "引擎类型 (doubao/qwen/auto)" default(auto)
// @Success 200 {object} APIResponse
// @Router /api/v1/asr/transcribe [post]
func (h *ASRHandler) Transcribe(c *gin.Context) {
	startTime := time.Now()

	// 解析请求参数
	var req TranscribeRequest
	if err := c.ShouldBind(&req); err != nil {
		h.logger.Warn("Invalid request parameters",
			zap.Error(err))
		Error(c, 400, "INVALID_PARAMS", "Invalid request parameters: "+err.Error())
		return
	}

	// 设置默认引擎
	if req.Engine == "" {
		req.Engine = "auto"
	}

	// 获取上传的文件
	fileHeader, err := c.FormFile("file")
	if err != nil {
		h.logger.Warn("Failed to get uploaded file",
			zap.Error(err))
		Error(c, 400, "INVALID_FILE", "No file uploaded or invalid file")
		return
	}

	// 打开文件
	file, err := fileHeader.Open()
	if err != nil {
		h.logger.Error("Failed to open uploaded file",
			zap.Error(err))
		Error(c, 500, "FILE_OPEN_ERROR", "Failed to open file")
		return
	}
	defer file.Close()

	// 读取文件内容
	audioData, err := io.ReadAll(file)
	if err != nil {
		h.logger.Error("Failed to read file content",
			zap.Error(err))
		Error(c, 500, "FILE_READ_ERROR", "Failed to read file")
		return
	}

	h.logger.Info("Received ASR transcription request",
		zap.String("filename", fileHeader.Filename),
		zap.Int64("file_size", fileHeader.Size),
		zap.String("engine", req.Engine))

	// 根据引擎类型选择转录方式
	ctx := c.Request.Context()
	var result *model.TranscriptResult

	if req.Engine == "auto" {
		// 使用多引擎服务（Fallback 策略）
		result, err = h.asrService.TranscribeWithFallback(ctx, audioData)
	} else {
		// 使用指定引擎（需要从配置获取客户端）
		// TODO: 实现根据配置获取指定引擎客户端
		h.logger.Warn("Specific engine selection not implemented yet, using fallback",
			zap.String("requested_engine", req.Engine))
		result, err = h.asrService.TranscribeWithFallback(ctx, audioData)
	}

	if err != nil {
		h.logger.Error("ASR transcription failed",
			zap.Error(err),
			zap.Duration("duration", time.Since(startTime)))
		Error(c, 500, "ASR_ERROR", err.Error())
		return
	}

	// 构建响应
	response := &TranscribeResponse{
		Text:      result.Text,
		Duration:  result.Duration,
		Engine:    result.Engine,
		Words:     result.Words,
		WordCount: result.WordCount,
		LogID:     result.LogID,
		Timestamp: result.Timestamp,
	}

	h.logger.Info("ASR transcription completed",
		zap.String("engine", string(result.Engine)),
		zap.Int("word_count", result.WordCount),
		zap.Duration("duration", time.Since(startTime)))

	Success(c, response)
}

// GetEngines 获取可用的 ASR 引擎列表
// @Summary 获取可用引擎列表
// @Description 返回所有可用的 ASR 引擎
// @Tags ASR
// @Produce json
// @Success 200 {object} APIResponse
// @Router /api/v1/asr/engines [get]
func (h *ASRHandler) GetEngines(c *gin.Context) {
	engines := []map[string]interface{}{
		{
			"name":       "Doubao",
			"type":       "doubao",
			"status":     "available",
			"is_primary": true,
		},
		{
			"name":       "Qwen",
			"type":       "qwen",
			"status":     "available",
			"is_primary": false,
		},
	}

	Success(c, gin.H{
		"engines": engines,
		"count":   len(engines),
	})
}
