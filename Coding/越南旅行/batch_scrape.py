#!/usr/bin/env python3
"""
批量提取小红书笔记数据
"""
import subprocess
import json
import time

# 定义搜索关键词映射
search_keywords = {
    "富国岛": {
        "住宿推荐": "富国岛酒店",
        "咖啡文化": "富国岛咖啡",
        "美食餐厅": "富国岛美食",
        "景点打卡": "富国岛景点",
        "潜水/出海": "富国岛潜水",
        "烹饪/手工": "富国岛cooking class",
        "户外运动": "富国岛户外",
        "日落观赏点": "富国岛日落",
        "SPA/按摩": "富国岛SPA",
        "拍照圣地": "富国岛拍照",
        "交通攻略": "富国岛交通",
        "避雷指南": "富国岛避雷"
    },
    "大叻": {
        "住宿推荐": "大叻酒店",
        "咖啡文化": "大叻咖啡",
        "美食餐厅": "大叻美食",
        "景点打卡": "大叻景点",
        "潜水/出海": "大叻户外",
        "烹饪/手工": "大叻cooking class",
        "户外运动": "大叻徒步",
        "日落观赏点": "大叻日落",
        "SPA/按摩": "大叻按摩",
        "拍照圣地": "大叻拍照",
        "交通攻略": "大叻交通",
        "避雷指南": "大叻避雷"
    },
    "胡志明市": {
        "住宿推荐": "胡志明酒店",
        "咖啡文化": "胡志明咖啡",
        "美食餐厅": "胡志明美食",
        "景点打卡": "胡志明景点",
        "潜水/出海": "胡志明出海",
        "烹饪/手工": "胡志明cooking class",
        "户外运动": "胡志明户外",
        "日落观赏点": "胡志明日落",
        "SPA/按摩": "胡志明SPA",
        "拍照圣地": "胡志明拍照",
        "交通攻略": "胡志明交通",
        "避雷指南": "胡志明避雷"
    },
    "芽庄市": {
        "住宿推荐": "芽庄酒店",
        "咖啡文化": "芽庄咖啡",
        "美食餐厅": "芽庄美食",
        "景点打卡": "芽庄景点",
        "潜水/出海": "芽庄潜水",
        "烹饪/手工": "芽庄cooking class",
        "户外运动": "芽庄户外",
        "日落观赏点": "芽庄日落",
        "SPA/按摩": "芽庄按摩",
        "拍照圣地": "芽庄拍照",
        "交通攻略": "芽庄交通",
        "避雷指南": "芽庄避雷"
    }
}

def open_search_page(city, category, keyword):
    """在Chrome中打开搜索页面"""
    url = f"https://www.xiaohongshu.com/search_result?keyword={keyword}&type=51"
    subprocess.run(['open', '-a', 'Google Chrome', url], check=True)
    time.sleep(5)  # 等待页面加载

def extract_notes():
    """从Chrome提取笔记数据"""
    script = '''
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
    '''
    result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
    try:
        notes = json.loads(result.stdout)
        return notes
    except:
        return []

if __name__ == "__main__":
    # 测试：提取富国岛潜水数据
    city = "富国岛"
    category = "潜水/出海"
    keyword = search_keywords[city][category]

    print(f"📍 正在搜索：{city} - {category}")
    print(f"   关键词：{keyword}")

    open_search_page(city, category, keyword)
    notes = extract_notes()

    print(f"✅ 提取到 {len(notes)} 条笔记")
    for note in notes[:3]:
        print(f"   - {note['title']}")

    # 保存数据
    with open('test_extraction.json', 'w', encoding='utf-8') as f:
        json.dump(notes, f, ensure_ascii=False, indent=2)
