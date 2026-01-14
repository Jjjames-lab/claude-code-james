#!/usr/bin/env python3
import sqlite3
import requests
from http.cookies import SimpleCookie
import json
import os
from pathlib import Path

# Chrome cookies 路径
home = str(Path.home())
cookies_db = f"{home}/Library/Application Support/Google/Chrome/Default/Cookies"
cookies_db_copy = "/tmp/cookies_temp.db"

# 复制cookies数据库（避免文件锁定）
import shutil
shutil.copy(cookies_db, cookies_db_copy)

# 连接到Chrome cookies数据库
conn = sqlite3.connect(cookies_db_copy, isolation_level=None)
cursor = conn.cursor()

# 获取小红书的所有cookies
cursor.execute("""
    SELECT name, value, host_key
    FROM cookies
    WHERE host_key LIKE '%xiaohongshu%'
""")

cookies_dict = {}
for name, value, host in cursor.fetchall():
    if value:  # 只处理有值的cookies
        cookies_dict[name] = value

conn.close()

print(f"✅ 成功读取 {len(cookies_dict)} 个小红书cookies")

# 使用cookies请求小红书搜索页面
url = "https://www.xiaohongshu.com/search_result?keyword=大叻酒店"
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

response = requests.get(url, cookies=cookies_dict, headers=headers)

print(f"\n📊 页面状态码: {response.status_code}")
print(f"📄 内容长度: {len(response.text)} 字符")

# 保存HTML内容
with open('xiaohongshu_search.html', 'w', encoding='utf-8') as f:
    f.write(response.text)

print("✅ HTML内容已保存到 xiaohongshu_search.html")

# 尝试提取一些信息
if '笔记' in response.text or 'note' in response.text.lower():
    print("\n✅ 页面包含笔记内容")
else:
    print("\n⚠️ 页面可能未正确加载")
