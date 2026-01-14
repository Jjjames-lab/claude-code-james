#!/bin/bash
# 单次提取脚本
KEYWORD="$1"
echo "📍 [$1] 正在提取：$KEYWORD"

# 打开Chrome
open -a "Google Chrome" "https://www.xiaohongshu.com/search_result?keyword=${KEYWORD}&type=51"
sleep 5

# 提取笔记
osascript << 'EOF' | python3 -c "import sys, json; print(json.dumps(json.loads(sys.stdin.read()), ensure_ascii=False))"
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
EOF
