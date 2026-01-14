#!/usr/bin/env python3
import subprocess
import json
import time

def open_and_extract(keyword, category_name):
    """打开搜索页面并提取数据"""
    print(f"\n📍 正在提取：{category_name}")
    print(f"   关键词：{keyword}")
    
    # 打开搜索页面（在新标签页）
    url = f"https://www.xiaohongshu.com/search_result?keyword={keyword}&type=51"
    subprocess.run(['open', '-a', 'Google Chrome', url], check=True)
    time.sleep(6)  # 等待页面加载
    
    # 提取笔记
    script = '''osascript << 'EOF'
tell application "Google Chrome"
    set theScript to "
    (() => {
        const noteCards = document.querySelectorAll('section[class*=\\"note-item\\"], section[class*=\\"feeds\\"], div[class*=\\"note\\"], a[href*=\\"/explore/\"]');
        const results = [];
        const seen = new Set();
        noteCards.forEach(card => {
            const link = card.href || card.querySelector('a[href*=\\"/explore/\\"]')?.href;
            if (link) {
                const match = link.match(/\\\\/explore\\\\/([0-9a-f]{24})/);
                if (match && !seen.has(match[1]) && results.length < 10) {
                    seen.add(match[1]);
                    let title = '';
                    const titleSelectors = ['.title', 'span[class*=\\"title\\"]', 'div[class*=\\"title\\"]'];
                    for (const selector of titleSelectors) {
                        const elem = card.querySelector(selector);
                        if (elem && elem.textContent.trim()) {
                            title = elem.textContent.trim();
                            break;
                        }
                    }
                    let author = card.querySelector('[class*=\\"author\\"], [class*=\\"nickname\\"]')?.textContent?.trim() || '';
                    let likes = card.querySelector('[class*=\\"like\\"], [class*=\\"count\\"]')?.textContent?.trim() || '';
                    results.push({noteId: match[1], link: link, title: title || '未获取到标题', author: author, likes: likes});
                }
            }
        });
        return JSON.stringify(results);
    })()
    "
    execute front window's active tab javascript theScript
end tell
EOF'''
    
    result = subprocess.run(script, shell=True, capture_output=True, text=True)
    
    try:
        output = result.stdout.strip()
        if output and output[0] == '[':
            notes = json.loads(output)
            print(f"   ✅ 成功提取 {len(notes)} 条笔记")
            return notes
        else:
            print(f"   ⚠️ 未提取到有效数据")
            return []
    except Exception as e:
        print(f"   ❌ 解析失败: {str(e)[:100]}")
        return []

# 富国岛12个维度
phu_quoc = [
    ("富国岛酒店推荐", "住宿推荐"),
    ("富国岛咖啡店", "咖啡文化"),
    ("富国岛美食推荐", "美食餐厅"),
    ("富国岛景点打卡", "景点打卡"),
    ("富国岛潜水出海", "潜水/出海"),
    ("富国岛cooking class", "烹饪/手工"),
    ("富国岛户外运动", "户外运动"),
    ("富国岛日落观赏", "日落观赏点"),
    ("富国岛按摩SPA", "SPA/按摩"),
    ("富国岛拍照圣地", "拍照圣地"),
    ("富国岛交通攻略", "交通攻略"),
    ("富国岛避雷指南", "避雷指南")
]

print("="*60)
print("🏝️  开始提取富国岛数据（12个维度）")
print("="*60)

data = {}
for keyword, category in phu_quoc:
    notes = open_and_extract(keyword, category)
    data[category] = notes
    
    # 显示前2条
    for note in notes[:2]:
        print(f"      - {note['title'][:50]}...")
    
    # 每次保存
    with open('vietnam_data.json', 'w', encoding='utf-8') as f:
        json.dump({"富国岛": data}, f, ensure_ascii=False, indent=2)

print(f"\n{'='*60}")
print("✅ 富国岛提取完成！")
print(f"   数据已保存到：vietnam_data.json")
print(f"{'='*60}")

total = sum(len(v) for v in data.values())
print(f"\n📊 总计提取 {total} 条笔记")
