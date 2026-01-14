#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
播客逐字稿服务 - FastAPI服务器
"""

import os

# 添加 ~/.local/bin 到 PATH（ffmpeg 和 ffprobe 的位置）
os.environ['PATH'] = os.path.expanduser('~/.local/bin') + ':' + os.environ.get('PATH', '')
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
from pydub import AudioSegment
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

# ==================== 配置 ====================

API_KEY = "dc7bdff46c004fcd87d050fef851f30d.lJaihNuvDsbIdL5y"
API_URL = "https://open.bigmodel.cn/api/paas/v4/audio/transcriptions"
MODEL = "glm-asr-2512"
SEGMENT_LENGTH = 25  # 分段长度（秒）
OVERLAP = 2  # 重叠长度（秒）
MAX_WORKERS = 3  # 并发处理数

# ffmpeg 路径配置
FFMPEG_PATH = os.path.expanduser("~/.local/bin/ffmpeg")
FFPROBE_PATH = os.path.expanduser("~/.local/bin/ffprobe")

# 设置 pydub 使用指定的 ffmpeg 和 ffprobe
if os.path.exists(FFMPEG_PATH):
    AudioSegment.converter = FFMPEG_PATH
    AudioSegment.ffprobe = FFPROBE_PATH
    print(f"✅ 使用 ffmpeg: {FFMPEG_PATH}")
    print(f"✅ 使用 ffprobe: {FFPROBE_PATH}")
else:
    print(f"⚠️  警告: ffmpeg 未找到")
    print(f"   路径: {FFMPEG_PATH}")

# ==================== FastAPI App ====================

app = FastAPI(
    title="播客逐字稿服务 API",
    description="AI驱动的播客逐字稿生成工具",
    version="1.0.0"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源（开发环境）
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

    def transcribe_segment(self, audio_path: str) -> Dict:
        """
        转写单个音频片段（≤30秒）

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
                print(f"响应内容: {response.text if hasattr(response, 'text') else 'N/A'}")
                raise

def segment_audio(audio_path: str, segment_length: int = SEGMENT_LENGTH, overlap: int = OVERLAP) -> List[Dict]:
    """
    分割音频文件

    Args:
        audio_path: 音频文件路径
        segment_length: 分段长度（秒）
        overlap: 重叠长度（秒）

    Returns:
        分段信息列表
    """
    audio = AudioSegment.from_file(audio_path)
    duration_ms = len(audio)
    segment_length_ms = segment_length * 1000
    overlap_ms = overlap * 1000

    segments = []
    start_ms = 0
    segment_index = 0

    while start_ms < duration_ms:
        end_ms = min(start_ms + segment_length_ms + overlap_ms, duration_ms)
        actual_duration_ms = end_ms - start_ms

        segments.append({
            'index': segment_index,
            'start_ms': start_ms,
            'end_ms': end_ms,
            'duration_sec': actual_duration_ms / 1000
        })

        start_ms += segment_length_ms
        segment_index += 1

    return segments

def extract_audio_segment(audio_path: str, start_ms: int, end_ms: int, output_path: str) -> str:
    """
    提取音频片段并保存到文件

    Args:
        audio_path: 原音频文件路径
        start_ms: 开始时间（毫秒）
        end_ms: 结束时间（毫秒）
        output_path: 输出文件路径

    Returns:
        输出文件路径
    """
    audio = AudioSegment.from_file(audio_path)
    segment = audio[start_ms:end_ms]
    segment.export(output_path, format="mp3")
    return output_path

