#!/usr/bin/env python3
"""
方法B的替代方案：
让用户在Chrome中复制小红书页面的内容，然后我来解析
"""

import json
import sys

def parse_xiaohongshu_content(text_content):
    """
    解析从小红书页面复制的内容
    """
    print("✅ 收到内容，开始解析...")

    # 提取可能的笔记链接
    import re

    # 匹配小红书笔记ID (通常是24位十六进制字符)
    note_ids = re.findall(r'/explore/([0-9a-f]{24})', text_content)
    print(f"📊 找到 {len(note_ids)} 个笔记ID")

    if note_ids:
        notes = []
        for note_id in note_ids[:20]:  # 只处理前20个
            notes.append({
                'noteId': note_id,
                'link': f'https://www.xiaohongshu.com/explore/{note_id}'
            })

        # 保存结果
        with open('extracted_notes.json', 'w', encoding='utf-8') as f:
            json.dump(notes, f, ensure_ascii=False, indent=2)

        print(f"\n✅ 成功提取 {len(notes)} 条笔记:")
        for i, note in enumerate(notes[:10], 1):
            print(f"{i}. {note['link']}")

        print(f"\n✅ 完整数据已保存到 extracted_notes.json")
        return notes
    else:
        print("⚠️ 未找到笔记ID，尝试其他方法...")

        # 尝试提取标题
        titles = re.findall(r'[^、。\n]{5,30}', text_content)
        if titles:
            print(f"\n📝 可能的标题 ({len(titles)} 个):")
            for i, title in enumerate(titles[:10], 1):
                print(f"{i}. {title.strip()}")

        return []

if __name__ == "__main__":
    print("📋 小红书内容提取工具")
    print("\n请按以下步骤操作：")
    print("1. 在Chrome中打开小红书搜索结果页面")
    print("2. 全选页面内容 (Cmd+A)")
    print("3. 复制 (Cmd+C)")
    print("4. 在终端粘贴内容")
    print("\n等待您输入内容...\n")

    # 读取从标准输入的内容
    content = sys.stdin.read()

    if content.strip():
        parse_xiaohongshu_content(content)
    else:
        print("❌ 未收到内容")
