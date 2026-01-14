#!/bin/bash

# 快速提取脚本 - 12次搜索
extract() {
    local kw="$1"
    local name="$2"
    echo "📍 [$3/12] $name"
    open -a "Google Chrome" "https://www.xiaohongshu.com/search_result?keyword=${kw}&type=51" > /dev/null 2>&1
    sleep 5
    osascript - 'osascript << 'EOF'
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
EOF' 2>/dev/null | python3 -c "import sys,json; data=json.load(sys.stdin); print(f'✅ {len(data)}条'); [print(f'   - {n[\"title\"][:40]}...') for n in data[:2]]" 2>/dev/null || echo "⚠️ 提取失败"
}

echo "🚀 开始提取核心数据..."
echo "================================================"

# 12次搜索
extract "富国岛酒店推荐" "富国岛-住宿" "1"
extract "富国岛美食推荐" "富国岛-美食" "2"
extract "富国岛景点打卡" "富国岛-景点" "3"

extract "大叻酒店推荐" "大叻-住宿" "4"
extract "大叻美食推荐" "大叻-美食" "5"
extract "大叻景点打卡" "大叻-景点" "6"

extract "胡志明酒店推荐" "胡志明-住宿" "7"
extract "胡志明美食推荐" "胡志明-美食" "8"
extract "胡志明景点打卡" "胡志明-景点" "9"

extract "芽庄酒店推荐" "芽庄-住宿" "10"
extract "芽庄美食推荐" "芽庄-美食" "11"
extract "芽庄景点打卡" "芽庄-景点" "12"

echo ""
echo "================================================"
echo "🎉 核心数据提取完成！"
