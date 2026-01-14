#!/usr/bin/env python3
"""
修复版：合并数据并生成HTML仪表板 + CSV
"""
import json
import csv
import os
from pathlib import Path
import re

# 读取所有JSON文件
all_data = {}
data_dir = Path("data_collection")

# 遍历所有JSON文件
for filepath in data_dir.glob("*.json"):
    filename = filepath.name

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            notes = json.load(f)

            if not notes:
                continue

            # 从文件名解析城市和类别
            # 格式：数字_城市_类别.json
            parts = filename.replace('.json', '').split('_')

            if len(parts) >= 3:
                # 城市名称（可能包含下划线）
                city_match = re.match(r'\d+_(.+?)_(.+)', filename.replace('.json', ''))
                if city_match:
                    city = city_match.group(1)
                    category_raw = city_match.group(2)

                    # 标准化类别名称
                    category_mapping = {
                        '住宿': '住宿推荐',
                        '美食': '美食餐厅',
                        '景点': '景点打卡',
                        '住宿推荐': '住宿推荐',
                        '美食推荐': '美食餐厅',
                        '景点打卡': '景点打卡'
                    }
                    category = category_mapping.get(category_raw, category_raw)

                    if city not in all_data:
                        all_data[city] = {}

                    all_data[city][category] = notes
                    print(f"✅ {city} - {category}: {len(notes)}条")
    except Exception as e:
        print(f"⚠️ 处理 {filename} 失败: {e}")

print(f"\n✅ 成功读取 {len(all_data)} 个城市的数据")

# 统计
total_notes = sum(
    len(category_data)
    for city_data in all_data.values()
    for category_data in city_data.values()
)
print(f"📊 总计 {total_notes} 条笔记")

# 保存完整JSON
with open('vietnam_travel_complete.json', 'w', encoding='utf-8') as f:
    json.dump({
        "metadata": {
            "project": "越南四城深度游",
            "travel_date": "2026-02-16",
            "travelers": "情侣2人",
            "cities": list(all_data.keys()),
            "total_notes": total_notes,
            "generated_at": "2026-01-08"
        },
        "data": all_data
    }, f, ensure_ascii=False, indent=2)

print("✅ 完整数据已保存到：vietnam_travel_complete.json")

# 生成CSV
with open('vietnam_travel.csv', 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['城市', '维度', '项目名称', '小红书链接', '点赞数', '作者', '推荐理由'])

    for city, categories in all_data.items():
        for category, notes in categories.items():
            for note in notes:
                writer.writerow([
                    city,
                    category,
                    note['title'],
                    note['link'],
                    note['likes'],
                    note['author'],
                    f"小红书{note['likes']}人点赞"
                ])

print("✅ CSV文件已保存到：vietnam_travel.csv")

