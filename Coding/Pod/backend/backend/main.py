"""
FastAPI 应用主入口
小宇宙深度学习助手 API
"""
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from app.api.routes import episode, health, asr, crawler, llm, export
from app.utils.logger import logger
from app.services.asr import asr_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    logger.info("=" * 50)
    logger.info(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} 启动中...")
    logger.info("=" * 50)

    # 初始化 ASR 引擎（如果配置了 API Key）
    if settings.DOUBAO_ACCESS_KEY and settings.DOUBAO_SECRET_KEY:
        asr_manager.init_engines(
            doubao_key=settings.DOUBAO_ACCESS_KEY,
            doubao_secret=settings.DOUBAO_SECRET_KEY,
            qwen_key=settings.QWEN_ACCESS_KEY,
            qwen_secret=settings.QWEN_SECRET_KEY
        )
        logger.info("✅ ASR 引擎初始化完成")
    else:
        logger.warning("⚠️  ASR 引擎未配置，转录功能将不可用")

    yield

    # 关闭时执行
    logger.info("👋 应用关闭中...")
    # TODO: 关闭爬虫浏览器
    # await crawler.close_browser()
    logger.info("✅ 应用已关闭")


# 创建 FastAPI 应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="小宇宙播客深度学习助手 API - MVP 1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(episode.router, prefix=settings.API_V1_PREFIX)
app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(asr.router)  # ASR 路由（已在路由中定义前缀）
app.include_router(crawler.router)  # 爬虫路由（已在路由中定义前缀）
app.include_router(llm.router)  # LLM 路由（已在路由中定义前缀）
app.include_router(export.router)  # 导出路由（已在路由中定义前缀）


# 根路径
@app.get("/")
async def root():
    """根路径，返回 API 信息"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
