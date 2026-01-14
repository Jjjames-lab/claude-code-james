#!/usr/bin/env python3
"""
从Chrome所有打开的标签页提取小红书笔记
"""
import subprocess
import json
import time

def extract_from_current_tab():
    """从当前活动标签页提取"""
    script = '''osascript << 'EOF'
tell application "Google Chrome"
    set theScript to "
    (() => {
        const noteCards = document.querySelectorAll('section[class*=\"note-item\"], section[class*=\"feeds\"], div[class*=\"note\"], a[href*=\"/explore/\"]');
        const results = [];
        const seen = new Set();

        noteCards.forEach(card => {
            const link = card.href || card.querySelector('a[href*=\"/explore/\"]')?.href;
            if (link) {
                const match = link.match(/\\/explore\\/([0-9a-f]{24})/);
                if (match && !seen.has(match[1]) && results.length < 10) {
                    seen.add(match[1]);
                    let title = '';
                    const titleSelectors = ['.title', 'span[class*=\"title\"]', 'div[class*=\"title\"]'];
                    for (const selector of titleSelectors) {
                        const elem = card.querySelector(selector);
                        if (elem && elem.textContent.trim()) {
                            title = elem.textContent.trim();
                            break;
                        }
                    }
                    let author = card.querySelector('[class*=\"author\"], [class*=\"nickname\"]')?.textContent?.trim() || '';
                    let likes = card.querySelector('[class*=\"like\"], [class*=\"count\"]')?.textContent?.trim() || '';
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
        # 清理输出中的可能的BOM和额外字符
        output = result.stdout.strip()
        if output.startswith('['):
            notes = json.loads(output)
            return notes
        return []
    except:
        return []

def switch_to_tab(tab_index):
    """切换到指定标签页（从右往左数）"""
    script = f'''osascript << 'EOF'
tell application "Google Chrome"
    tell window 1
        set active tab index to (count of tabs) - {tab_index} + 1
    end tell
end tell
EOF'''
    subprocess.run(script, shell=True)
    time.sleep(1)

def main():
    print("🔄 开始从所有标签页提取数据...\n")

    all_data = {}

    # 获取当前标签页数量
    count_script = '''osascript << 'EOF'
tell application "Google Chrome"
    return count of tabs of window 1
end tell
EOF'''
    result = subprocess.run(count_script, shell=True, capture_output=True, text=True)
    try:
        tab_count = int(result.stdout.strip())
        print(f"✅ 检测到 {tab_count} 个标签页\n")
    except:
        tab_count = 12
        print(f"⚠️ 无法获取标签页数量，默认使用12个\n")

    # 从右往左逐个提取（因为我们刚打开的页面在右边）
    for i in range(tab_count):
        print(f"[{i+1}/{tab_count}] 正在提取标签页 {i+1}...")
        switch_to_tab(i)
        notes = extract_from_current_tab()

        if notes:
            # 从页面标题或URL推断类别
            page_info_script = '''osascript << 'EOF'
tell application "Google Chrome"
    return URL of active tab of front window
end tell
EOF'''
            url_result = subprocess.run(page_info_script, shell=True, capture_output=True, text=True)
            url = url_result.stdout.strip() if url_result.stdout else ""

            # 尝试从URL提取类别信息
            category = f"类别{i+1}"
            if "keyword=" in url:
                try:
                    keyword = url.split("keyword=")[1].split("&")[0]
                    import urllib.parse
                    category = urllib.parse.unquote(keyword)
                except:
                    pass

            all_data[category] = notes
            print(f"   ✅ 提取到 {len(notes)} 条笔记 - {category}")
            for note in notes[:2]:
                print(f"      - {note['title'][:50]}...")
        else:
            print(f"   ⚠️ 未提取到笔记")

        time.sleep(0.5)

    # 保存数据
    with open('phu_quoc_data.json', 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 数据已保存到 phu_quoc_data.json")
    print(f"   总计提取 {sum(len(v) for v in all_data.values())} 条笔记")

if __name__ == "__main__":
    main()
