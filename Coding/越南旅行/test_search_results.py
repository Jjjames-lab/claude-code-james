#!/usr/bin/env python3
"""
小红书搜索结果图片提取测试
从搜索结果页面提取笔记封面图
"""

import subprocess
import time
import json
import os

def extract_images_from_search(keyword):
    """
    从小红书搜索结果页面提取图片

    Args:
        keyword: 搜索关键词

    Returns:
        list: 笔记图片信息列表
    """

    # 构建搜索URL
    search_url = f"https://www.xiaohongshu.com/search_result?keyword={keyword}"

    # JavaScript代码：在搜索结果页面执行
    js_code_template = '''
    // 等待页面加载
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 查找所有笔记卡片
    const noteCards = document.querySelectorAll('section, [class*="note"], [class*="card"]');
    console.log('找到卡片数量:', noteCards.length);

    const notes = [];

    noteCards.forEach((card, index) => {
        // 尝试多种方式获取图片
        const img = card.querySelector('img');
        if (img && img.src && img.src.includes('xhscdn')) {
            // 尝试获取标题
            const titleElement = card.querySelector('[class*="title"], a');
            const title = titleElement ? titleElement.textContent.trim() : '未获取到标题';

            notes.push({
                index: index + 1,
                imageUrl: img.src,
                title: title.substring(0, 50),
                width: img.width,
                height: img.height
            });
        }
    });

    console.log('提取到的笔记数:', notes.length);

    // 只返回前10个
    const result = notes.slice(0, 10).map(note => ({
        ...note,
        // 尝试获取更高清的图片URL
        hdImageUrl: note.imageUrl
    }));

    console.log('结果:', JSON.stringify(result, null, 2));

    JSON.stringify({
        success: true,
        total: result.length,
        notes: result
    });
    '''

    js_code = js_code_template

    # 预处理JavaScript代码（替换引号和换行符）
    js_code_escaped = js_code.replace(chr(34), '\\"').replace(chr(10), ' ')

    # AppleScript命令
    applescript = f'''
    tell application "Google Chrome"
        activate
        if (count of windows) is 0 then
            make new window
        end if

        -- 打开搜索页面
        set URL of active tab of front window to "{search_url}"

        -- 等待页面加载
        delay 5

        -- 执行JavaScript
        set jsResult to execute front window's active tab javascript "{js_code_escaped}"

        return jsResult
    end tell
    '''

    try:
        print(f"\n🔍 搜索关键词: {keyword}")
        print(f"📍 URL: {search_url}")

        result = subprocess.run(
            ['osascript', '-e', applescript],
            capture_output=True,
            text=True,
            timeout=30
        )

        output = result.stdout.strip()
        print(f"\n原始输出:\n{output[:1000]}...")

        # 尝试解析
        try:
            data = json.loads(output)
            if data.get('success'):
                notes = data.get('notes', [])
                print(f"\n✅ 成功提取 {len(notes)} 条笔记")
                return notes
            else:
                print(f"\n⚠️  提取失败")
                return []
        except json.JSONDecodeError:
            print(f"\n⚠️  无法解析JSON")
            return []

    except subprocess.TimeoutExpired:
        print(f"\n❌ 超时")
        return []
    except Exception as e:
        print(f"\n❌ 出错: {str(e)}")
        return []

def download_image(url, filename):
    """下载图片"""
    try:
        result = subprocess.run(
            ['curl', '-s', '-o', filename, url],
            capture_output=True,
            timeout=30
        )

        if os.path.exists(filename) and os.path.getsize(filename) > 1000:
            size = os.path.getsize(filename)
            print(f"   ✅ {filename} ({size} bytes)")
            return True
        else:
            print(f"   ❌ 下载失败或文件太小")
            return False

    except Exception as e:
        print(f"   ❌ 下载出错: {str(e)}")
        return False

def main():
    """主测试函数"""

    print("\n" + "="*60)
    print("📸 小红书搜索结果图片提取测试")
    print("="*60)

    # 测试关键词（对应4个城市）
    test_keywords = [
        "富国岛酒店",
        "大叻住宿",
        "胡志明美食",
        "芽庄景点"
    ]

    # 创建输出目录
    output_dir = "search_images_test"
    os.makedirs(output_dir, exist_ok=True)

    print(f"\n📁 输出目录: {output_dir}/")
    print(f"🔍 测试关键词: {len(test_keywords)}")
    print(f"\n⚠️  请确保Chrome浏览器已打开")
    print(f"\n⏳ 5秒后开始测试...")
    time.sleep(5)

    # 测试结果
    results = []

    # 遍历测试关键词
    for i, keyword in enumerate(test_keywords, 1):
        print(f"\n{'='*60}")
        print(f"测试 {i}/{len(test_keywords)}: {keyword}")
        print(f"{'='*60}")

        # 提取笔记图片
        notes = extract_images_from_search(keyword)

        if not notes:
            print(f"⚠️  未找到笔记，跳过")
            results.append({
                'keyword': keyword,
                'success': False,
                'notes_count': 0
            })
            continue

        # 下载前3张图片作为测试
        print(f"\n📥 下载前3张图片...")
        downloaded = 0

        for j, note in enumerate(notes[:3], 1):
            image_url = note.get('hdImageUrl') or note.get('imageUrl')
            image_filename = f"{output_dir}/{keyword}_{j}.jpg"

            print(f"\n笔记{j}: {note.get('title', 'N/A')}")
            print(f"URL: {image_url[:80]}...")

            if download_image(image_url, image_filename):
                downloaded += 1

        results.append({
            'keyword': keyword,
            'success': downloaded > 0,
            'notes_count': len(notes),
            'downloaded': downloaded
        })

        # 等待再继续
        time.sleep(3)

    # 输出测试报告
    print(f"\n\n{'='*60}")
    print("📊 测试报告")
    print(f"{'='*60}\n")

    success_count = sum(1 for r in results if r['success'])
    total_notes = sum(r['notes_count'] for r in results)
    total_downloaded = sum(r['downloaded'] for r in results)

    print(f"总测试数: {len(results)}")
    print(f"成功提取: {success_count}")
    print(f"失败数量: {len(results) - success_count}")
    print(f"总笔记数: {total_notes}")
    print(f"成功下载: {total_downloaded}")
    print(f"\n详细结果:")

    for i, result in enumerate(results, 1):
        status = "✅ 成功" if result['success'] else "❌ 失败"
        print(f"{i}. {result['keyword']}: {status} (笔记:{result['notes_count']}, 下载:{result['downloaded']})")

    # 保存结果
    with open(f'{output_dir}/test_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n📁 结果已保存到: {output_dir}/test_results.json")

    # 结论
    print(f"\n{'='*60}")
    print("💡 结论")
    print(f"{'='*60}\n")

    if success_count >= 3 and total_downloaded >= 6:
        print("✅ 测试非常成功！")
        print("   可以从搜索结果页面批量提取笔记封面图")
        print("   建议继续开发批量提取脚本")
    elif success_count >= 2:
        print("⚠️  部分成功")
        print("   需要优化图片提取逻辑")
    else:
        print("❌ 测试效果不理想")
        print("   建议采用其他方案（渐变色/emoji/免费图库）")

    print("\n")

if __name__ == "__main__":
    main()