# 生成HTML仪表板
html_template = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>越南四城深度游 - 旅行顾问</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        header {
            background: white;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }

        h1 {
            color: #667eea;
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .subtitle {
            color: #666;
            font-size: 1.1em;
        }

        .stats {
            display: flex;
            gap: 20px;
            margin-top: 20px;
        }

        .stat-item {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: bold;
        }

        .controls {
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
        }

        .control-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        label {
            font-weight: 600;
            color: #333;
        }

        select, input {
            padding: 10px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
        }

        .city-section {
            background: white;
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }

        .city-title {
            color: #667eea;
            font-size: 2em;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
        }

        .category {
            margin-bottom: 25px;
        }

        .category-title {
            font-size: 1.3em;
            color: #333;
            margin-bottom: 15px;
            padding-left: 15px;
            border-left: 4px solid #667eea;
        }

        .notes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }

        .note-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 15px;
            padding: 20px;
            transition: all 0.3s;
            cursor: pointer;
            border: 2px solid transparent;
        }

        .note-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            border-color: #667eea;
        }

        .note-title {
            font-size: 1.1em;
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .note-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 15px;
            font-size: 0.9em;
            color: #666;
        }

        .likes {
            background: #ff6b6b;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: bold;
        }

        .author {
            color: #667eea;
            font-weight: 500;
        }

        .note-link {
            display: block;
            margin-top: 12px;
            color: #667eea;
            text-decoration: none;
            font-size: 0.9em;
            font-weight: 500;
        }

        .footer {
            text-align: center;
            color: white;
            padding: 20px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🇻🇳 越南四城深度游</h1>
            <div class="subtitle">2026年2月16日 出行 | 情侣2人 | 基于小红书真实笔记</div>
            <div class="stats">
                <div class="stat-item">📍 ''' + str(len(all_data)) + '''个城市</div>
                <div class="stat-item">📊 ''' + str(total_notes) + '''条笔记</div>
                <div class="stat-item">❤️ 真实推荐</div>
            </div>
        </header>

        <div class="controls">
            <div class="control-group">
                <label>🏙️ 城市:</label>
                <select id="cityFilter" onchange="filterNotes()">
                    <option value="all">全部城市</option>
                    ''' + ''.join([f'<option value="{city}">{city}</option>' for city in sorted(all_data.keys())]) + '''
                </select>
            </div>

            <div class="control-group">
                <label>📂 维度:</label>
                <select id="categoryFilter" onchange="filterNotes()">
                    <option value="all">全部维度</option>
                    <option value="住宿推荐">住宿推荐</option>
                    <option value="美食餐厅">美食餐厅</option>
                    <option value="景点打卡">景点打卡</option>
                </select>
            </div>

            <div class="control-group">
                <label>🔍 搜索:</label>
                <input type="text" id="searchInput" placeholder="搜索关键词..." oninput="filterNotes()">
            </div>
        </div>

        <div id="content"></div>

        <div class="footer">
            <p>🤖 Generated with Claude Code | 数据来源：小红书 | 生成时间：2026-01-08</p>
            <p>💡 点击卡片可查看笔记详情 | 数据基于真实用户分享</p>
        </div>
    </div>

    <script>
        const data = ''' + json.dumps(all_data, ensure_ascii=False) + ''';

        function renderNotes(filteredData) {
            const content = document.getElementById('content');
            content.innerHTML = '';

            for (const [city, categories] of Object.entries(filteredData)) {
                const citySection = document.createElement('div');
                citySection.className = 'city-section';

                const cityTitle = document.createElement('h2');
                cityTitle.className = 'city-title';
                cityTitle.textContent = city;
                citySection.appendChild(cityTitle);

                for (const [category, notes] of Object.entries(categories)) {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'category';

                    const categoryTitle = document.createElement('div');
                    categoryTitle.className = 'category-title';
                    categoryTitle.textContent = category;
                    categoryDiv.appendChild(categoryTitle);

                    const notesGrid = document.createElement('div');
                    notesGrid.className = 'notes-grid';

                    notes.forEach(note => {
                        const card = document.createElement('div');
                        card.className = 'note-card';
                        card.onclick = () => window.open(note.link, '_blank');

                        const title = document.createElement('div');
                        title.className = 'note-title';
                        title.textContent = note.title;

                        const meta = document.createElement('div');
                        meta.className = 'note-meta';
                        meta.innerHTML = `
                            <span class="likes">❤️ ${note.likes}</span>
                            <span class="author">@${note.author.split(' ')[0]}</span>
                        `;

                        const link = document.createElement('a');
                        link.className = 'note-link';
                        link.href = note.link;
                        link.textContent = '🔗 查看笔记 →';
                        link.onclick = (e) => e.stopPropagation();

                        card.appendChild(title);
                        card.appendChild(meta);
                        card.appendChild(link);
                        notesGrid.appendChild(card);
                    });

                    categoryDiv.appendChild(notesGrid);
                    citySection.appendChild(categoryDiv);
                }

                content.appendChild(citySection);
            }
        }

        function filterNotes() {
            const cityFilter = document.getElementById('cityFilter').value;
            const categoryFilter = document.getElementById('categoryFilter').value;
            const searchText = document.getElementById('searchInput').value.toLowerCase();

            let filtered = {};

            for (const [city, categories] of Object.entries(data)) {
                if (cityFilter !== 'all' && city !== cityFilter) continue;

                filtered[city] = {};

                for (const [category, notes] of Object.entries(categories)) {
                    if (categoryFilter !== 'all' && category !== categoryFilter) continue;

                    const filteredNotes = notes.filter(note =>
                        note.title.toLowerCase().includes(searchText) ||
                        note.author.toLowerCase().includes(searchText)
                    );

                    if (filteredNotes.length > 0) {
                        filtered[city][category] = filteredNotes;
                    }
                }

                if (Object.keys(filtered[city]).length === 0) {
                    delete filtered[city];
                }
            }

            renderNotes(filtered);
        }

        // 初始渲染
        renderNotes(data);
    </script>
</body>
</html>
'''

with open('vietnam_travel_dashboard.html', 'w', encoding='utf-8') as f:
    f.write(html_template)

print("✅ HTML仪表板已保存到：vietnam_travel_dashboard.html")
print("\n🎉 所有文件生成完成！")
print("\n📂 生成的文件：")
print("   1. vietnam_travel_complete.json - 完整数据（JSON格式）")
print("   2. vietnam_travel.csv - 飞书导入文件")
print("   3. vietnam_travel_dashboard.html - 可交互仪表板")
