#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import json
import time

def scrape_xiaohongshu(keyword):
    with sync_playwright() as p:
        # 启动浏览器（使用已安装的Chromium）
        browser = p.chromium.launch(headless=False)  # headless=False 可以看到浏览器窗口
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        # 访问小红书搜索页面
        url = f"https://www.xiaohongshu.com/search_result?keyword={keyword}"
        print(f"📍 正在访问: {url}")
        page.goto(url, wait_until="networkidle")

        # 等待页面加载
        time.sleep(3)

        # 尝试提取笔记数据
        print("📊 正在提取笔记数据...")

        # 方法1: 尝试从页面中提取笔记卡片
        notes = page.evaluate("""
            () => {
                const noteCards = document.querySelectorAll('[note-id], .note-item, .search-item');
                const results = [];

                noteCards.forEach((card, index) => {
                    try {
                        const noteId = card.getAttribute('note-id') || card.dataset.noteId;
                        const title = card.querySelector('.title, h3, .note-title')?.textContent?.trim();
                        const link = card.querySelector('a[href*="/explore/"]')?.href;

                        if (noteId || link) {
                            results.push({
                                index: index + 1,
                                noteId: noteId,
                                title: title || '未找到标题',
                                link: link || `https://www.xiaohongshu.com/explore/${noteId}`
                            });
                        }
                    } catch (e) {
                        console.error('提取笔记时出错:', e);
                    }
                });

                return results;
            }
        """)

        if notes:
            print(f"\n✅ 成功提取到 {len(notes)} 条笔记:\n")
            for note in notes[:10]:  # 只显示前10条
                print(f"{note['index']}. {note['title']}")
                print(f"   链接: {note['link']}\n")

            # 保存完整数据
            with open('xiaohongshu_notes.json', 'w', encoding='utf-8') as f:
                json.dump(notes, f, ensure_ascii=False, indent=2)
            print(f"✅ 完整数据已保存到 xiaohongshu_notes.json")
        else:
            print("⚠️ 未提取到笔记数据，尝试保存页面截图...")
            page.screenshot(path="xiaohongshu_screenshot.png", full_page=True)
            print("✅ 截图已保存到 xiaohongshu_screenshot.png")

            # 保存页面HTML
            with open('xiaohongshu_page.html', 'w', encoding='utf-8') as f:
                f.write(page.content())
            print("✅ 页面HTML已保存到 xiaohongshu_page.html")

        # 等待几秒让用户看到结果
        time.sleep(5)

        browser.close()

if __name__ == "__main__":
    keyword = "大叻酒店"
    scrape_xiaohongshu(keyword)
