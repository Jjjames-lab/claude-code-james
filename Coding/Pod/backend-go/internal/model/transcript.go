package model

import "time"

// EngineType ASR 引擎类型
type EngineType string

const (
	EngineTypeDoubao EngineType = "doubao"
	EngineTypeQwen   EngineType = "qwen"
)

// String 返回引擎类型的字符串表示
func (e EngineType) String() string {
	return string(e)
}

// TranscriptWord 词级别的转录结果
type TranscriptWord struct {
	Text    string `json:"text"`
	Start   int    `json:"start"`   // 毫秒
	End     int    `json:"end"`     // 毫秒
	Speaker string `json:"speaker,omitempty"`
}

// TranscriptResult 完整的转录结果
type TranscriptResult struct {
	Text          string            `json:"text"`
	Duration      int               `json:"duration"`  // 音频时长（秒）
	Engine        EngineType        `json:"engine"`
	Words         []TranscriptWord  `json:"words"`
	WordCount     int               `json:"word_count"`
	LogID         string            `json:"log_id"`
	Timestamp     time.Time         `json:"timestamp"`
	AudioURL      string            `json:"audio_url,omitempty"`      // MinIO 音频 URL
	TranscriptURL string            `json:"transcript_url,omitempty"` // MinIO 转录结果 URL
}

// ASRError ASR 错误
type ASRError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
}

func (e *ASRError) Error() string {
	if e.Detail != "" {
		return e.Message + ": " + e.Detail
	}
	return e.Message
}

// NewASRError 创建 ASR 错误
func NewASRError(code, message, detail string) *ASRError {
	return &ASRError{
		Code:    code,
		Message: message,
		Detail:  detail,
	}
}
