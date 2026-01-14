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