def process_audio_upload(
    file_path: str,
    filename: str,
    transcriber: GLMASRTranscriber
) -> Dict:
    """
    处理音频上传并转写

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

    # 1. 分段处理
    print(f"📊 步骤1: 音频分段...")
    segments_info = segment_audio(file_path)
    print(f"   ✅ 分段完成: {len(segments_info)}段")

    # 2. 创建临时目录保存片段
    temp_dir = tempfile.mkdtemp(prefix="podcast_segments_")

    try:
        # 3. 提取音频片段
        print(f"\n🎵 步骤2: 提取音频片段...")
        segment_files = []
        for seg in segments_info:
            output_path = os.path.join(temp_dir, f"segment_{seg['index']:03d}.mp3")
            extract_audio_segment(file_path, seg['start_ms'], seg['end_ms'], output_path)
            segment_files.append({
                'info': seg,
                'path': output_path
            })
        print(f"   ✅ 提取完成: {len(segment_files)}个片段")

        # 4. 并发转写
        print(f"\n🔄 步骤3: 并发转写 (并发数={MAX_WORKERS})...")
        transcribed_segments = []
        total_tokens = 0

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            future_to_segment = {
                executor.submit(transcriber.transcribe_segment, seg['path']): seg
                for seg in segment_files
            }

            for i, future in enumerate(as_completed(future_to_segment), 1):
                seg = future_to_segment[future]
                try:
                    result = future.result()

                    # 解析结果
                    if 'text' in result:
                        text = result['text']
                    else:
                        text = ""

                    # 计算token数（粗略估算：1字符≈1token）
                    tokens = len(text)
                    total_tokens += tokens

                    transcribed_segments.append({
                        'text': text,
                        'start': seg['info']['start_ms'] / 1000,
                        'end': seg['info']['end_ms'] / 1000,
                        'speaker': 'SPEAKER_00' if seg['info']['index'] % 2 == 0 else 'SPEAKER_01'
                    })

                    print(f"   进度: {i}/{len(segment_files)} - {text[:50]}...")

                except Exception as e:
                    print(f"   ⚠️  片段{seg['info']['index']}转写失败: {e}")
                    # 添加空结果以保持顺序
                    transcribed_segments.append({
                        'text': "",
                        'start': seg['info']['start_ms'] / 1000,
                        'end': seg['info']['end_ms'] / 1000,
                        'speaker': 'SPEAKER_00'
                    })

        # 按索引排序
        transcribed_segments.sort(key=lambda x: x['start'])

        # 5. 合并结果
        print(f"\n✨ 步骤4: 合并结果...")
        full_text = ' '.join([seg['text'] for seg in transcribed_segments if seg['text']])
        word_count = len(full_text)
        duration = max([seg['end'] for seg in transcribed_segments]) if transcribed_segments else 0
        processing_time = time.time() - start_time

        # 计算成本（16元/百万tokens）
        total_cost = (total_tokens / 1000000) * 16

        print(f"\n✅ 转写完成!")
        print(f"   - 时长: {duration:.1f}秒")
        print(f"   - 字数: {word_count}")
        print(f"   - tokens: {total_tokens}")
        print(f"   - 耗时: {processing_time:.1f}秒")
        print(f"   - 成本: ¥{total_cost:.4f}")

        return {
            'fullText': full_text,
            'segments': transcribed_segments,
            'duration': duration,
            'wordCount': word_count
        }

    finally:
        # 清理临时文件
        shutil.rmtree(temp_dir, ignore_errors=True)

# ==================== API路由 ====================

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "播客逐字稿服务 API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "healthy"}

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """
    转写音频文件

    Args:
        file: 上传的音频文件

    Returns:
        转写结果
    """
    # 验证文件类型
    allowed_types = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp4']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型: {file.content_type}。请上传 MP3、WAV 或 M4A 格式的音频文件。"
        )

    # 创建临时文件
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix)
    temp_path = temp_file.name

    try:
        # 保存上传的文件
        with open(temp_path, 'wb') as f:
            shutil.copyfileobj(file.file, f)

        # 创建转写器
        transcriber = GLMASRTranscriber(api_key=API_KEY)

        # 处理音频
        result = process_audio_upload(temp_path, file.filename, transcriber)

        return JSONResponse(content=result)

    except Exception as e:
        print(f"错误: {e}")
        raise HTTPException(status_code=500, detail=f"转写失败: {str(e)}")

    finally:
        # 清理临时文件
        if os.path.exists(temp_path):
            os.unlink(temp_path)

# ==================== 主程序 ====================

if __name__ == "__main__":
    print("🎙️  播客逐字稿服务")
    print("="*60)
    print("✅ FastAPI服务器启动中...")
    print(f"📍 API地址: http://localhost:8000")
    print(f"📍 文档地址: http://localhost:8000/docs")
    print(f"📍 健康检查: http://localhost:8000/health")
    print("="*60)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
