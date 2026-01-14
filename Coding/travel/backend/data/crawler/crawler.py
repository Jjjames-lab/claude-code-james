#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
越南旅行数据爬虫
MVP版本：手动整理数据 + 可选的爬虫框架
"""

import json
import os
from datetime import datetime

class VietnamDataCrawler:
    """越南旅行数据爬虫类"""

    def __init__(self):
        self.data_dir = os.path.dirname(os.path.abspath(__file__))
        self.output_dir = os.path.join(self.data_dir, '..', 'output')
        os.makedirs(self.output_dir, exist_ok=True)

    def create_sample_data(self):
        """
        创建示例数据（MVP版本）

        注意：由于爬虫涉及法律合规问题，
        MVP阶段我们使用手动整理的真实数据作为起点
        """

        # 河内景点数据
        hanoi_attractions = [
            {
                "id": "attraction_001",
                "name": "三十六行街",
                "nameEn": "36 Streets",
                "city": "河内",
                "cityEn": "Hanoi",
                "category": ["文化", "历史", "购物"],
                "description": "河内最古老的商业区，由36条各具特色的街道组成。每条街传统上经营一种商品，如银器街、丝绸街、纸街等。这里是体验河内当地人生活的最佳地点。",
                "highlights": ["历史悠久", "当地生活", "购物天堂"],
                "location": {
                    "address": "河内市还剑湖区",
                    "latitude": 21.0341,
                    "longitude": 105.8491
                },
                "visit_info": {
                    "duration": "2-3小时",
                    "best_time": "上午或傍晚",
                    "opening_hours": "全天开放",
                    "ticket_price": {
                        "amount": 0,
                        "currency": "CNY",
                        "description": "免费"
                    },
                    "cost_level": "免费"
                },
                "experience": {
                    "suitable_for": ["情侣", "家庭", "朋友"],
                    "activity_level": "低",
                    "crowd_level": "人多"
                },
                "tips": [
                    "可以骑人力三轮车游览",
                    "建议早晚去，避开中午高温",
                    "可以品尝当地小吃",
                    "记得讨价还价"
                ],
                "rating": {
                    "overall": 4.5,
                    "count": 1234
                },
                "tags": ["必去", "经典", "文化体验"],
                "metadata": {
                    "source": "手动整理",
                    "crawl_time": datetime.now().strftime("%Y-%m-%d")
                }
            },
            {
                "id": "attraction_002",
                "name": "还剑湖",
                "nameEn": "Hoan Kiem Lake",
                "city": "河内",
                "cityEn": "Hanoi",
                "category": ["自然", "地标"],
                "description": "河内的中心湖泊，湖名来源于传说中黎利太祖还剑给神龟的故事。清晨和傍晚是最佳游览时间，可以看到当地人在湖边锻炼、散步。",
                "highlights": ["城市地标", "清晨散步", "夜生活"],
                "location": {
                    "address": "河内市中心",
                    "latitude": 21.0285,
                    "longitude": 105.8525
                },
                "visit_info": {
                    "duration": "1小时",
                    "best_time": "清晨或傍晚",
                    "opening_hours": "全天开放",
                    "ticket_price": {
                        "amount": 0,
                        "currency": "CNY",
                        "description": "免费"
                    },
                    "cost_level": "免费"
                },
                "experience": {
                    "suitable_for": ["所有人"],
                    "activity_level": "低",
                    "crowd_level": "适中"
                },
                "tips": [
                    "清晨去看日出",
                    "晚上有夜市",
                    "可以步行环绕一周"
                ],
                "rating": {
                    "overall": 4.7,
                    "count": 2341
                },
                "tags": ["必去", "地标", "免费"],
                "metadata": {
                    "source": "手动整理",
                    "crawl_time": datetime.now().strftime("%Y-%m-%d")
                }
            },
            {
                "id": "attraction_003",
                "name": "胡志明纪念馆",
                "nameEn": "Ho Chi Minh Mausoleum",
                "city": "河内",
                "cityEn": "Hanoi",
                "category": ["历史", "文化"],
                "description": "越南国父胡志明的陵墓，是他长眠的地方。陵墓庄严肃穆，是越南人民缅怀伟人的重要场所。需要遵守着装要求，不能穿短裤、短裙。",
                "highlights": ["历史教育", "瞻仰", "庄严肃穆"],
                "location": {
                    "address": "河内市巴亭广场",
                    "latitude": 21.0375,
                    "longitude": 105.8343
                },
                "visit_info": {
                    "duration": "1小时",
                    "best_time": "上午",
                    "opening_hours": "周二至周四、周末 7:30-10:30",
                    "ticket_price": {
                        "amount": 0,
                        "currency": "CNY",
                        "description": "免费"
                    },
                    "cost_level": "免费"
                },
                "experience": {
                    "suitable_for": ["对历史感兴趣"],
                    "activity_level": "低",
                    "crowd_level": "多"
                },
                "tips": [
                    "必须穿戴整齐（长裤、有袖上衣）",
                    "保持安静",
                    "不能拍照",
                    "排队时间可能很长"
                ],
                "rating": {
                    "overall": 4.6,
                    "count": 1876
                },
                "tags": ["历史", "教育"],
                "metadata": {
                    "source": "手动整理",
                    "crawl_time": datetime.now().strftime("%Y-%m-%d")
                }
            }
        ]

        # 越南美食数据
        vietnamese_food = [
            {
                "id": "food_001",
                "name": "越南河粉",
                "nameEn": "Pho",
                "city": "河内",
                "description": "越南国菜，清汤河粉，配牛肉或鸡肉。汤底由牛骨熬制数小时，加入八角、桂皮等香料。是越南人最爱的早餐。",
                "type": "主食",
                "price_range": {
                    "min": 15,
                    "max": 30,
                    "currency": "CNY",
                    "description": "15-30元"
                },
                "must_try": True,
                "recommend_places": [
                    {
                        "name": "Pho 10 Ly Quoc Su",
                        "address": "10 Ly Quoc Su Street",
                        "specialty": "传统河粉",
                        "price_level": "中等"
                    },
                    {
                        "name": "Pho Gia Truyen",
                        "address": "49 Bat Dan Street",
                        "specialty": "牛肉河粉",
                        "price_level": "经济"
                    }
                ],
                "flavor_profile": ["清淡", "鲜美", "有汤"],
                "suitable_for": ["所有人"],
                "tips": [
                    "记得加柠檬和豆芽",
                    "可以根据口味加辣椒酱",
                    "早餐时间很多店都营业"
                ],
                "rating": {
                    "overall": 4.8,
                    "count": 856
                },
                "metadata": {
                    "source": "手动整理",
                    "crawl_time": datetime.now().strftime("%Y-%m-%d")
                }
            },
            {
                "id": "food_002",
                "name": "越南春卷",
                "nameEn": "Nem Ran",
                "city": "越南",
                "description": "越南传统小吃，用米纸包裹猪肉、虾、蔬菜等，油炸至金黄。外皮酥脆，内馅鲜美，蘸着鱼露食用。",
                "type": "小吃",
                "price_range": {
                    "min": 5,
                    "max": 15,
                    "currency": "CNY",
                    "description": "5-15元/个"
                },
                "must_try": True,
                "recommend_places": [
                    {
                        "name": "Nem Restaurant",
                        "address": "河内还剑湖区",
                        "specialty": "传统春卷",
                        "price_level": "中等"
                    }
                ],
                "flavor_profile": ["酥脆", "鲜美", "有嚼劲"],
                "suitable_for": ["所有人"],
                "tips": [
                    "趁热吃最美味",
                    "蘸鱼露味道更正宗"
                ],
                "rating": {
                    "overall": 4.6,
                    "count": 543
                },
                "metadata": {
                    "source": "手动整理",
                    "crawl_time": datetime.now().strftime("%Y-%m-%d")
                }
            },
            {
                "id": "food_003",
                "name": "越南滴漏咖啡",
                "nameEn": "Ca Phe Sua Da",
                "city": "越南",
                "description": "越南特色咖啡，用滴漏壶慢慢滴入炼乳中，喝时搅拌，口感浓郁香甜。是体验越南慢生活的最佳方式。",
                "type": "饮品",
                "price_range": {
                    "min": 10,
                    "max": 25,
                    "currency": "CNY",
                    "description": "10-25元"
                },
                "must_try": True,
                "recommend_places": [
                    {
                        "name": "Cafe Giang",
                        "address": "39 Nguyen Huu Huan, Hanoi",
                        "specialty": "鸡蛋咖啡",
                        "price_level": "中等"
                    },
                    {
                        "name": "Cafe Dinh",
                        "address": "13 Dinh Tien Hoang, Hanoi",
                        "specialty": "传统滴漏咖啡",
                        "price_level": "经济"
                    }
                ],
                "flavor_profile": ["浓郁", "香甜", "提神"],
                "suitable_for": ["咖啡爱好者"],
                "tips": [
                    "需要耐心等待滴漏",
                    "可以搭配酸奶",
                    "坐在路边小店体验最地道"
                ],
                "rating": {
                    "overall": 4.7,
                    "count": 678
                },
                "metadata": {
                    "source": "手动整理",
                    "crawl_time": datetime.now().strftime("%Y-%m-%d")
                }
            }
        ]

        # 保存数据
        self.save_data('attractions.json', hanoi_attractions)
        self.save_data('food.json', vietnamese_food)

        print("✅ 示例数据已创建！")
        print(f"📁 数据保存在: {self.output_dir}")

    def save_data(self, filename, data):
        """保存数据到JSON文件"""
        filepath = os.path.join(self.output_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ 已保存: {filename}")

    def add_attraction(self, attraction_data):
        """
        添加新景点

        使用方法：
        crawler = VietnamDataCrawler()
        crawler.add_attraction({
            "name": "新景点",
            "city": "河内",
            ...
        })
        """
        # 读取现有数据
        attractions_file = os.path.join(self.output_dir, 'attractions.json')
        try:
            with open(attractions_file, 'r', encoding='utf-8') as f:
                attractions = json.load(f)
        except FileNotFoundError:
            attractions = []

        # 添加新景点
        attraction_data['id'] = f"attraction_{len(attractions)+1:03d}"
        attraction_data['metadata'] = {
            "source": "手动添加",
            "crawl_time": datetime.now().strftime("%Y-%m-%d")
        }
        attractions.append(attraction_data)

        # 保存
        self.save_data('attractions.json', attractions)
        print(f"✅ 已添加景点: {attraction_data['name']}")


def main():
    """主函数"""
    print("=" * 50)
    print("🌍 越南旅行数据爬虫 - MVP版本")
    print("=" * 50)
    print()

    crawler = VietnamDataCrawler()

    print("创建示例数据...")
    print()
    crawler.create_sample_data()
    print()

    print("=" * 50)
    print("📝 如何添加更多数据？")
    print("=" * 50)
    print()
    print("方法1：直接编辑JSON文件")
    print("  位置: backend/data/output/")
    print()
    print("方法2：使用Python脚本添加")
    print("  from crawler import VietnamDataCrawler")
    print("  crawler = VietnamDataCrawler()")
    print("  crawler.add_attraction({...})")
    print()
    print("=" * 50)


if __name__ == "__main__":
    main()
