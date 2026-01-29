#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调试转录数据结构
检查utterances vs text字段的标点情况
"""

import asyncio
import httpx
import json

async def debug_transcript():
    """调试转录数据结构"""

    print("=" * 80)
    print("🔍 调试转录数据结构")
    print("=" * 80)

    test_url = "https://www.xiaoyuzhoufm.com/episode/69760043109824f9e1723437"

    try:
        # 解析播客
        print("\n📍 步骤1: 解析播客")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "http://localhost:8001/api/v1/episode/parse",
                json={"url": test_url}
            )
            result = response.json()
            episode_data = result.get("data", {})

            print("✅ 解析成功!")

            # 转录
            print("\n📍 步骤2: 转录")
            audio_url = episode_data.get('audio_url', '')
            if not audio_url:
                print("❌ 未获取到音频URL")
                return

            print(f"  音频URL: {audio_url[:50]}...")

            response = await client.post(
                "http://localhost:8001/api/v1/asr/transcribe-url",
                json={"url": audio_url}
            )
            result = response.json()

            if not result.get("success"):
                print(f"❌ 转录失败: {result.get('error')}")
                return

            print("✅ 转录成功!")

            data = result.get('data', {})
            text_field = data.get('text', '')
            utterances = data.get('utterances', [])

            print(f"\n📊 数据分析:")
            print(f"  result.text 长度: {len(text_field)} 字符")
            print(f"  utterances 数量: {len(utterances)} 个")

            # 检查result.text的标点
            has_punctuation_result = any(char in text_field for char in '，。！？；：')
            print(f"\n  📝 result.text 标点检查:")
            print(f"    标点符号: {'✅' if has_punctuation_result else '❌'}")
            print(f"    前100字符: {text_field[:100]}...")

            # 检查utterances[0].text的标点
            if utterances:
                first_utt = utterances[0]
                utt_text = first_utt.get('text', '')
                has_punctuation_utt = any(char in utt_text for char in '，。！？；：')

                print(f"\n  📝 utterances[0].text 标点检查:")
                print(f"    标点符号: {'✅' if has_punctuation_utt else '❌'}")
                print(f"    文本内容: {utt_text[:100]}...")

                # 检查所有utterances
                utt_with_punct = sum(1 for utt in utterances if any(char in utt.get('text', '') for char in '，。！？；：'))
                print(f"\n  📝 所有 utterances 标点统计:")
                print(f"    有标点的 utterances: {utt_with_punct}/{len(utterances)}")
                print(f"    占比: {utt_with_punct/len(utterances)*100:.1f}%")

                # 显示前3个utterances的详细对比
                print(f"\n  📋 前3个 utterances 详细信息:")
                for i, utt in enumerate(utterances[:3]):
                    utt_text = utt.get('text', '')
                    words = utt.get('words', [])
                    print(f"\n    Utterance {i+1}:")
                    print(f"      文本: {utt_text}")
                    print(f"      标点: {'✅' if any(char in utt_text for char in '，。！？；：') else '❌'}")
                    print(f"      词数: {len(words)}")
                    if words:
                        print(f"      前3个词: {words[:3]}")

    except Exception as e:
        print(f"\n❌ 调试失败: {e}")
        import traceback
        traceback.print_exc()

    print("\n" + "=" * 80)
    print("🎯 结论")
    print("=" * 80)
    print("\n根据以上数据分析，我们将决定：")
    print("1. 如果utterances[].text有标点 → 直接使用ASR结果")
    print("2. 如果utterances[].text无标点 → 需要LLM优化或合并策略")

async def main():
    await debug_transcript()

if __name__ == "__main__":
    asyncio.run(main())
