"""
测试爬取小宇宙节目的 shownote
"""
import asyncio
from playwright.async_api import async_playwright
import json

async def fetch_shownote():
    """爬取节目的 shownote"""

    episode_url = "https://www.xiaoyuzhoufm.com/episode/69772d39ef1cf272a7897f15"

    print("=" * 70)
    print("爬取小宇宙节目 shownote")
    print("=" * 70)
    print(f"URL: {episode_url}\n")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # 访问页面
            print("正在访问页面...")
            await page.goto(episode_url, wait_until="networkidle")

            # 方法1: 从 __NEXT_DATA__ 提取
            print("\n【方法1】从 __NEXT_DATA__ 提取...")
            try:
                next_data = await page.evaluate("() => window.__NEXT_DATA__")

                if next_data:
                    episode = next_data.get('props', {}).get('pageProps', {}).get('episode', {})

                    print(f"✅ 找到 __NEXT_DATA__")
                    print(f"  - episode_title: {episode.get('title', 'N/A')[:50]}...")
                    print(f"  - show_notes 类型: {type(episode.get('show_notes'))}")
                    print(f"  - show_notes 长度: {len(str(episode.get('show_notes', '')))} 字符")
                    print(f"  - description 长度: {len(str(episode.get('description', '')))} 字符")

                    shownote = episode.get('show_notes') or episode.get('description', '')

                    # 显示前500字符
                    print(f"\n  shownote 内容预览:")
                    print("  " + "=" * 66)
                    print(f"  {shownote[:500]}")
                    if len(shownote) > 500:
                        print(f"  ... (还有 {len(shownote) - 500} 字符)")
                    print("  " + "=" * 66)

                    # 检查是否包含 HTML 标签
                    has_html = bool(shownote and ('<' in shownote))
                    print(f"\n  是否包含 HTML 标签: {has_html}")

                    # 保存到文件
                    with open('/tmp/shownote_next_data.json', 'w', encoding='utf-8') as f:
                        json.dump({
                            'episode_title': episode.get('title'),
                            'show_notes': shownote,
                            'description': episode.get('description'),
                            'rich_content': episode.get('rich_content')  # 检查是否有富文本字段
                        }, f, ensure_ascii=False, indent=2)
                    print(f"\n  ✅ 已保存到: /tmp/shownote_next_data.json")

                else:
                    print("❌ 未找到 __NEXT_DATA__")

            except Exception as e:
                print(f"❌ 方法1失败: {e}")

            # 方法2: 检查页面上是否有节目单显示
            print("\n\n【方法2】检查页面内容...")
            try:
                # 查找可能包含节目单的元素
                selectors = [
                    '[class*="shownote"]',
                    '[class*="show-notes"]',
                    '[class*="detail"]',
                    '[class*="content"]',
                    'article',
                    '.description'
                ]

                for selector in selectors:
                    elements = await page.query_selector_all(selector)
                    if elements:
                        print(f"\n  找到 {len(elements)} 个 '{selector}' 元素")
                        for i, elem in enumerate(elements[:2]):  # 只看前2个
                            text = await elem.inner_text()
                            if text and len(text) > 50:
                                print(f"    元素 {i+1}: {text[:100]}...")

            except Exception as e:
                print(f"❌ 方法2失败: {e}")

            # 方法3: 从 meta 标签提取
            print("\n\n【方法3】从 meta 标签提取...")
            try:
                og_desc = await page.get_attribute('meta[property="og:description"]', 'content')
                print(f"  og:description: {og_desc[:200] if og_desc else 'N/A'}...")
            except Exception as e:
                print(f"❌ 方法3失败: {e}")

        finally:
            await browser.close()

    print("\n" + "=" * 70)
    print("爬取完成")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(fetch_shownote())
