#!/usr/bin/env python3
"""
全量提取小红书越南旅行数据
4个城市 × 12个维度 = 48次搜索
"""
import subprocess
import json
import time

# 定义所有搜索关键词
search_config = {
    "富国岛": {
        "住宿推荐": "富国岛酒店推荐",
        "咖啡文化": "富国岛咖啡",
        "美食餐厅": "富国岛美食",
        "景点打卡": "富国岛景点",
        "潜水/出海": "富国岛潜水出海",
        "烹饪/手工": "富国岛cooking class",
        "户外运动": "富国岛户外",
        "日落观赏点": "富国岛日落",
        "SPA/按摩": "富国岛SPA",
        "拍照圣地": "富国岛拍照",
        "交通攻略": "富国岛交通",
        "避雷指南": "富国岛避雷"
    },
    "大叻": {
        "住宿推荐": "大叻酒店推荐",
        "咖啡文化": "大叻咖啡店",
        "美食餐厅": "大叻美食",
        "景点打卡": "大叻景点",
        "潜水/出海": "大叻户外活动",
        "烹饪/手工": "大叻cooking class",
        "户外运动": "大叻徒步攀岩",
        "日落观赏点": "大叻日落",
        "SPA/按摩": "大叻按摩SPA",
        "拍照圣地": "大叻拍照",
        "交通攻略": "大叻交通",
        "避雷指南": "大叻避雷"
    },
    "胡志明市": {
        "住宿推荐": "胡志明酒店推荐",
        "咖啡文化": "胡志明咖啡",
        "美食餐厅": "胡志明美食",
        "景点打卡": "胡志明景点",
        "潜水/出海": "胡志明出海",
        "烹饪/手工": "胡志明cooking class",
        "户外运动": "胡志明户外",
        "日落观赏点": "胡志明日落",
        "SPA/按摩": "胡志明SPA按摩",
        "拍照圣地": "胡志明拍照",
        "交通攻略": "胡志明交通",
        "避雷指南": "胡志明避雷"
    },
    "芽庄市": {
        "住宿推荐": "芽庄酒店推荐",
        "咖啡文化": "芽庄咖啡",
        "美食餐厅": "芽庄美食",
        "景点打卡": "芽庄景点",
        "潜水/出海": "芽庄潜水",
        "烹饪/手工": "芽庄cooking class",
        "户外运动": "芽庄户外运动",
        "日落观赏点": "芽庄日落",
        "SPA/按摩": "芽庄按摩SPA",
        "拍照圣地": "芽庄拍照",
        "交通攻略": "芽庄交通",
        "避雷指南": "芽庄避雷"
    }
}

def open_search_page(keyword):
    """打开Chrome搜索页面"""
    url = f"https://www.xiaohongshu.com/search_result?keyword={keyword}&type=51"
    subprocess.run(['open', '-a', 'Google Chrome', url], check=True)
    time.sleep(5)  # 等待页面加载

def extract_notes_from_chrome():
    """从Chrome提取笔记数据"""
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
        notes = json.loads(result.stdout.strip())
        return notes
    except json.JSONDecodeError:
        print(f"⚠️ JSON解析失败，原始输出: {result.stdout[:200]}")
        return []

def main():
    # 加载已有数据
    try:
        with open('vietnam_travel_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        data = {
            "metadata": {
                "project": "越南四城深度游",
                "travel_date": "2026-02-16",
                "travelers": "情侣2人",
                "generated_at": "2026-01-08"
            },
            "data": {}
        }

    total_searches = sum(len(cats) for cats in search_config.values())
    completed = 0

    print("="*60)
    print("🚀 开始全量提取小红书数据")
    print(f"   总计：{total_searches} 次搜索")
    print("="*60 + "\n")

    for city, categories in search_config.items():
        print(f"\n{'='*60}")
        print(f"📍 城市：{city}")
        print(f"{'='*60}")

        if city not in data['data']:
            data['data'][city] = {}

        for category, keyword in categories.items():
            completed += 1
            print(f"\n[{completed}/{total_searches}] 正在提取：{city} - {category}")
            print(f"   关键词：{keyword}")

            # 打开搜索页面
            open_search_page(keyword)

            # 提取笔记
            notes = extract_notes_from_chrome()

            if notes:
                data['data'][city][category] = notes
                print(f"   ✅ 成功提取 {len(notes)} 条笔记")
                # 显示前3条
                for note in notes[:3]:
                    print(f"      - {note['title']}")
            else:
                data['data'][city][category] = []
                print(f"   ⚠️ 未提取到笔记")

            # 每次提取后保存数据（防止中断丢失）
            with open('vietnam_travel_data.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            # 短暂延迟，避免请求过快
            time.sleep(1)

    print(f"\n{'='*60}")
    print("🎉 全量提取完成！")
    print(f"   数据已保存到：vietnam_travel_data.json")
    print(f"{'='*60}\n")

    # 统计
    total_notes = sum(
        len(city_data.get(category, []))
        for city_data in data['data'].values()
        for category in search_config[list(search_config.keys())[0]].keys()
    )
    print(f"📊 总计提取到 {total_notes} 条笔记")

if __name__ == "__main__":
    main()
