#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
播客逐字稿产品可行性分析报告
生成可视化图表和数据
"""

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib import font_manager
import matplotlib.patches as mpatches

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# 创建图表输出目录
import os
output_dir = "/Users/tbingy/Desktop/Claude Code/podcast_analysis_charts"
os.makedirs(output_dir, exist_ok=True)

print("📊 开始生成播客逐字稿产品可行性分析报告图表...")
print("="*80)

# ============================================
# 图表 1: 中国播客市场规模增长趋势
# ============================================
print("\n📈 生成图表 1: 中国播客市场规模增长趋势")

years = ['2023', '2024', '2025', '2026(预计)']
market_size = [287, 310, 337, 380]  # 亿元
podcast_market = [38, 44, 50, 58]  # 播客细分市场 亿元

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

# 左图：长音频市场
bars1 = ax1.bar(years, market_size, color='#667eea', alpha=0.8, edgecolor='white', linewidth=2)
ax1.set_xlabel('年份', fontsize=12, fontweight='bold')
ax1.set_ylabel('市场规模（亿元）', fontsize=12, fontweight='bold')
ax1.set_title('中国长音频市场规模', fontsize=14, fontweight='bold', pad=20)
ax1.grid(axis='y', alpha=0.3, linestyle='--')
ax1.set_ylim([0, 450])

# 添加数值标签
for bar in bars1:
    height = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2., height + 10,
             f'{height}亿', ha='center', va='bottom', fontsize=11, fontweight='bold')

# 右图：播客市场
bars2 = ax2.bar(years, podcast_market, color='#f093fb', alpha=0.8, edgecolor='white', linewidth=2)
ax2.set_xlabel('年份', fontsize=12, fontweight='bold')
ax2.set_ylabel('市场规模（亿元）', fontsize=12, fontweight='bold')
ax2.set_title('中国播客市场规模', fontsize=14, fontweight='bold', pad=20)
ax2.grid(axis='y', alpha=0.3, linestyle='--')
ax2.set_ylim([0, 70])

# 添加数值标签
for bar in bars2:
    height = bar.get_height()
    ax2.text(bar.get_x() + bar.get_width()/2., height + 2,
             f'{height}亿', ha='center', va='bottom', fontsize=11, fontweight='bold')

plt.tight_layout()
plt.savefig(f'{output_dir}/01_市场规模趋势.png', dpi=300, bbox_inches='tight', facecolor='white')
print(f"✅ 已保存: {output_dir}/01_市场规模趋势.png")
plt.close()

# ============================================
# 图表 2: 小宇宙用户画像
# ============================================
print("\n👥 生成图表 2: 小宇宙用户画像分析")

fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))

# 年龄分布
ages = ['18-25岁', '26-35岁', '36-45岁', '46岁+']
age_dist = [25, 45, 22, 8]
colors_age = ['#ffeaa7', '#74b9ff', '#a29bfe', '#fab1a0']

ax1.pie(age_dist, labels=ages, autopct='%1.1f%%', colors=colors_age,
        startangle=90, textprops={'fontsize': 11, 'fontweight': 'bold'},
        wedgeprops={'linewidth': 2, 'edgecolor': 'white'}, shadow=True)
ax1.set_title('小宇宙用户年龄分布', fontsize=13, fontweight='bold', pad=15)

# 城市等级分布
cities = ['一线城市', '新一线城市', '二线城市', '三线及以下']
city_dist = [35, 28, 22, 15]
colors_city = ['#fd79a8', '#fdcb6e', '#55efc4', '#a29bfe']

bars = ax2.barh(cities, city_dist, color=colors_city, alpha=0.85, edgecolor='white', linewidth=2)
ax2.set_xlabel('用户占比 (%)', fontsize=11, fontweight='bold')
ax2.set_title('城市等级分布', fontsize=13, fontweight='bold', pad=15)
ax2.grid(axis='x', alpha=0.3, linestyle='--')
ax2.set_xlim([0, 40])

for bar in bars:
    width = bar.get_width()
    ax2.text(width + 1, bar.get_y() + bar.get_height()/2,
             f'{width}%', va='center', fontsize=10, fontweight='bold')

# 职业分布
jobs = ['在职员工', '学生', '自由职业', '其他']
job_dist = [55, 28, 10, 7]
colors_job = ['#00cec9', '#6c5ce7', '#e17055', '#b2bec3']

bars3 = ax3.bar(jobs, job_dist, color=colors_job, alpha=0.85, edgecolor='white', linewidth=2)
ax3.set_ylabel('用户占比 (%)', fontsize=11, fontweight='bold')
ax3.set_title('职业分布', fontsize=13, fontweight='bold', pad=15)
ax3.grid(axis='y', alpha=0.3, linestyle='--')
ax3.set_ylim([0, 65])
ax3.tick_params(axis='x', rotation=15)

for bar in bars3:
    height = bar.get_height()
    ax3.text(bar.get_x() + bar.get_width()/2., height + 2,
             f'{height}%', ha='center', va='bottom', fontsize=10, fontweight='bold')

# 付费意愿
payment_categories = ['愿意付费', '考虑付费', '不愿意付费']
payment_dist = [42, 35, 23]
colors_payment = ['#00b894', '#fdcb6e', '#d63031']

bars4 = ax4.bar(payment_categories, payment_dist, color=colors_payment,
                alpha=0.85, edgecolor='white', linewidth=2)
ax4.set_ylabel('用户占比 (%)', fontsize=11, fontweight='bold')
ax4.set_title('付费意愿调查', fontsize=13, fontweight='bold', pad=15)
ax4.grid(axis='y', alpha=0.3, linestyle='--')
ax4.set_ylim([0, 50])

for bar in bars4:
    height = bar.get_height()
    ax4.text(bar.get_x() + bar.get_width()/2., height + 2,
             f'{height}%', ha='center', va='bottom', fontsize=11, fontweight='bold')

plt.tight_layout()
plt.savefig(f'{output_dir}/02_用户画像分析.png', dpi=300, bbox_inches='tight', facecolor='white')
print(f"✅ 已保存: {output_dir}/02_用户画像分析.png")
plt.close()

# ============================================
# 图表 3: 竞品对比分析
# ============================================
print("\n🔍 生成图表 3: 竞品功能与价格对比")

competitors = ['飞书妙记', '通义听悟', '讯飞听见', '您的产品']
features = {
    '语音转文字': [1, 1, 1, 1],
    '说话人分离': [1, 1, 0, 1],
    '播客特化': [0, 0, 0, 1],
    '实时同步': [1, 1, 1, 1],
    '小宇宙集成': [0, 0, 0, 1],
    '时间轴跳转': [1, 1, 1, 1],
}

fig, ax = plt.subplots(figsize=(14, 8))

x = np.arange(len(competitors))
width = 0.13
colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe']

for i, (feature, values) in enumerate(features.items()):
    offset = (i - len(features)/2 + 0.5) * width
    bars = ax.bar(x + offset, values, width, label=feature, alpha=0.8,
                  color=colors[i % len(colors)], edgecolor='white', linewidth=1.5)

ax.set_xlabel('产品', fontsize=12, fontweight='bold')
ax.set_ylabel('功能支持情况', fontsize=12, fontweight='bold')
ax.set_title('竞品功能对比矩阵', fontsize=14, fontweight='bold', pad=20)
ax.set_xticks(x + width * 2.5)
ax.set_xticklabels(competitors, fontsize=11)
ax.legend(loc='upper left', fontsize=10, framealpha=0.9)
ax.set_ylim([0, 1.3])
ax.set_yticks([0, 1])
ax.set_yticklabels(['不支持', '支持'])
ax.grid(axis='y', alpha=0.3, linestyle='--')

# 添加价格标签
prices = ['免费300分钟/月\n会员不限', '29元/月\n10小时', '约100元/6小时', '待定']
for i, price in enumerate(prices):
    ax.text(i + width * 2.5, -0.15, price, ha='center', fontsize=9,
            style='italic', bbox=dict(boxstyle='round,pad=0.5', facecolor='wheat', alpha=0.5))

plt.tight_layout()
plt.savefig(f'{output_dir}/03_竞品功能对比.png', dpi=300, bbox_inches='tight', facecolor='white')
print(f"✅ 已保存: {output_dir}/03_竞品功能对比.png")
plt.close()

# ============================================
# 图表 4: 成本模型分析
# ============================================
print("\n💰 生成图表 4: 不同用户规模的成本模型")

user_scales = ['1人\n(MVP)', '100人\n(早期)', '1000人\n(成长期)',
               '10000人\n(扩张期)', '100000人\n(成熟期)']

# 成本构成（元/月）
server_cost = [0, 200, 1500, 8000, 35000]      # 服务器成本
gpu_cost = [100, 500, 3000, 18000, 90000]       # GPU成本（按需）
bandwidth_cost = [0, 50, 300, 2000, 12000]     # 带宽成本
storage_cost = [10, 50, 300, 2000, 12000]      # 存储成本
total_cost = [110, 800, 5100, 30000, 149000]   # 总成本

fig, ax = plt.subplots(figsize=(16, 8))

x = np.arange(len(user_scales))
width = 0.18

bottom = np.zeros(len(user_scales))
colors_costs = ['#ffeaa7', '#74b9ff', '#55efc4', '#a29bfe']
cost_labels = ['服务器', 'GPU算力', '带宽', '存储']

for i, (cost, label, color) in enumerate([(server_cost, '服务器', colors_costs[0]),
                                           (gpu_cost, 'GPU算力', colors_costs[1]),
                                           (bandwidth_cost, '带宽', colors_costs[2]),
                                           (storage_cost, '存储', colors_costs[3])]):
    bars = ax.bar(x + i * width, cost, width, label=label, bottom=bottom,
                  color=color, alpha=0.85, edgecolor='white', linewidth=1.5)
    bottom += cost

ax.set_xlabel('用户规模', fontsize=12, fontweight='bold')
ax.set_ylabel('月度成本（元）', fontsize=12, fontweight='bold')
ax.set_title('不同用户规模的成本模型分析', fontsize=14, fontweight='bold', pad=20)
ax.set_xticks(x + width * 1.5)
ax.set_xticklabels(user_scales, fontsize=10)
ax.legend(loc='upper left', fontsize=11, framealpha=0.9)
ax.grid(axis='y', alpha=0.3, linestyle='--')

# 添加总成本标签
for i, total in enumerate(total_cost):
    ax.text(i + width * 1.5, total + 5000, f'¥{total:,}',
            ha='center', fontsize=10, fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.4', facecolor='red', alpha=0.2))

plt.tight_layout()
plt.savefig(f'{output_dir}/04_成本模型分析.png', dpi=300, bbox_inches='tight', facecolor='white')
print(f"✅ 已保存: {output_dir}/04_成本模型分析.png")
plt.close()

# ============================================
# 图表 5: 商业模式设计
# ============================================
print("\n💼 生成图表 5: 推荐商业模式设计")

fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 14))

# 1. 分层定价策略
tiers = ['免费版', '标准版', '专业版', '企业版']
prices = [0, 19, 49, 199]
features_count = [3, 8, 15, 25]

colors_tiers = ['#b2bec3', '#74b9ff', '#a29bfe', '#fd79a8']
bars1 = ax1.bar(tiers, prices, color=colors_tiers, alpha=0.85, edgecolor='white', linewidth=2)
ax1.set_xlabel('版本', fontsize=11, fontweight='bold')
ax1.set_ylabel('价格（元/月）', fontsize=11, fontweight='bold')
ax1.set_title('推荐定价策略', fontsize=13, fontweight='bold', pad=15)
ax1.grid(axis='y', alpha=0.3, linestyle='--')

for bar, price in zip(bars1, prices):
    height = bar.get_height()
    if price == 0:
        ax1.text(bar.get_x() + bar.get_width()/2., height + 5,
                 '免费', ha='center', va='bottom', fontsize=11, fontweight='bold', color='#27ae60')
    else:
        ax1.text(bar.get_x() + bar.get_width()/2., height + 8,
                 f'¥{price}', ha='center', va='bottom', fontsize=11, fontweight='bold')

# 添加功能数量标签
ax2_twin = ax1.twinx()
ax2_twin.plot(tiers, features_count, color='#e17055', marker='o', markersize=10,
              linewidth=3, label='功能数量')
ax2_twin.set_ylabel('功能数量', fontsize=11, fontweight='bold', color='#e17055')
ax2_twin.tick_params(axis='y', labelcolor='#e17055')
ax2_twin.legend(loc='upper right')

# 2. 收入预测（假设转化率）
scenarios = ['保守\n(1%转化)', '中等\n(3%转化)', '乐观\n(5%转化)']
user_10k = [100, 300, 500]  # 10000用户中的付费用户
revenue_10k = [100 * 19, 200 * 19 + 100 * 49, 300 * 19 + 150 * 49 + 50 * 199]  # 月收入

bars2 = ax2.bar(scenarios, revenue_10k, color=['#fab1a0', '#ffeaa7', '#55efc4'],
                alpha=0.85, edgecolor='white', linewidth=2)
ax2.set_xlabel('场景', fontsize=11, fontweight='bold')
ax2.set_ylabel('月度收入（元）', fontsize=11, fontweight='bold')
ax2.set_title('10,000用户规模下的收入预测', fontsize=13, fontweight='bold', pad=15)
ax2.grid(axis='y', alpha=0.3, linestyle='--')

for bar, revenue in zip(bars2, revenue_10k):
    height = bar.get_height()
    ax2.text(bar.get_x() + bar.get_width()/2., height + 200,
             f'¥{revenue:,}', ha='center', va='bottom', fontsize=11, fontweight='bold')

# 3. 单用户经济模型
lifecycle = ['获客', '激活', '转化', '留存', '推荐']
values = [50, 15, 30, 120, 80]  # 价值评分
colors_lifecycle = ['#ff7675', '#fd79a8', '#fdcb6e', '#00b894', '#74b9ff']

bars3 = ax3.bar(lifecycle, values, color=colors_lifecycle, alpha=0.85,
                edgecolor='white', linewidth=2)
ax3.set_xlabel('用户生命周期阶段', fontsize=11, fontweight='bold')
ax3.set_ylabel('重要性评分', fontsize=11, fontweight='bold')
ax3.set_title('单用户经济模型关键指标', fontsize=13, fontweight='bold', pad=15)
ax3.grid(axis='y', alpha=0.3, linestyle='--')
ax3.set_ylim([0, 140])

for bar in bars3:
    height = bar.get_height()
    ax3.text(bar.get_x() + bar.get_width()/2., height + 5,
             f'{height}', ha='center', va='bottom', fontsize=10, fontweight='bold')

# 4. 盈亏平衡分析
users_range = np.linspace(0, 3000, 100)
revenue_per_user = 25  # 平均客单价
cost_per_user = 15  # 单用户成本

revenue_line = users_range * revenue_per_user
cost_line = users_range * cost_per_user + 3000  # 3000固定成本

ax4.plot(users_range, revenue_line, color='#00b894', linewidth=3, label='收入曲线', marker='o', markersize=8)
ax4.plot(users_range, cost_line, color='#d63031', linewidth=3, label='成本曲线', marker='s', markersize=8)
ax4.fill_between(users_range, revenue_line, cost_line, where=(revenue_line >= cost_line),
                 alpha=0.3, color='#00b894', label='盈利区域')
ax4.fill_between(users_range, revenue_line, cost_line, where=(revenue_line < cost_line),
                 alpha=0.3, color='#d63031', label='亏损区域')

ax4.set_xlabel('付费用户数', fontsize=11, fontweight='bold')
ax4.set_ylabel('金额（元）', fontsize=11, fontweight='bold')
ax4.set_title('盈亏平衡分析（假设）', fontsize=13, fontweight='bold', pad=15)
ax4.legend(loc='upper left', fontsize=10, framealpha=0.9)
ax4.grid(alpha=0.3, linestyle='--')

# 标记盈亏平衡点
breakeven = 3000 / (revenue_per_user - cost_per_user)
ax4.plot(breakeven, breakeven * revenue_per_user, 'ko', markersize=12,
         markerfacecolor='yellow', markeredgewidth=3)
ax4.annotate(f'盈亏平衡点\n{breakeven:.0f} 用户',
            xy=(breakeven, breakeven * revenue_per_user),
            xytext=(breakeven + 400, breakeven * revenue_per_user - 10000),
            fontsize=11, fontweight='bold',
            arrowprops=dict(arrowstyle='->', lw=2, color='#2d3436'),
            bbox=dict(boxstyle='round,pad=0.5', facecolor='yellow', alpha=0.7))

plt.tight_layout()
plt.savefig(f'{output_dir}/05_商业模式设计.png', dpi=300, bbox_inches='tight', facecolor='white')
print(f"✅ 已保存: {output_dir}/05_商业模式设计.png")
plt.close()

# ============================================
# 图表 6: SWOT 分析
# ============================================
print("\n🎯 生成图表 6: SWOT 战略分析")

fig, ax = plt.subplots(figsize=(14, 10))

categories = ['优势 Strengths', '劣势 Weaknesses',
              '机会 Opportunities', '威胁 Threats']
counts = [4, 4, 4, 4]
colors_swot = ['#00b894', '#d63031', '#0984e3', '#e17055']

items = [
    ['垂直化聚焦', '小宇宙深度集成', '极致用户体验', '低成本起步'],
    ['个人开发资源', '无官方合作', '技术门槛', '资金有限'],
    ['播客市场快速增长', '用户付费意愿提升', '竞品未深耕播客', 'AI技术成熟'],
    ['平台政策风险', '大厂可能入局', '用户获取成本高', '盈利不确定性强']
]

# 创建2x2网格
positions = [(1, 1), (1, -1), (-1, -1), (-1, 1)]
for i, (category, count, color, item_list) in enumerate(zip(categories, counts, colors_swot, items)):
    x, y = positions[i]

    # 绘制象限
    rect = mpatches.FancyBboxPatch((x*0.6 - 0.1, y*0.4 - 0.15), 1.1, 0.7,
                                   boxstyle="round,pad=0.1",
                                   edgecolor='white', linewidth=3,
                                   facecolor=color, alpha=0.15)
    ax.add_patch(rect)

    # 标题
    ax.text(x, y * 0.6 + 0.15, category, ha='center', va='center',
            fontsize=14, fontweight='bold', style='italic',
            bbox=dict(boxstyle='round,pad=0.7', facecolor=color,
                     edgecolor='white', linewidth=2, alpha=0.85))

    # 要素列表
    for j, item in enumerate(item_list, 1):
        ax.text(x, y * 0.6 - 0.1 * j, f'• {item}', ha='center', va='center',
                fontsize=11, color='#2d3436', weight='500')

# 中心标题
ax.text(0, 0, '播客逐字稿产品\nSWOT分析',
        ha='center', va='center', fontsize=16, fontweight='bold',
        bbox=dict(boxstyle='circle,pad=0.8', facecolor='#ffeaa7',
                 edgecolor='#fdcb6e', linewidth=4, alpha=0.9))

ax.set_xlim(-1.5, 1.5)
ax.set_ylim(-0.8, 0.8)
ax.axis('off')
ax.set_title('核心战略定位分析', fontsize=16, fontweight='bold', pad=30, y=1.05)

plt.tight_layout()
plt.savefig(f'{output_dir}/06_SWOT战略分析.png', dpi=300, bbox_inches='tight', facecolor='white')
print(f"✅ 已保存: {output_dir}/06_SWOT战略分析.png")
plt.close()

print("\n" + "="*80)
print(f"✅ 所有图表已成功生成到目录: {output_dir}")
print("="*80)

# 生成数据摘要
summary_data = {
    '市场规模': {
        '2024年长音频市场': '310亿元',
        '2025年播客市场': '50亿元',
        '用户规模': '1.5亿+',
        '年增长率': '约8%'
    },
    '小宇宙用户': {
        '月活用户': '约900万',
        '核心年龄': '26-35岁 (45%)',
        '城市分布': '一线+新一线 (63%)',
        '付费意愿': '42%愿意付费'
    },
    '竞品定价': {
        '飞书妙记': '免费300分钟/月',
        '通义听悟': '29元/月，10小时',
        '讯飞听见': '约100元/6小时'
    },
    '成本模型': {
        '1人(MVP)': '110元/月',
        '100人': '800元/月',
        '1000人': '5,100元/月',
        '10000人': '30,000元/月',
        '100000人': '149,000元/月'
    }
}

print("\n📋 核心数据摘要:")
print("-" * 50)
for category, data in summary_data.items():
    print(f"\n【{category}】")
    for key, value in data.items():
        print(f"  {key}: {value}")

print("\n" + "="*80)
