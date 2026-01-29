"""
错误码定义模块
统一错误码和错误信息格式
"""
from typing import Optional
from fastapi import HTTPException, status


class ErrorCode:
    """错误码常量"""

    # 1xxx: 客户端错误
    INVALID_URL = (1001, "无效的URL格式")
    INVALID_AUDIO_URL = (1002, "音频URL无法访问")

    # 14xx: HTTP 错误
    ERROR_403 = (1403, "反爬虫拦截")
    ERROR_404 = (1404, "资源不存在")
    ERROR_504 = (1504, "请求超时")

    # 2xxx: 任务相关错误
    TASK_NOT_FOUND = (2001, "任务不存在")

    # 3xxx: ASR 服务错误
    ASR_SERVICE_UNAVAILABLE = (3001, "ASR服务不可用")

    # 4xxx: AI 服务错误
    AI_SERVICE_ERROR = (4001, "AI服务调用失败")

    # 5xxx: 存储错误
    STORAGE_QUOTA_EXCEEDED = (5001, "存储空间不足")

    # 9xxx: 网络错误
    NETWORK_ERROR = (9001, "网络连接异常")


class APIException(HTTPException):
    """自定义 API 异常"""

    def __init__(
        self,
        error_code: int,
        message: str,
        http_status: int = status.HTTP_400_BAD_REQUEST,
        detail: Optional[str] = None
    ):
        self.error_code = error_code
        self.message = message
        super().__init__(status_code=http_status, detail=detail or message)


class ErrorResponse:
    """统一错误响应格式"""

    @staticmethod
    def create(error_code: int, message: str, detail: Optional[str] = None) -> dict:
        """创建错误响应"""
        return {
            "success": False,
            "error": {
                "code": error_code,
                "message": message,
                "detail": detail
            }
        }


# 便捷异常类
class InvalidURLException(APIException):
    """无效 URL 异常"""
    def __init__(self, detail: Optional[str] = None):
        code, msg = ErrorCode.INVALID_URL
        super().__init__(error_code=code, message=msg, http_status=status.HTTP_400_BAD_REQUEST, detail=detail)


class Error403Exception(APIException):
    """403 反爬虫异常"""
    def __init__(self, detail: Optional[str] = None):
        code, msg = ErrorCode.ERROR_403
        super().__init__(error_code=code, message=msg, http_status=status.HTTP_403_FORBIDDEN, detail=detail)


class Error404Exception(APIException):
    """404 资源不存在异常"""
    def __init__(self, detail: Optional[str] = None):
        code, msg = ErrorCode.ERROR_404
        super().__init__(error_code=code, message=msg, http_status=status.HTTP_404_NOT_FOUND, detail=detail)


class Error504Exception(APIException):
    """504 超时异常"""
    def __init__(self, detail: Optional[str] = None):
        code, msg = ErrorCode.ERROR_504
        super().__init__(error_code=code, message=msg, http_status=status.HTTP_504_GATEWAY_TIMEOUT, detail=detail)


class ASRServiceUnavailableException(APIException):
    """ASR 服务不可用异常"""
    def __init__(self, detail: Optional[str] = None):
        code, msg = ErrorCode.ASR_SERVICE_UNAVAILABLE
        super().__init__(error_code=code, message=msg, http_status=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)
