#!/usr/bin/env python3
"""
创建30秒测试音频（如果系统有音频工具）
"""

import sys
import os

def create_test_audio():
    """使用系统命令创建测试音频"""
    print("🎙️  创建30秒测试音频...")
    print("="*60)

    # 检查是否有 say 命令 (macOS TTS)
    has_say = os.system("which say > /dev/null 2>&1") == 0

    if has_say:
        print("✅ 检测到 macOS say 命令")
        print("📝 生成测试音频...")

        # 使用 say 命令生成音频
        text = """
        欢迎使用播客逐字稿服务。
        这是一个测试音频，用于验证转录功能。
        请等待转录完成，然后查看结果。
        """

        # 使用 say 命令生成 aiff 文件
        aiff_file = "/tmp/test_audio.aiff"
        cmd = f'say -o "{aiff_file}" "{text}"'
        result = os.system(cmd)

        if result == 0:
            print(f"✅ 音频已生成: {aiff_file}")

            # 尝试转换为 mp3 (如果有 ffmpeg)
            print("\n💡 提示: AIFF 格式可能不被支持")
            print("   如需 MP3 格式，请安装 ffmpeg:")
            print("   brew install ffmpeg")
            print(f"   然后: ffmpeg -i {aiff_file} test_audio.mp3")

            return aiff_file
        else:
            print("❌ 生成音频失败")
            return None
    else:
        print("❌ 未找到 say 命令")
        print("\n📝 其他方案:")
        print("1. 使用在线工具录音: https://vocaroo.com/")
        print("2. 下载短视频音频")
        print("3. 使用现有音频编辑器截取30秒")
        return None

if __name__ == "__main__":
    create_test_audio()
