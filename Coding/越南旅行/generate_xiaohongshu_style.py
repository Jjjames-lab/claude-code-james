#!/usr/bin/env python3
import json
from datetime import datetime

# 读取数据
with open('vietnam_travel_complete.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

all_data = data['data']
total_notes = sum(len(cats) for city in all_data.values() for cats in city.values())

# 生成小红书风格的HTML
html_parts = []
html_parts.append('''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>✈️ 越南四城深度游 | 小红书风格</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #f8f8f8;
            min-height: 100vh;
        }
        
        .app-container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
        }
        
        /* 顶部导航栏 */
        .navbar {
            background: white;
            border-bottom: 1px solid #e6e6e6;
            padding: 15px 30px;
            position: sticky;
            top: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .logo {
            font-size: 1.5em;
            font-weight: 700;
            color: #ff2442;
        }
        
        .nav-filters {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .nav-filter {
            padding: 8px 16px;
            border: 1px solid #e6e6e6;
            border-radius: 20px;
            font-size: 0.9em;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .nav-filter:hover, .nav-filter.active {
            background: #ff2442;
            color: white;
            border-color: #ff2442;
        }
        
        /* Hero区域 */
        .hero {
            padding: 40px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .hero h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .hero .subtitle {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        /* 内容区 */
        .content {
            padding: 30px;
        }
        
        /* 城市标题 */
        .city-header {
            font-size: 1.8em;
            font-weight: 700;
            margin: 30px 0 20px 0;
            padding: 15px 0;
            border-left: 5px solid #ff2442;
            color: #333;
        }
        
        /* 瀑布流卡片网格 */
        .masonry-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        /* 小红书风格卡片 */
        .note-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            transition: all 0.3s;
            cursor: pointer;
            border: 1px solid #f0f0f0;
        }
        
        .note-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
        }
        
        /* 卡片封面（渐变色块代替图片） */
        .card-cover {
            height: 200px;
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 4em;
        }
        
        /* 不同类别用不同渐变 */
        .note-card[data-category="住宿推荐"] .card-cover {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .note-card[data-category="美食餐厅"] .card-cover {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        .note-card[data-category="景点打卡"] .card-cover {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        
        .cover-icon {
            opacity: 0.8;
        }
        
        /* 卡片内容 */
        .card-content {
            padding: 15px;
        }
        
        .card-title {
            font-size: 1em;
            font-weight: 500;
            line-height: 1.5;
            margin-bottom: 12px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            color: #333;
        }
        
        /* 卡片底部信息 */
        .card-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #f5f5f5;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
        }
        
        /* 用户头像（圆形首字母） */
        .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ff9a9e, #fad0c4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 0.85em;
        }
        
        .user-name {
            font-size: 0.85em;
            color: #666;
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        /* 点赞数 */
        .likes-info {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.9em;
            color: #999;
        }
        
        /* 复制按钮（悬浮显示） */
        .copy-btn {
            width: 100%;
            padding: 12px;
            margin-top: 10px;
            background: #fff;
            border: 1px solid #ff2442;
            border-radius: 20px;
            color: #ff2442;
            font-size: 0.9em;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s;
            opacity: 0;
            transform: translateY(-10px);
        }
        
        .note-card:hover .copy-btn {
            opacity: 1;
            transform: translateY(0);
        }
        
        .copy-btn:hover {
            background: #ff2442;
            color: white;
        }
        
        .copy-btn.copied {
            background: #07c160;
            border-color: #07c160;
            color: white;
        }
        
        /* 搜索提示 */
        .search-tip {
            background: #fff8e1;
            border: 1px solid #ffe58f;
            border-radius: 10px;
            padding: 15px 20px;
            margin: 20px 30px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        /* 底部 */
        .footer {
            text-align: center;
            padding: 40px 20px;
            color: #999;
            font-size: 0.9em;
            border-top: 1px solid #e6e6e6;
        }
        
        @media (max-width: 768px) {
            .masonry-grid {
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 15px;
            }
            
            .card-cover {
                height: 150px;
                font-size: 3em;
            }
        }
    </style>
</head>
<body>
    <div class="app-container">
        <!-- 导航栏 -->
        <div class="navbar">
            <div class="logo">🇻🇳 越南旅行</div>
            <div class="nav-filters">
                <div class="nav-filter active" onclick="filterByCity('all')">全部</div>
                <div class="nav-filter" onclick="filterByCity('富国岛')">🏝️ 富国岛</div>
                <div class="nav-filter" onclick="filterByCity('大叻')">🏔️ 大叻</div>
                <div class="nav-filter" onclick="filterByCity('胡志明市')">🏙️ 胡志明</div>
                <div class="nav-filter" onclick="filterByCity('芽庄市')">🌊 芽庄</div>
            </div>
        </div>

        <!-- Hero -->
        <div class="hero">
            <h1>✈️ 2026.02.16 越南四城深度游</h1>
            <div class="subtitle">情侣双人之旅 | ''' + str(total_notes) + '''条小红书精选笔记</div>
        </div>

        <!-- 搜索提示 -->
        <div class="search-tip">
            <span style="font-size: 1.5em;">💡</span>
            <span>点击卡片复制标题，在小红书APP搜索查看完整笔记</span>
        </div>

        <!-- 内容区 -->
        <div class="content">
            <div id="notes-container"></div>
        </div>

        <!-- 底部 -->
        <div class="footer">
            <p>💎 Made with ❤️ by Claude Code | 数据来源：小红书真实笔记</p>
            <p style="margin-top: 8px;">📅 生成时间：2026.01.08</p>
        </div>
    </div>

    <script>
        const data = ''' + json.dumps(all_data, ensure_ascii=False) + ''';

        const categoryInfo = {
            '住宿推荐': { icon: '🏨', color: '#667eea' },
            '美食餐厅': { icon: '🍴', color: '#f5576c' },
            '景点打卡': { icon: '📸', color: '#00f2fe' }
        };

        const cityInfo = {
            '富国岛': '🏝️',
            '大叻': '🏔️',
            '胡志明市': '🏙️',
            '芽庄市': '🌊'
        };

        function renderNotes(filteredData) {
            const container = document.getElementById('notes-container');
            container.innerHTML = '';

            Object.entries(filteredData).forEach(([city, categories]) => {
                // 城市标题
                const cityHeader = document.createElement('div');
                cityHeader.className = 'city-header';
                cityHeader.innerHTML = `${cityInfo[city]} ${city}`;
                container.appendChild(cityHeader);

                // 瀑布流网格
                const grid = document.createElement('div');
                grid.className = 'masonry-grid';

                Object.entries(categories).forEach(([category, notes]) => {
                    notes.forEach(note => {
                        const card = document.createElement('div');
                        card.className = 'note-card';
                        card.dataset.category = category;

                        // 提取作者首字
                        const authorFirstChar = note.author.charAt(0);
                        const authorRest = note.author.split(' ')[0];

                        card.innerHTML = `
                            <div class="card-cover">
                                <span class="cover-icon">${categoryInfo[category].icon}</span>
                            </div>
                            <div class="card-content">
                                <div class="card-title">${note.title}</div>
                                <div class="card-footer">
                                    <div class="user-info">
                                        <div class="user-avatar">${authorFirstChar}</div>
                                        <div class="user-name">${authorRest}</div>
                                    </div>
                                    <div class="likes-info">
                                        <span>❤️ ${note.likes}</span>
                                    </div>
                                </div>
                                <button class="copy-btn" onclick="copyAndShow(this, '${note.title.replace(/'/g, "\\'")}')">
                                    📋 复制标题
                                </button>
                            </div>
                        `;

                        grid.appendChild(card);
                    });
                });

                container.appendChild(grid);
            });
        }

        function copyAndShow(btn, title) {
            navigator.clipboard.writeText(title).then(() => {
                btn.textContent = '✅ 已复制！';
                btn.classList.add('copied');
                
                setTimeout(() => {
                    btn.textContent = '📋 复制标题';
                    btn.classList.remove('copied');
                }, 2000);
            });
        }

        function filterByCity(city) {
            // 更新导航高亮
            document.querySelectorAll('.nav-filter').forEach(el => {
                el.classList.remove('active');
            });
            event.target.classList.add('active');

            // 筛选数据
            let filtered;
            if (city === 'all') {
                filtered = data;
            } else {
                filtered = { [city]: data[city] };
            }

            renderNotes(filtered);
        }

        // 初始渲染
        renderNotes(data);
    </script>
</body>
</html>''')

with open('vietnam_travel_dashboard.html', 'w', encoding='utf-8') as f:
    f.write(''.join(html_parts))

print("✅ 小红书风格的HTML已生成！")
print("特点：")
print("   - 仿小红书导航栏")
print("   - 瀑布流卡片布局")
print("   - 渐变色封面")
print("   - 用户头像（首字母）")
print("   - 时间/点赞信息")
print("   - 悬浮显示复制按钮")
