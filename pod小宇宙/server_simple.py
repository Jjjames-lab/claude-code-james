#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
播客逐字稿服务 - FastAPI服务器（简化版）
不依赖ffmpeg，适合快速测试
"""

import os
import asyncio
import tempfile
import shutil
from pathlib import Path
from typing import List, Dict, Optional
import json

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

# ==================== 配置 ====================

API_KEY = "dc7bdff46c004fcd87d050fef851f30d.lJaihNuvDsbIdL5y"
API_URL = "https://open.bigmodel.cn/api/paas/v4/audio/transcriptions"
MODEL = "glm-asr-2512"
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB (约30秒音频)

# ==================== FastAPI App ====================

app = FastAPI(
    title="播客逐字稿服务 API",
    description="AI驱动的播客逐字稿生成工具（简化版）",
    version="1.0.0"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 核心功能 ====================

class GLMASRTranscriber:
    """GLM-ASR转写器"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_url = API_URL
        self.session = requests.Session()

    def transcribe(self, audio_path: str) -> Dict:
        """
        转写音频文件（≤30秒）

        Args:
            audio_path: 音频文件路径

        Returns:
            API响应结果
        """
        if not Path(audio_path).exists():
            raise FileNotFoundError(f"音频文件不存在: {audio_path}")

        headers = {
            'Authorization': f'Bearer {self.api_key}'
        }

        with open(audio_path, 'rb') as audio_file:
            files = {'file': audio_file}
            data = {
                'model': MODEL,
                'stream': 'false'
            }

            try:
                response = requests.post(
                    self.api_url,
                    headers=headers,
                    files=files,
                    data=data,
                    timeout=60
                )
                response.raise_for_status()
                return response.json()
            except requests.exceptions.RequestException as e:
                print(f"API调用失败: {e}")
                if hasattr(e, 'response') and e.response is not None:
                    print(f"响应内容: {e.response.text}")
                raise

def process_audio_upload(
    file_path: str,
    filename: str,
    transcriber: GLMASRTranscriber
) -> Dict:
    """
    处理音频上传并转写（简化版 - 不分段）

    Args:
        file_path: 上传的文件路径
        filename: 原始文件名
        transcriber: 转写器实例

    Returns:
        转写结果
    """
    start_time = time.time()

    print(f"\n{'='*60}")
    print(f"🎙️  开始转写: {filename}")
    print(f"{'='*60}")
    print(f"⚠️  注意: 当前为简化版，仅支持≤30秒的音频文件")
    print(f"💡 完整功能需要安装ffmpeg以支持长音频分段处理")

    # 直接转写整个文件（≤30秒）
    print(f"\n🔄 调用GLM-ASR API...")
    result = transcriber.transcribe(file_path)

    # 解析结果
    if 'text' in result:
        text = result['text']
    else:
        text = ""

    # 计算字数和成本
    word_count = len(text)
    tokens = word_count  # 粗略估算
    total_cost = (tokens / 1000000) * 16

    # 创建结果
    duration = 30.0  # 简化处理，假设30秒
    processing_time = time.time() - start_time

    # 创建分段（只有一个）
    segments = [{
        'text': text,
        'start': 0.0,
        'end': duration,
        'speaker': 'SPEAKER_00'
    }]

    print(f"\n✅ 转写完成!")
    print(f"   - 时长: ~{duration:.1f}秒")
    print(f"   - 字数: {word_count}")
    print(f"   - tokens: {tokens}")
    print(f"   - 耗时: {processing_time:.1f}秒")
    print(f"   - 成本: ¥{total_cost:.4f}")

    return {
        'fullText': text,
        'segments': segments,
        'duration': duration,
        'wordCount': word_count
    }

# ==================== API路由 ====================

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "播客逐字稿服务 API (简化版)",
        "version": "1.0.0",
        "status": "running",
        "note": "当前为简化版，仅支持≤30秒音频。完整功能需安装ffmpeg。"
    }

@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "healthy"}

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """
    转写音频文件（简化版）

    Args:
        file: 上传的音频文件（≤30秒）

    Returns:
        转写结果
    """
    # 检查文件大小
    content = await file.read()
    file_size = len(content)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"文件过大（{file_size/1024/1024:.2f}MB）。简化版仅支持≤25MB（约30秒）的音频文件。"
        )

    # 验证文件类型
    allowed_types = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/ogg']
    if file.content_type not in allowed_types:
        print(f"⚠️  文件类型: {file.content_type}")
        # 尝试继续处理，因为某些浏览器可能不正确设置MIME类型

    # 创建临时文件
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix)
    temp_path = temp_file.name

    try:
        # 保存上传的文件
        with open(temp_path, 'wb') as f:
            f.write(content)

        # 创建转写器
        transcriber = GLMASRTranscriber(api_key=API_KEY)

        # 处理音频
        result = process_audio_upload(temp_path, file.filename, transcriber)

        return JSONResponse(content=result)

    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()

        # 解析API错误信息
        error_msg = str(e)
        if "1214" in error_msg and "文件时长限制" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="音频文件超过30秒限制。\n\n简化版仅支持≤30秒的音频。\n\n解决方案：\n1. 截取音频的前30秒进行测试\n2. 或安装ffmpeg后使用完整版（支持任意长度）"
            )
        elif "1214" in error_msg and "不支持当前文件格式" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="不支持的音频格式。\n\n仅支持 MP3 和 WAV 格式。"
            )
        else:
            raise HTTPException(status_code=500, detail=f"转写失败: {str(e)}")

    finally:
        # 清理临时文件
        if os.path.exists(temp_path):
            os.unlink(temp_path)

# ==================== 主程序 ====================

if __name__ == "__main__":
    print("🎙️  播客逐字稿服务 (简化版)")
    print("="*60)
    print("✅ FastAPI服务器启动中...")
    print(f"📍 API地址: http://localhost:8000")
    print(f"📍 文档地址: http://localhost:8000/docs")
    print(f"📍 健康检查: http://localhost:8000/health")
    print("="*60)
    print("⚠️  注意: 当前为简化版")
    print("   - 仅支持≤30秒的音频文件")
    print("   - 完整功能需要安装ffmpeg")
    print("="*60)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
