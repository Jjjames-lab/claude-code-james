#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import json
import time

def scrape_xiaohongshu_with_login(keyword):
    with sync_playwright() as p:
        print("🚀 正在启动浏览器...")

        # 启动浏览器（headless=False，用户可以看到窗口）
        browser = p.chromium.launch(
            headless=False,  # 显示浏览器窗口
            slow_mo=1000  # 稍微放慢操作速度，便于观察
        )

        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        # 先访问小红书首页
        print("📍 正在访问小红书首页...")
        page.goto("https://www.xiaohongshu.com", wait_until="networkidle")

        print("\n" + "="*60)
        print("⏸️  浏览器已打开，请执行以下操作：")
        print("1. 在打开的浏览器窗口中登录小红书")
        print("2. 登录成功后，回到这里")
        print("3. 输入 'ok' 并回车继续")
        print("="*60 + "\n")

        # 等待用户确认登录
        user_input = input("✅ 您是否已经登录成功？(输入 ok 继续): ")

        while user_input.lower().strip() not in ['ok', 'yes', 'y', '是', '好了']:
            print("⏳ 等待您登录...")
            user_input = input("✅ 登录成功后请输入 'ok': ")

        print("\n✅ 收到！继续执行...\n")

        # 访问搜索页面
        search_url = f"https://www.xiaohongshu.com/search_result?keyword={keyword}"
        print(f"📍 正在搜索: {keyword}")
        page.goto(search_url, wait_until="networkidle")

        # 等待页面加载
        time.sleep(5)

        print("📊 正在提取笔记数据...\n")

        # 尝试多种方法提取笔记
        notes_data = page.evaluate("""
            () => {
                const results = [];

                // 方法1: 查找包含笔记链接的元素
                const links = document.querySelectorAll('a[href*="/explore/"]');
                links.forEach((link, index) => {
                    const href = link.href;
                    const match = href.match(/\/explore\/([0-9a-f]{24})/);
                    if (match && index < 50) {  // 限制前50个
                        const noteId = match[1];

                        // 尝试获取标题
                        let title = '';
                        const titleElem = link.querySelector('.title, h3, .note-title, [class*="title"]');
                        if (titleElem) {
                            title = titleElem.textContent.trim();
                        }

                        // 避免重复
                        if (!results.find(n => n.noteId === noteId)) {
                            results.push({
                                index: results.length + 1,
                                noteId: noteId,
                                title: title || '未获取到标题',
                                link: href
                            });
                        }
                    }
                });

                return results;
            }
        """)

        if notes_data:
            print(f"\n🎉 成功提取到 {len(notes_data)} 条笔记:\n")
            for note in notes_data[:15]:  # 显示前15条
                print(f"{note['index']}. {note['title']}")
                print(f"   🔗 {note['link']}\n")

            # 保存完整数据
            with open('xiaohongshu_notes.json', 'w', encoding='utf-8') as f:
                json.dump(notes_data, f, ensure_ascii=False, indent=2)
            print(f"✅ 完整数据已保存到 xiaohongshu_notes.json")

            print(f"\n⏸️  浏览器窗口将保持打开10秒供您查看...")
            time.sleep(10)
        else:
            print("⚠️ 未能提取到笔记数据")
            print("💡 可能的原因：")
            print("   - 页面还在加载中")
            print("   - 登录未成功")
            print("   - 页面结构变化")

            # 保存截图供调试
            page.screenshot(path="xiaohongshu_debug.png", full_page=True)
            print("📸 调试截图已保存到 xiaohongshu_debug.png")

            print(f"\n⏸️  浏览器窗口将保持打开30秒供您检查...")
            time.sleep(30)

        browser.close()
        print("\n✅ 任务完成！")

if __name__ == "__main__":
    keyword = "大叻酒店"
    scrape_xiaohongshu_with_login(keyword)
