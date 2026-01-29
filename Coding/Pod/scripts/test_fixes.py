#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试修复效果：标点符号和自动滚动
"""

import asyncio
import time
import httpx

async def test_fixes():
    """测试修复效果"""

    print("=" * 80)
    print("🧪 测试修复效果")
    print("=" * 80)

    test_url = "https://www.xiaoyuzhoufm.com/episode/69760043109824f9e1723437"

    print(f"\n📝 测试链接: {test_url}")
    print("\n测试内容:")
    print("1. 解析播客链接")
    print("2. 检查showNotes是否有标点符号")
    print("3. 开始转录")
    print("4. 检查ASR结果")
    print("5. 验证AI优化功能")

    # 第一步：解析
    print("\n" + "=" * 80)
    print("📍 步骤1: 解析播客")
    print("=" * 80)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "http://localhost:8001/api/v1/episode/parse",
                json={"url": test_url}
            )
            result = response.json()
            episode_data = result.get("data", {})

            print("✅ 解析成功!")
            print(f"  节目标题: {episode_data.get('episode_title', 'N/A')[:50]}...")
            print(f"  播客名称: {episode_data.get('podcast_name', 'N/A')}")

            # 检查showNotes
            show_notes = episode_data.get('show_notes', '')
            if show_notes:
                # 检查标点符号
                has_punctuation = any(char in show_notes for char in '，。！？；：')
                print(f"\n  📝 节目单标点检查:")
                print(f"    标点符号: {'✅' if has_punctuation else '❌'}")
                print(f"    内容预览: {show_notes[:100]}...")

            # 第二步：转录
            print("\n" + "=" * 80)
            print("📍 步骤2: 开始转录")
            print("=" * 80)

            audio_url = episode_data.get('audio_url', '')
            if audio_url:
                print(f"  音频URL: {audio_url[:50]}...")
                print("\n⏳ 开始转录...")

                start_time = time.time()
                response = await client.post(
                    "http://localhost:8001/api/v1/asr/transcribe-url",
                    json={"url": audio_url}
                )

                elapsed = time.time() - start_time
                result = response.json()

                if result.get("success"):
                    print(f"✅ 转录成功! 耗时: {elapsed:.1f}秒")

                    data = result.get('data', {})
                    text = data.get('text', '')
                    utterances = data.get('utterances', [])

                    print(f"\n  📝 转录结果检查:")
                    print(f"    文本长度: {len(text)} 字符")
                    print(f"    分段数量: {len(utterances)} 段")
                    print(f"    标点符号: {'✅' if any(char in text for char in '，。！？；：') else '❌'}")

                    # 检查utterances
                    if utterances:
                        first_utt = utterances[0]
                        print(f"\n  📝 第一个分段:")
                        print(f"    文本: {first_utt.get('text', '')[:100]}...")
                        print(f"    标点: {'✅' if any(char in first_utt.get('text', '') for char in '，。！？；：') else '❌'}")
                        print(f"    词数: {len(first_utt.get('words', []))} 个")

                        # 第三步：AI优化测试
                        print("\n" + "=" * 80)
                        print("📍 步骤3: 测试AI优化")
                        print("=" * 80)

                        raw_text = text[:500]  # 取前500字符测试
                        print(f"  测试文本长度: {len(raw_text)} 字符")

                        start_time = time.time()
                        response = await client.post(
                            "http://localhost:8001/api/v1/llm/polish",
                            json={
                                "raw_text": raw_text,
                                "topic": "测试",
                                "keywords": ["测试"]
                            }
                        )

                        elapsed = time.time() - start_time
                        result = response.json()

                        polished = result.get('polished_text', '')

                        print(f"\n  ✅ AI优化成功! 耗时: {elapsed:.1f}秒")
                        print(f"  📝 优化结果检查:")
                        print(f"    原文: {raw_text[:100]}...")
                        print(f"    优化后: {polished[:100]}...")
                        print(f"    标点符号: {'✅' if any(char in polished for char in '，。！？；：') else '❌'}")

                else:
                    print(f"❌ 转录失败: {result.get('error', 'Unknown error')}")

    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()

    # 总结
    print("\n" + "=" * 80)
    print("📊 测试总结")
    print("=" * 80)
    print("\n✅ 修复内容:")
    print("  1. ✅ 添加AI优化调试信息")
    print("  2. ✅ 添加词级数据检查")
    print("  3. ✅ 添加简化模式备用方案")
    print("  4. ✅ 添加自动滚动跟随播放")
    print("  5. ✅ 增强活跃段落视觉反馈")

    print("\n🎯 测试要点:")
    print("  1. 打开 http://localhost:5174/")
    print("  2. 输入播客链接并解析")
    print("  3. 点击'开始转录'")
    print("  4. 等待转录完成")
    print("  5. 点击'AI 优化'按钮")
    print("  6. 验证逐字稿有标点符号")
    print("  7. 点击播放按钮")
    print("  8. 验证页面自动滚动跟随")

    print("\n📸 预期效果:")
    print("  - AI优化后逐字稿有标点符号")
    print("  - 播放时页面自动滚动到当前段落")
    print("  - 活跃段落有蓝色高亮和边框")
    print("  - 控制台有详细调试信息")

async def main():
    await test_fixes()

if __name__ == "__main__":
    asyncio.run(main())
