#!/usr/bin/env python3
import json

# 读取数据
with open('vietnam_travel_complete.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

all_data = data['data']
total_notes = sum(len(cats) for city in all_data.values() for cats in city.values())

# 生成HTML（保留之前的设计，添加链接和复制功能）
html_parts = []
html_parts.append('''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>✈️ 越南四城深度游</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Noto Sans SC', -apple-system, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            background-attachment: fixed;
            min-height: 100vh;
            padding: 40px 20px;
            color: white;
        }
        
        .container { max-width: 1600px; margin: 0 auto; }
        
        .hero {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 30px;
            padding: 60px 50px;
            margin-bottom: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255, 107, 157, 0.1) 0%, transparent 70%);
            animation: pulse 15s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .hero-content { position: relative; z-index: 1; }
        
        h1 {
            font-size: 3.5em;
            font-weight: 700;
            margin-bottom: 15px;
            background: linear-gradient(135deg, #00D9FF 0%, #FF6B9D 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
            font-size: 1.3em;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 30px;
            font-weight: 300;
        }
        
        .stats-container {
            display: flex;
            gap: 25px;
            flex-wrap: wrap;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 25px 35px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.15);
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: 700;
            background: linear-gradient(135deg, #00D9FF 0%, #FF6B9D 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .stat-label {
            font-size: 0.95em;
            color: rgba(255, 255, 255, 0.7);
            margin-top: 8px;
        }
        
        .controls {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 25px;
            padding: 30px;
            margin-bottom: 40px;
            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .controls-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .control-item {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .control-label {
            font-size: 0.9em;
            color: rgba(255, 255, 255, 0.8);
            font-weight: 500;
        }
        
        select, input {
            padding: 15px 20px;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 15px;
            color: white;
            font-size: 1em;
            font-family: inherit;
            transition: all 0.3s;
            cursor: pointer;
        }
        
        select:hover, input:hover {
            border-color: rgba(255, 255, 255, 0.4);
            background: rgba(255, 255, 255, 0.15);
        }
        
        option { background: #2d3748; color: white; }
        
        .city-section {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px);
            border-radius: 30px;
            padding: 40px;
            margin-bottom: 35px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.15);
            transition: all 0.4s;
        }
        
        .city-section:hover {
            transform: translateY(-5px);
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.35);
        }
        
        .city-header {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 35px;
            padding-bottom: 20px;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }
        
        .city-emoji { font-size: 3em; }
        
        .city-name {
            font-size: 2.5em;
            font-weight: 700;
            background: linear-gradient(135deg, #00D9FF 0%, #FF6B9D 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .category { margin-bottom: 35px; }
        
        .category-title {
            font-size: 1.4em;
            font-weight: 600;
            margin-bottom: 20px;
            padding-left: 20px;
            border-left: 5px solid;
            border-image: linear-gradient(135deg, #00D9FF, #FF6B9D) 1;
        }
        
        .notes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
            gap: 25px;
        }
        
        .note-card {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
        }
        
        .note-card:hover {
            transform: translateY(-10px) scale(1.02);
            background: rgba(255, 255, 255, 0.12);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            border-color: rgba(255, 255, 255, 0.3);
        }
        
        .note-icon { font-size: 2em; margin-bottom: 12px; }
        
        .note-title {
            font-size: 1.15em;
            font-weight: 600;
            line-height: 1.5;
            margin-bottom: 15px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .note-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .note-author {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9em;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .note-likes {
            background: linear-gradient(135deg, #FF6B9D, #c06c84);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9em;
            box-shadow: 0 4px 15px rgba(255, 107, 157, 0.4);
        }
        
        .note-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .action-btn {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 12px;
            font-size: 0.9em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
            text-decoration: none;
        }
        
        .btn-link {
            background: linear-gradient(135deg, #00D9FF, #0099CC);
            color: white;
        }
        
        .btn-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0, 217, 255, 0.4);
        }
        
        .btn-copy {
            background: rgba(255, 255, 255, 0.15);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .btn-copy:hover {
            background: rgba(255, 255, 255, 0.25);
            border-color: rgba(255, 255, 255, 0.5);
        }
        
        .footer {
            text-align: center;
            padding: 40px 20px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.95em;
        }
        
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .city-section { animation: fadeInUp 0.6s ease-out; }
        
        @media (max-width: 768px) {
            h1 { font-size: 2.5em; }
            .hero { padding: 40px 30px; }
            .notes-grid { grid-template-columns: 1fr; }
            .note-actions { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <div class="hero-content">
                <h1>✈️ 越南四城深度游</h1>
                <div class="subtitle">2026.02.16 出发 | 情侣双人之旅 | 基于小红书真实推荐</div>
                <div class="stats-container">
                    <div class="stat-card">
                        <div class="stat-number">''' + str(len(all_data)) + '''</div>
                        <div class="stat-label">个城市</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">''' + str(total_notes) + '''</div>
                        <div class="stat-label">条精选笔记</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">100%</div>
                        <div class="stat-label">真实可靠</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="controls">
            <div class="controls-grid">
                <div class="control-item">
                    <div class="control-label">🏙️ 选择城市</div>
                    <select id="cityFilter" onchange="filterNotes()">
                        <option value="all">全部城市</option>
''' + ''.join([f"                        <option value=\"{city}\">{city}</option>" for city in sorted(all_data.keys())]) + '''
                    </select>
                </div>
                <div class="control-item">
                    <div class="control-label">📂 探索维度</div>
                    <select id="categoryFilter" onchange="filterNotes()">
                        <option value="all">全部维度</option>
                        <option value="住宿推荐">🏨 住宿推荐</option>
                        <option value="美食餐厅">🍴 美食餐厅</option>
                        <option value="景点打卡">📸 景点打卡</option>
                    </select>
                </div>
                <div class="control-item">
                    <div class="control-label">🔍 搜索内容</div>
                    <input type="text" id="searchInput" placeholder="搜索笔记标题或作者..." oninput="filterNotes()">
                </div>
            </div>
        </div>

        <div id="content"></div>

        <div class="footer">
            <p>💎 Made with ❤️ by Claude Code | 数据来源：小红书</p>
            <p style="margin-top: 10px; opacity: 0.8;">💡 点击"打开笔记"可直接跳转 | 或"复制标题"在APP搜索</p>
        </div>
    </div>

    <script>
        const data = ''' + json.dumps(all_data, ensure_ascii=False) + ''';

        const categoryIcons = {
            '住宿推荐': '🏨',
            '美食餐厅': '🍴',
            '景点打卡': '📸'
        };

        const cityEmojis = {
            '富国岛': '🏝️',
            '大叻': '🏔️',
            '胡志明市': '🏙️',
            '芽庄市': '🌊'
        };

        function renderNotes(filteredData) {
            const content = document.getElementById('content');
            content.innerHTML = '';

            const cities = Object.keys(filteredData);

            if (cities.length === 0) {
                content.innerHTML = `
                    <div style="text-align: center; padding: 60px; color: rgba(255,255,255,0.7);">
                        <div style="font-size: 4em; margin-bottom: 20px;">🔍</div>
                        <div style="font-size: 1.5em;">未找到匹配的内容</div>
                        <div style="margin-top: 10px; opacity: 0.7;">试试调整筛选条件</div>
                    </div>
                `;
                return;
            }

            cities.forEach((city, index) => {
                const categories = filteredData[city];
                const section = document.createElement('div');
                section.className = 'city-section';
                section.style.animationDelay = `${index * 0.1}s`;

                section.innerHTML = `
                    <div class="city-header">
                        <div class="city-emoji">${cityEmojis[city] || '📍'}</div>
                        <div class="city-name">${city}</div>
                    </div>
                `;

                Object.entries(categories).forEach(([category, notes]) => {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'category';

                    categoryDiv.innerHTML = `
                        <div class="category-title">${categoryIcons[category] || ''} ${category}</div>
                    `;

                    const notesGrid = document.createElement('div');
                    notesGrid.className = 'notes-grid';

                    notes.forEach(note => {
                        const card = document.createElement('div');
                        card.className = 'note-card';

                        card.innerHTML = `
                            <div class="note-icon">${categoryIcons[category] || '📌'}</div>
                            <div class="note-title">${note.title}</div>
                            <div class="note-footer">
                                <div class="note-author">
                                    <span>👤</span>
                                    <span>${note.author.split(' ')[0]}</span>
                                </div>
                                <div class="note-likes">❤️ ${note.likes}</div>
                            </div>
                            <div class="note-actions">
                                <a href="${note.link}" target="_blank" class="action-btn btn-link">🔗 打开笔记</a>
                                <button class="action-btn btn-copy" onclick="copyTitle('${note.title.replace(/'/g, "\\'")}')">📋 复制标题</button>
                            </div>
                        `;

                        notesGrid.appendChild(card);
                    });

                    categoryDiv.appendChild(notesGrid);
                    section.appendChild(categoryDiv);
                });

                content.appendChild(section);
            });
        }

        function copyTitle(title) {
            navigator.clipboard.writeText(title);
            const btn = event.target;
            btn.textContent = '✅ 已复制!';
            setTimeout(() => {
                btn.textContent = '📋 复制标题';
            }, 2000);
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

        renderNotes(data);
    </script>
</body>
</html>''')

with open('vietnam_travel_dashboard.html', 'w', encoding='utf-8') as f:
    f.write(''.join(html_parts))

print("✅ HTML已更新！现在每个笔记都有两个按钮：")
print("   1. 🔗 打开笔记 - 直接跳转到小红书")
print("   2. 📋 复制标题 - 复制标题到剪贴板")
