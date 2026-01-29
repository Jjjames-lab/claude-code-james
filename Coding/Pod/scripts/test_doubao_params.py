"""
测试豆包ASR参数：验证 enable_punc 和 show_utterances 是否生效
"""

import requests
import json
import sys

# 测试用的短音频（使用之前测试过的音频）
TEST_AUDIO_URL = "https://sf.xiaoyuzhoufm.com/transform/mp3/200000/s1/images/e79a5b2e6bb6a5f6e1dc5a69e76e6e5869fe79a84e59bbd/e79a5b2e6bb6a5f6e1dc5a69e76e6e5869fe79a84e59bbd.mp3"

def test_asr_parameters():
    """测试豆包ASR参数"""

    print("=" * 60)
    print("测试豆包ASR参数：enable_punc + show_utterances + model_version")
    print("=" * 60)

    # 调用转录API
    print(f"\n正在调用ASR API...")
    print(f"音频URL: {TEST_AUDIO_URL[:80]}...")

    try:
        response = requests.post(
            "http://localhost:8001/api/v1/asr/transcribe-url",
            data={
                "url": TEST_AUDIO_URL,
                "strategy": "fallback"
            },
            timeout=60  # 转录可能需要时间
        )

        if response.status_code != 200:
            print(f"\n❌ API调用失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            return False

        result = response.json()
        print(f"\n✅ API调用成功")

        # 检查返回的数据结构
        if not result.get("success"):
            print(f"\n❌ 转录失败: {result.get('message', 'Unknown error')}")
            return False

        data = result.get("data", {})

        # 1. 检查 utterances 是否存在
        utterances = data.get("utterances", [])
        print(f"\n📊 结果分析:")
        print(f"  - utterances 数量: {len(utterances)}")

        if len(utterances) == 0:
            print(f"\n❌ 没有返回 utterances，参数可能未生效")
            return False

        # 2. 分析前5条 utterances
        print(f"\n📝 前5条 utterances 详情:")
        total_punctuation = 0

        for i, utt in enumerate(utterances[:5]):
            text = utt.get("text", "")
            start = utt.get("start", 0)
            end = utt.get("end", 0)
            words = utt.get("words", [])

            # 统计标点符号
            punctuation_count = text.count('。') + text.count('！') + text.count('？') + text.count('，')
            total_punctuation += punctuation_count

            print(f"\n  [{i+1}] 文本: '{text[:50]}{'...' if len(text) > 50 else ''}'")
            print(f"      时间: {start}ms - {end}ms (时长: {end-start}ms)")
            print(f"      标点数: {punctuation_count}")
            print(f"      词级数据: {len(words)} words")

        # 3. 统计分析
        print(f"\n📈 统计结果:")
        print(f"  - 总 utterances: {len(utterances)}")
        print(f"  - 前5条标点总数: {total_punctuation}")
        print(f"  - 平均每条标点数: {total_punctuation / min(5, len(utterances)):.1f}")

        # 4. 判断测试结果
        if total_punctuation > 0:
            print(f"\n✅ 测试成功！标点符号已添加，enable_punc 参数生效")
            print(f"✅ utterances 数据已返回，show_utterances 参数生效")
            return True
        else:
            print(f"\n⚠️  utterances 已返回，但缺少标点符号")
            print(f"   可能原因：模型未正确添加标点，或音频内容本身无标点")
            return False

    except requests.exceptions.Timeout:
        print(f"\n❌ 请求超时")
        return False
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_asr_parameters()
    sys.exit(0 if success else 1)
