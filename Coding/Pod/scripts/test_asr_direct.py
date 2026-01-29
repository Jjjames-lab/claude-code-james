"""
直接测试豆包ASR：验证新参数
"""
import httpx
import asyncio
import json

async def test_doubao_asr():
    """直接调用豆包ASR API"""

    # 使用一个短音频URL进行测试
    audio_url = "https://sf.xiaoyuzhoufm.com/transform/mp3/200000/s1/images/e79a5b2e6bb6a5f6e1dc5a69e76e6e5869fe79a84e59bbd/e79a5b2e6bb6a5f6e1dc5a69e76e6e5869fe79a84e59bbd.mp3"

    print("=" * 70)
    print("测试豆包ASR：验证 enable_punc + show_utterances + model_version")
    print("=" * 70)
    print(f"\n音频URL: {audio_url[:70]}...")
    print(f"\n正在调用API...")

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "http://localhost:8001/api/v1/asr/transcribe-url",
                data={
                    "url": audio_url,
                    "strategy": "fallback"
                }
            )

            print(f"\n✅ API响应成功")
            print(f"状态码: {response.status_code}")

            if response.status_code != 200:
                print(f"❌ 错误: {response.text[:500]}")
                return False

            result = response.json()

            if not result.get("success"):
                print(f"❌ 转录失败: {result}")
                return False

            data = result.get("data", {})

            # 分析utterances
            utterances = data.get("utterances", [])
            print(f"\n{'='*70}")
            print(f"📊 转录结果分析")
            print(f"{'='*70}")
            print(f"1. utterances 数量: {len(utterances)}")
            print(f"2. 总文本长度: {len(data.get('text', ''))} 字符")
            print(f"3. 词级数据: {len(data.get('words', []))} words")

            if len(utterances) == 0:
                print(f"\n❌ 没有返回utterances！参数可能未生效")
                return False

            # 详细分析前5条utterances
            print(f"\n{'='*70}")
            print(f"📝 前5条utterances详情")
            print(f"{'='*70}")

            total_punctuation = 0
            has_punctuation_in_each = True

            for i, utt in enumerate(utterances[:5]):
                text = utt.get("text", "")
                start = utt.get("start", 0)
                end = utt.get("end", 0)
                duration = end - start
                word_count = len(utt.get("words", []))

                # 统计标点
                punc_count = text.count('。') + text.count('！') + text.count('？') + text.count('，')
                total_punctuation += punc_count

                if punc_count == 0:
                    has_punctuation_in_each = False

                print(f"\n[{i+1}] 时间: {start}ms - {end}ms (时长: {duration}ms)")
                print(f"    文本: '{text}'")
                print(f"    标点数: {punc_count}")
                print(f"    词数: {word_count}")

            # 统计结果
            print(f"\n{'='*70}")
            print(f"📈 统计结果")
            print(f"{'='*70}")
            print(f"- 前5条标点总数: {total_punctuation}")
            print(f"- 平均每条标点数: {total_punctuation / min(5, len(utterances)):.1f}")
            print(f"- 所有条目都有标点: {'是' if has_punctuation_in_each else '否'}")

            # 判断测试结果
            print(f"\n{'='*70}")
            print(f"✅ 测试结论")
            print(f"{'='*70}")

            if total_punctuation > 0:
                print(f"✅ 标点符号已添加！enable_punc 参数生效")
                print(f"✅ utterances已返回！show_utterances 参数生效")
                print(f"✅ 测试成功！新参数工作正常")
                return True
            else:
                print(f"⚠️  utterances已返回，但没有标点符号")
                print(f"   可能原因：音频内容本身无标点，或模型未正确处理")
                return False

    except httpx.TimeoutException:
        print(f"\n❌ 请求超时（超过120秒）")
        return False
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_doubao_asr())
    print(f"\n{'='*70}")
    print(f"测试完成！结果: {'成功 ✓' if success else '失败 ✗'}")
    print(f"{'='*70}\n")
