"""
简单测试：检查豆包ASR是否返回utterances
"""

import requests
import json

# 测试健康检查
print("1. 检查服务健康状态...")
try:
    response = requests.get("http://localhost:8001/api/v1/health")
    print(f"   Status Code: {response.status_code}")
    print(f"   Response: {response.text[:200]}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Health: {data.get('status')}")
        print(f"   ASR服务: {data.get('services', {}).get('asr_doubao')}")
except Exception as e:
    print(f"   Error: {e}")

# 测试ASR引擎列表
print("\n2. 检查ASR引擎...")
try:
    response = requests.get("http://localhost:8001/api/v1/asr/engines")
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Engines: {json.dumps(data, indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"   Error: {e}")

# 测试转录（使用一个小音频文件）
print("\n3. 测试转录功能...")

# 使用之前测试过的音频URL
audio_url = "https://sf.xiaoyuzhoufm.com/transform/mp3/200000/s1/images/e79a5b2e6bb6a5f6e1dc5a69e76e6e5869fe79a84e59bbd/e79a5b2e6bb6a5f6e1dc5a69e76e6e5869fe79a84e59bbd.mp3"

print(f"   音频URL: {audio_url[:60]}...")
print("   正在调用API...")

try:
    response = requests.post(
        "http://localhost:8001/api/v1/asr/transcribe-url",
        data={"url": audio_url, "strategy": "fallback"},
        timeout=60
    )

    print(f"\n   响应状态码: {response.status_code}")

    if response.status_code == 200:
        result = response.json()
        print(f"   Success: {result.get('success')}")

        if result.get('success'):
            data = result.get('data', {})
            utterances = data.get('utterances', [])

            print(f"\n   ✅ 转录成功！")
            print(f"   - 总文本长度: {len(data.get('text', ''))} 字符")
            print(f"   - utterances 数量: {len(utterances)}")
            print(f"   - words 数量: {len(data.get('words', []))}")

            if len(utterances) > 0:
                print(f"\n   前3条 utterances:")
                for i, utt in enumerate(utterances[:3]):
                    text = utt.get('text', '')
                    print(f"   [{i+1}] '{text[:60]}{'...' if len(text) > 60 else ''}'")
                    print(f"       时间: {utt.get('start')}ms - {utt.get('end')}ms")
            else:
                print(f"\n   ⚠️  没有返回 utterances，参数可能未生效")
        else:
            print(f"   ❌ 失败: {result}")
    else:
        print(f"   ❌ 请求失败")
        print(f"   响应内容: {response.text[:500]}")

except Exception as e:
    print(f"\n   ❌ 异常: {e}")
    import traceback
    traceback.print_exc()
