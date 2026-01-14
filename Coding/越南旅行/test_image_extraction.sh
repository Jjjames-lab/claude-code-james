#!/bin/bash

# 小红书笔记图片提取测试
# 目标：测试是否能提取笔记首图并下载

echo "📸 开始测试小红书图片提取..."
echo ""

# 选取5个不同城市的笔记进行测试
test_links=(
    "https://www.xiaohongshu.com/explore/68e7b4ac00000000040026f9"  # 芽庄住宿
    "https://www.xiaohongshu.com/explore/69484773000000000d03998f"  # 芽庄
    "https://www.xiaohongshu.com/explore/68f4e3910000000004023d0e"  # 大叻住宿
    "https://www.xiaohongshu.com/explore/6950c07200000000220386fc"  # 富国岛住宿
    "https://www.xiaohongshu.com/explore/68e1e8fc0000000003013715"  # 富国岛美食
)

# 创建输出目录
mkdir -p images_test
cd images_test

echo "🔍 测试链接："
for i in "${!test_links[@]}"; do
    echo "$((i+1)). ${test_links[$i]}"
done
echo ""
echo "⏳ 请在Chrome中打开这些链接，然后执行JavaScript提取图片..."
echo ""

# JavaScript代码 - 在浏览器控制台运行
cat << 'EOF' > extract_images.js
// 在小红书笔记页面运行此代码，提取图片URL

console.log('🔍 开始提取图片...');

// 方法1：尝试从img标签获取
const images1 = document.querySelectorAll('img');
console.log('方法1 - IMG标签数量:', images1.length);

const imgUrls1 = [];
images1.forEach((img, index) => {
    if (img.src && !img.src.includes('avatar')) {
        imgUrls1.push({
            index: index,
            src: img.src,
            width: img.width,
            height: img.height
        });
    }
});
console.log('方法1 - 找到的图片URL:', imgUrls1);

// 方法2：尝试从sections获取
const sections = document.querySelectorAll('section');
console.log('方法2 - Section数量:', sections.length);

const imgUrls2 = [];
sections.forEach((section, index) => {
    const imgs = section.querySelectorAll('img');
    imgs.forEach(img => {
        if (img.src && img.src.includes('xhscdn')) {
            imgUrls2.push({
                section: index,
                src: img.src
            });
        }
    });
});
console.log('方法2 - 找到的图片URL:', imgUrls2);

// 方法3：查找所有包含"xhscdn"的图片
const allImages = Array.from(document.images);
const coverImages = allImages.filter(img => {
    return img.src &&
           img.src.includes('xhscdn') &&
           !img.src.includes('avatar') &&
           img.width > 200;
});

console.log('方法3 - 找到的封面图片:', coverImages.length);
coverImages.forEach((img, index) => {
    console.log(`图片${index + 1}:`, {
        src: img.src.substring(0, 100) + '...',
        width: img.width,
        height: img.height
    });
});

// 生成结果
const result = {
    total: coverImages.length,
    images: coverImages.map((img, index) => ({
        index: index + 1,
        src: img.src,
        width: img.width,
        height: img.height
    }))
};

console.log('✅ 提取完成！结果:', JSON.stringify(result, null, 2));

// 将结果保存到剪贴板
copy(JSON.stringify(result, null, 2));
console.log('✅ 结果已复制到剪贴板！');
EOF

echo "📝 已生成 extract_images.js 文件"
echo ""
echo "📋 测试步骤："
echo "1. 在Chrome中打开第一个测试链接"
echo "2. 按F12打开开发者工具"
echo "3. 在Console标签中，复制粘贴 extract_images.js 的内容"
echo "4. 查看输出的图片URL"
echo "5. 检查图片URL是否可以直接下载"
echo ""
echo "💡 测试要点："
echo "- 图片URL格式（是否是正常的https://）"
echo "- 图片数量（首图通常是第几张）"
echo "- 图片大小（宽度和高度）"
echo "- 是否可以直接用curl下载"
echo ""
echo "等待你测试完成后，告诉我结果，我会决定是否继续批量提取！"
echo ""

# 保存测试链接到文件
echo "# 测试链接" > test_links.txt
for i in "${!test_links[@]}"; do
    echo "$((i+1)). ${test_links[$i]}" >> test_links.txt
done

echo "✅ 测试链接已保存到 images_test/test_links.txt"
echo ""
echo "🚀 准备完成！请开始测试..."
