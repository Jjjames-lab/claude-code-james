#!/usr/bin/env python3
"""
LLM优化速度测试 - 验证并发优化效果
"""

import asyncio
import time
import httpx

async def test_llm_speed():
    """测试LLM优化速度"""

    # 创建一个较长的测试文本（模拟真实播客转录）
    test_text = """
    大家好 欢迎收听今天的播客节目 我是主持人小王 今天我们要聊一个非常有趣的话题
    今天我们要讲的是关于人工智能的发展以及对未来的影响 首先我想问问大家 你们对人工智能有什么看法呢
    我觉得人工智能确实是当下最热门的话题之一 无论是在科技圈还是在日常生活中 我们都能看到AI的影子
    从智能手机上的语音助手 到自动驾驶汽车 再到最近火热的ChatGPT AI已经深刻改变了我们的生活方式
    但是 AI的发展也带来了一些挑战 比如就业市场的变化 隐私保护的考虑 以及AI伦理的问题
    这些都是我们需要认真思考的问题 今天我们就来深入讨论一下这些问题
    首先我们来看看AI对就业市场的影响 很多人担心AI会取代人类的工作 造成大量失业
    确实 一些重复性高 技术含量低的工作可能会被AI取代 但是AI也会创造出新的就业机会
    比如AI训练师 数据标注师 AI伦理专家等等 所以关键是我们要不断学习 提升自己的技能
    接下来我们来谈谈隐私保护的问题 AI需要大量的数据来训练和学习 这就涉及到个人隐私的问题
    我们需要在技术发展和隐私保护之间找到平衡 既要让AI发挥其价值 又要保护好我们的个人隐私
    最后我想说说AI伦理的问题 随着AI越来越智能 我们需要确保AI的行为符合人类的价值观和道德标准
    这需要科技公司 研究机构 政府以及全社会的共同努力
    好 以上就是今天节目的全部内容 感谢大家的收听 我们下期再见
    """

    # 计算字符数
    char_count = len(test_text)
    print(f"测试文本长度: {char_count} 字符")
    print(f"预计分块数: {char_count // 250 + 1} 块 (每块250字符)")
    print("=" * 80)

    # 发送请求
    url = "http://localhost:8001/api/v1/llm/polish"
    payload = {
        "raw_text": test_text,
        "topic": "人工智能播客",
        "keywords": ["人工智能", "AI", "就业", "隐私"]
    }

    print("🚀 开始LLM优化测试...")
    start_time = time.time()

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()

            end_time = time.time()
            elapsed_time = end_time - start_time

            result = response.json()
            polished_text = result.get("polished_text", "")
            model = result.get("model", "unknown")

            print("\n" + "=" * 80)
            print("✅ LLM优化完成!")
            print("=" * 80)
            print(f"模型: {model}")
            print(f"处理时间: {elapsed_time:.2f} 秒")
            print(f"原文长度: {char_count} 字符")
            print(f"优化后长度: {len(polished_text)} 字符")
            print(f"字符/秒: {char_count / elapsed_time:.2f}")

            # 速度评估
            if elapsed_time < 5:
                print("\n⭐ 性能评级: 优秀 (≤5秒)")
            elif elapsed_time < 10:
                print("\n⭐ 性能评级: 良好 (5-10秒)")
            elif elapsed_time < 20:
                print("\n⭐ 性能评级: 一般 (10-20秒)")
            else:
                print("\n⭐ 性能评级: 需要优化 (>20秒)")

            print("\n📊 优化效果预览:")
            print("-" * 80)
            print("原文:", test_text[:100] + "...")
            print("-" * 80)
            print("优化后:", polished_text[:100] + "...")
            print("-" * 80)

            return elapsed_time, char_count / elapsed_time

    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return None, None

async def main():
    """主测试函数"""
    print("=" * 80)
    print("LLM 优化速度测试 - 验证并发优化效果")
    print("=" * 80)
    print()

    # 运行测试
    elapsed_time, throughput = await test_llm_speed()

    if elapsed_time:
        print("\n" + "=" * 80)
        print("📈 测试结论")
        print("=" * 80)
        print(f"✓ 处理时间: {elapsed_time:.2f} 秒")
        print(f"✓ 处理速度: {throughput:.2f} 字符/秒")

        # 预期对比
        print("\n📊 优化前后对比:")
        print("优化前 (串行, 1并发): 预计 20-30 秒")
        print(f"优化后 (并发5): {elapsed_time:.2f} 秒")

        improvement = 25 / elapsed_time if elapsed_time > 0 else 0
        print(f"\n🚀 速度提升: {improvement:.1f}x")

        if improvement >= 2:
            print("✅ 达到 2x 提升目标!")
        else:
            print("⚠️  未达到 2x 目标，但仍有提升")

if __name__ == "__main__":
    asyncio.run(main())
