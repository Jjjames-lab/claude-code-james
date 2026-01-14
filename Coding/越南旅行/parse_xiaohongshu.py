#!/usr/bin/env python3
import re
import json

# 读取HTML文件
with open('xiaohongshu_search.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# 尝试查找嵌入的JSON数据
# 小红书通常会在页面中嵌入 __INITIAL_STATE__ 或类似的数据
json_pattern = r'window\.__INITIAL_STATE__\s*=\s*({.*?});'
matches = re.findall(json_pattern, html_content, re.DOTALL)

if matches:
    print("✅ 找到嵌入的JSON数据！")
    data = json.loads(matches[0])

    # 尝试提取笔记信息
    try:
        # 保存完整的JSON用于分析
        with open('xiaohongshu_data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("✅ JSON数据已保存到 xiaohongshu_data.json")

        # 尝试提取笔记列表
        if 'note' in str(data).lower():
            print("\n📝 数据中包含笔记信息")

        # 打印数据结构（前几层）
        print("\n🔍 数据结构预览：")
        for key in list(data.keys())[:10]:
            print(f"  - {key}")

    except Exception as e:
        print(f"❌ 解析JSON失败: {e}")
else:
    print("⚠️ 未找到 __INITIAL_STATE__")

    # 尝试其他可能的模式
    patterns = [
        r'window\.__INITIAL_STATE__\s*=\s*({.*?})\s*</script>',
        r'__INITIAL_STATE__\s*=\s*({.+?});',
        r'data-note-id="([^"]+)"',
        r'"noteId":"([^"]+)"',
        r'/explore/([0-9a-f]+)',
    ]

    for i, pattern in enumerate(patterns):
        matches = re.findall(pattern, html_content[:50000])  # 只检查前50KB
        if matches:
            print(f"✅ 模式 {i+1} 匹配到 {len(matches)} 条结果:")
            print(f"   示例: {matches[:3]}")
            break

    # 检查页面是否需要登录
    if '登录' in html_content and '注册' in html_content:
        print("\n⚠️ 页面可能需要登录才能查看完整内容")

    # 检查是否有笔记卡片
    if 'note-item' in html_content or 'note-card' in html_content:
        print("✅ 页面包含笔记卡片元素")
