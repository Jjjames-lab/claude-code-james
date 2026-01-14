#!/usr/bin/env python3
"""
小红书图片提取测试 - 自动化版本
使用AppleScript控制Chrome浏览器，提取笔记首图
"""

import subprocess
import time
import json
import os

def extract_images_from_note(note_url, note_index):
    """
    从小红书笔记中提取图片URL

    Args:
        note_url: 笔记链接
        note_index: 笔记序号

    Returns:
        list: 图片URL列表
    """

    # JavaScript代码：在页面中执行
    js_code = f'''
    // 等待页面加载完成
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 查找所有图片
    const allImages = Array.from(document.images);

    // 过滤出笔记图片（排除头像、图标等）
    const noteImages = allImages.filter(img => {{
        return img.src &&
               img.src.includes('sns-webpic.xhscdn.com') &&
               !img.src.includes('avatar') &&
               img.width > 300 &&
               img.height > 300;
    }});

    // 提取图片信息
    const images = noteImages.map((img, index) => ({{
        index: index + 1,
        url: img.src,
        width: img.width,
        height: img.height,
        isCover: index === 0  // 第一张作为封面
    }}));

    console.log('✅ 找到 ' + images.length + ' 张图片');
    images.forEach(img => {{
        console.log('图片 ' + img.index + ': ' + img.url.substring(0, 80) + '...');
    }});

    // 返回JSON
    JSON.stringify({{
        success: true,
        total: images.length,
        images: images
    }});
    '''

    # AppleScript命令
    applescript = f'''
    tell application "Google Chrome"
        activate
        if (count of windows) is 0 then
            make new window
        end if

        -- 打开笔记链接
        set URL of active tab of front window to "{note_url}"

        -- 等待页面加载
        delay 5

        -- 执行JavaScript
        set jsResult to execute front window's active tab javascript "{js_code.replace(chr(34), '\\"').replace(chr(10), ' ')}"

        return jsResult
    end tell
    '''

    try:
        # 执行AppleScript
        result = subprocess.run(
            ['osascript', '-e', applescript],
            capture_output=True,
            text=True,
            timeout=30
        )

        output = result.stdout.strip()

        print(f"\n{'='*60}")
        print(f"笔记 #{note_index}: {note_url}")
        print(f"{'='*60}")
        print(f"原始输出:\n{output[:500]}...")

        # 尝试解析JSON
        try:
            data = json.loads(output)
            if data.get('success'):
                images = data.get('images', [])
                print(f"✅ 成功提取 {len(images)} 张图片")
                return images
            else:
                print(f"❌ 提取失败")
                return []
        except json.JSONDecodeError:
            print(f"⚠️  无法解析JSON，可能是输出格式问题")
            return []

    except subprocess.TimeoutExpired:
        print(f"❌ 笔记 #{note_index} 超时")
        return []
    except Exception as e:
        print(f"❌ 笔记 #{note_index} 出错: {str(e)}")
        return []

def download_image(url, filename):
    """下载图片"""

    try:
        # 使用curl下载
        result = subprocess.run(
            ['curl', '-s', '-o', filename, url],
            capture_output=True,
            timeout=30
        )

        if os.path.exists(filename) and os.path.getsize(filename) > 1000:
            print(f"   ✅ 下载成功: {filename} ({os.path.getsize(filename)} bytes)")
            return True
        else:
            print(f"   ❌ 下载失败或文件太小: {filename}")
            return False

    except Exception as e:
        print(f"   ❌ 下载出错: {str(e)}")
        return False

def main():
    """主测试函数"""

    print("\n" + "="*60)
    print("📸 小红书图片提取测试")
    print("="*60 + "\n")

    # 测试笔记链接（5个不同城市的笔记）
    test_notes = [
        {
            "city": "芽庄",
            "category": "住宿",
            "url": "https://www.xiaohongshu.com/explore/68e7b4ac00000000040026f9"
        },
        {
            "city": "大叻",
            "category": "住宿",
            "url": "https://www.xiaohongshu.com/explore/68f4e3910000000004023d0e"
        },
        {
            "city": "富国岛",
            "category": "住宿",
            "url": "https://www.xiaohongshu.com/explore/6950c07200000000220386fc"
        },
        {
            "city": "胡志明",
            "category": "住宿",
            "url": "https://www.xiaohongshu.com/explore/695a48a8000000001d03c80a"
        },
        {
            "city": "芽庄",
            "category": "美食",
            "url": "https://www.xiaohongshu.com/explore/687e459a000000002203fcbd"
        }
    ]

    # 创建输出目录
    output_dir = "images_test"
    os.makedirs(output_dir, exist_ok=True)

    print(f"📁 输出目录: {output_dir}/")
    print(f"🔍 测试笔记数: {len(test_notes)}")
    print(f"\n⚠️  请确保：")
    print(f"   1. Chrome浏览器已打开")
    print(f"   2. 已登录小红书账号")
    print(f"\n⏳ 5秒后开始测试...")
    time.sleep(5)

    # 测试结果
    results = []

    # 遍历测试笔记
    for i, note in enumerate(test_notes, 1):
        print(f"\n{'='*60}")
        print(f"测试 {i}/{len(test_notes)}: {note['city']} - {note['category']}")
        print(f"{'='*60}")

        # 提取图片
        images = extract_images_from_note(note['url'], i)

        if not images:
            print(f"⚠️  未找到图片，跳过")
            results.append({
                'note': note,
                'success': False,
                'images_count': 0
            })
            continue

        # 下载第一张图片作为封面
        cover_image = next((img for img in images if img.get('isCover')), images[0])
        image_url = cover_image.get('url')
        image_filename = f"{output_dir}/note_{i}_{note['city']}_{note['category']}.jpg"

        print(f"\n📥 尝试下载封面图片...")
        download_success = download_image(image_url, image_filename)

        results.append({
            'note': note,
            'success': download_success,
            'images_count': len(images),
            'cover_url': image_url if download_success else None,
            'cover_file': image_filename if download_success else None
        })

        # 等待一下再继续
        time.sleep(3)

    # 输出测试报告
    print(f"\n\n{'='*60}")
    print("📊 测试报告")
    print(f"{'='*60}\n")

    success_count = sum(1 for r in results if r['success'])
    total_images = sum(r['images_count'] for r in results)

    print(f"总测试数: {len(results)}")
    print(f"成功提取: {success_count}")
    print(f"失败数量: {len(results) - success_count}")
    print(f"总图片数: {total_images}")
    print(f"\n详细结果:")

    for i, result in enumerate(results, 1):
        status = "✅ 成功" if result['success'] else "❌ 失败"
        print(f"{i}. {result['note']['city']} - {result['note']['category']}: {status}")
        if result['success']:
            print(f"   图片数: {result['images_count']}")
            print(f"   文件: {result['cover_file']}")

    # 保存结果
    with open(f'{output_dir}/test_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n📁 结果已保存到: {output_dir}/test_results.json")

    # 结论
    print(f"\n{'='*60}")
    print("💡 结论")
    print(f"{'='*60}\n")

    if success_count >= 3:
        print("✅ 测试成功！建议继续批量提取所有120个笔记的图片")
    elif success_count >= 1:
        print("⚠️  部分成功，需要优化脚本后再批量提取")
    else:
        print("❌ 测试失败，建议采用其他方案（渐变色/emoji/免费图库）")

    print("\n")

if __name__ == "__main__":
    main()
