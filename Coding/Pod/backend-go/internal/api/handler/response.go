package handler

import "github.com/gin-gonic/gin"

// APIResponse 统一响应格式
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorInfo  `json:"error,omitempty"`
}

// ErrorInfo 错误信息
type ErrorInfo struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
}

// Success 成功响应
func Success(c *gin.Context, data interface{}) {
	c.JSON(200, APIResponse{
		Success: true,
		Data:    data,
	})
}

// Error 错误响应
func Error(c *gin.Context, code int, errCode, message string) {
	c.JSON(code, APIResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    errCode,
			Message: message,
		},
	})
}

// ErrorWithDetail 错误响应（带详细信息）
func ErrorWithDetail(c *gin.Context, code int, errCode, message, detail string) {
	c.JSON(code, APIResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    errCode,
			Message: message,
			Detail:  detail,
		},
	})
}
