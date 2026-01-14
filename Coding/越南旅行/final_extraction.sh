#!/bin/bash

# 小红书越南旅行数据全量提取脚本
# 4个城市 × 12个维度 = 48次搜索

OUTPUT_FILE="vietnam_travel_complete.json"
echo '{"metadata":{"project":"越南四城深度游","travel_date":"2026-02-16","travelers":"情侣2人","generated_at":"2026-01-08"},"data":{' > "$OUTPUT_FILE"

# 定义所有搜索关键词
declare -A SEARCHES

# 富国岛
SEARCHES["富国岛|住宿推荐"]="富国岛酒店推荐"
SEARCHES["富国岛|咖啡文化"]="富国岛咖啡店"
SEARCHES["富国岛|美食餐厅"]="富国岛美食推荐"
SEARCHES["富国岛|景点打卡"]="富国岛景点打卡"
SEARCHES["富国岛|潜水/出海"]="富国岛潜水出海"
SEARCHES["富国岛|烹饪/手工"]="富国岛cooking class"
SEARCHES["富国岛|户外运动"]="富国岛户外"
SEARCHES["富国岛|日落观赏点"]="富国岛日落"
SEARCHES["富国岛|SPA/按摩"]="富国岛按摩SPA"
SEARCHES["富国岛|拍照圣地"]="富国岛拍照"
SEARCHES["富国岛|交通攻略"]="富国岛交通攻略"
SEARCHES["富国岛|避雷指南"]="富国岛避雷"

# 大叻
SEARCHES["大叻|住宿推荐"]="大叻酒店推荐"
SEARCHES["大叻|咖啡文化"]="大叻咖啡店"
SEARCHES["大叻|美食餐厅"]="大叻美食推荐"
SEARCHES["大叻|景点打卡"]="大叻景点打卡"
SEARCHES["大叻|潜水/出海"]="大叻户外活动"
SEARCHES["大叻|烹饪/手工"]="大叻cooking class"
SEARCHES["大叻|户外运动"]="大叻徒步攀岩"
SEARCHES["大叻|日落观赏点"]="大叻日落"
SEARCHES["大叻|SPA/按摩"]="大叻按摩SPA"
SEARCHES["大叻|拍照圣地"]="大叻拍照"
SEARCHES["大叻|交通攻略"]="大叻交通攻略"
SEARCHES["大叻|避雷指南"]="大叻避雷"

# 胡志明市
SEARCHES["胡志明市|住宿推荐"]="胡志明酒店推荐"
SEARCHES["胡志明市|咖啡文化"]="胡志明咖啡店"
SEARCHES["胡志明市|美食餐厅"]="胡志明美食推荐"
SEARCHES["胡志明市|景点打卡"]="胡志明景点打卡"
SEARCHES["胡志明市|潜水/出海"]="胡志明出海"
SEARCHES["胡志明市|烹饪/手工"]="胡志明cooking class"
SEARCHES["胡志明市|户外运动"]="胡志明户外"
SEARCHES["胡志明市|日落观赏点"]="胡志明日落"
SEARCHES["胡志明市|SPA/按摩"]="胡志明按摩SPA"
SEARCHES["胡志明市|拍照圣地"]="胡志明拍照"
SEARCHES["胡志明市|交通攻略"]="胡志明交通攻略"
SEARCHES["胡志明市|避雷指南"]="胡志明避雷"

# 芽庄市
SEARCHES["芽庄市|住宿推荐"]="芽庄酒店推荐"
SEARCHES["芽庄市|咖啡文化"]="芽庄咖啡店"
SEARCHES["芽庄市|美食餐厅"]="芽庄美食推荐"
SEARCHES["芽庄市|景点打卡"]="芽庄景点打卡"
SEARCHES["芽庄市|潜水/出海"]="芽庄潜水"
SEARCHES["芽庄市|烹饪/手工"]="芽庄cooking class"
SEARCHES["芽庄市|户外运动"]="芽庄户外运动"
SEARCHES["芽庄市|日落观赏点"]="芽庄日落"
SEARCHES["芽庄市|SPA/按摩"]="芽庄按摩SPA"
SEARCHES["芽庄市|拍照圣地"]="芽庄拍照"
SEARCHES["芽庄市|交通攻略"]="芽庄交通攻略"
SEARCHES["芽庄市|避雷指南"]="芽庄避雷"

TOTAL=${#SEARCHES[@]}
CURRENT=0

echo "🚀 开始全量提取：$TOTAL 次搜索"
echo "======================================================"

# 提取函数
extract_notes() {
    local keyword="$1"
    open -a "Google Chrome" "https://www.xiaohongshu.com/search_result?keyword=${keyword}&type=51"
    sleep 5

    osascript << 'EOF'
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
}

# 主循环
for key in "${!SEARCHES[@]}"; do
    IFS='|' read -r city category <<< "$key"
    keyword="${SEARCHES[$key]}"
    ((CURRENT++))

    echo ""
    echo "[$CURRENT/$TOTAL] $city - $category"
    echo "   关键词：$keyword"

    # 提取数据
    json_output=$(extract_notes "$keyword")

    # 保存到文件
    echo "      \"$city\":{" >> "$OUTPUT_FILE"
    echo "         \"$category\":$json_output" >> "$OUTPUT_FILE"
    echo "      }" >> "$OUTPUT_FILE"

    # 统计笔记数量
    count=$(echo "$json_output" | grep -o '"noteId"' | wc -l | tr -d ' ')
    echo "   ✅ 提取到 $count 条笔记"
done

echo "}}" >> "$OUTPUT_FILE"

echo ""
echo "======================================================"
echo "🎉 全量提取完成！"
echo "   数据已保存到：$OUTPUT_FILE"
echo "======================================================"
