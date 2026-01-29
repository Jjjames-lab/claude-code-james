#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试LLM并发处理效果
"""

import asyncio
import time
import httpx

async def test_concurrent_processing():
    """测试并发处理效果"""

    # 创建不同长度的测试文本
    test_cases = [
        ("短文本", "大家好 欢迎收听今天的节目 我是主持人小王"),
        ("中文本", "大家好 欢迎收听今天的播客节目 我是主持人小王 今天我们要聊一个非常有趣的话题 今天我们要讲的是关于人工智能的发展以及对未来的影响 首先我想问问大家 你们对人工智能有什么看法呢 我觉得人工智能确实是当下最热门的话题之一"),
        ("长文本", "大家好 欢迎收听今天的播客节目 我是主持人小王 今天我们要聊一个非常有趣的话题 今天我们要讲的是关于人工智能的发展以及对未来的影响 首先我想问问大家 你们对人工智能有什么看法呢 我觉得人工智能确实是当下最热门的话题之一 无论是在科技圈还是在日常生活中 我们都能看到AI的影子 从智能手机上的语音助手 到自动驾驶汽车 再到最近火热的ChatGPT AI已经深刻改变了我们的生活方式 但是 AI的发展也带来了一些挑战 比如就业市场的变化 隐私保护的考虑 以及AI伦理的问题 这些都是我们需要认真思考的问题 今天我们就来深入讨论一下这些问题 首先我们来看看AI对就业市场的影响 很多人担心AI会取代人类的工作 造成大量失业 确实 一些重复性高 技术含量低的工作可能会被AI取代 但是AI也会创造出新的就业机会 比如AI训练师 数据标注师 AI伦理专家等等 所以关键是我们要不断学习 提升自己的技能 接下来我们来谈谈隐私保护的问题 AI需要大量的数据来训练和学习 这就涉及到个人隐私的问题 我们需要在技术发展和隐私保护之间找到平衡 既要让AI发挥其价值 又要保护好我们的个人隐私 最后我想说说AI伦理的问题 随着AI越来越智能 我们需要确保AI的行为符合人类的价值观和道德标准 这需要科技公司 研究机构 政府以及全社会的共同努力 好 以上就是今天节目的全部内容 感谢大家的收听 我们下期再见"),
    ]

    url = "http://localhost:8001/api/v1/llm/polish"

    print("=" * 80)
    print("LLM 并发处理效果测试")
    print("=" * 80)

    results = []

    for name, text in test_cases:
        char_count = len(text)
        print(f"\n📝 测试案例: {name} ({char_count} 字符)")

        # 估算分块数
        chunk_size = 250  # GLM每块250字符
        estimated_chunks = (char_count + chunk_size - 1) // chunk_size
        print(f"   估算分块数: {estimated_chunks} 块")

        payload = {
            "raw_text": text,
            "topic": f"测试-{name}",
            "keywords": ["测试"]
        }

        start_time = time.time()

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()

                elapsed = time.time() - start_time
                result = response.json()
                polished = result.get("polished_text", "")

                throughput = char_count / elapsed

                print(f"   ✅ 处理时间: {elapsed:.2f} 秒")
                print(f"   ✅ 处理速度: {throughput:.2f} 字符/秒")
                print(f"   ✅ 优化后长度: {len(polished)} 字符")

                results.append({
                    "name": name,
                    "chars": char_count,
                    "time": elapsed,
                    "throughput": throughput,
                    "chunks": estimated_chunks
                })

        except Exception as e:
            print(f"   ❌ 处理失败: {e}")

    # 总结
    print("\n" + "=" * 80)
    print("📊 测试总结")
    print("=" * 80)

    if results:
        avg_throughput = sum(r["throughput"] for r in results) / len(results)
        print(f"\n平均处理速度: {avg_throughput:.2f} 字符/秒")

        print("\n详细结果:")
        for r in results:
            print(f"  {r['name']:8s}: {r['chars']:4d}字符 → {r['time']:6.2f}秒 ({r['throughput']:6.2f}字符/秒)")

        print("\n📈 并发优化效果:")
        print("  - 预计分块数:", max(r["chunks"] for r in results), "块")
        print("  - 支持并发数: 5 个")
        print("  - 预期提升: ~2-5x (取决于分块数)")

        # 速度评估
        if avg_throughput > 100:
            print("\n⭐ 性能评级: 优秀 (>100 字符/秒)")
        elif avg_throughput > 50:
            print("\n⭐ 性能评级: 良好 (50-100 字符/秒)")
        elif avg_throughput > 20:
            print("\n⭐ 性能评级: 一般 (20-50 字符/秒)")
        else:
            print("\n⭐ 性能评级: 需要优化 (<20 字符/秒)")

        return results

async def main():
    await test_concurrent_processing()

if __name__ == "__main__":
    asyncio.run(main())
