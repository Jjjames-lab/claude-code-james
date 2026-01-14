# 越南旅行数据结构设计

## 概述

本文档定义了越南旅行数据的存储结构，用于AI旅行顾问的知识库。

---

## 1. 景点数据结构

### 1.1 景点基本信息

```json
{
  "id": "attraction_001",
  "name": "三十六行街",
  "nameEn": "36 Streets",
  "city": "河内",
  "cityEn": "Hanoi",
  "category": ["文化", "历史", "购物"],
  "category_priority": 1,

  "description": "河内最古老的商业区，由36条各具特色的街道组成",
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
    "可以骑三轮车游览",
    "建议早晚去，避开中午高温",
    "可以品尝当地小吃"
  ],

  "rating": {
    "overall": 4.5,
    "count": 1234,
    "source": "小红书, 马蜂窝"
  },

  "photos": [],
  "tags": ["必去", "经典", "文化体验"],

  "metadata": {
    "source": "小红书",
    "source_url": "https://...",
    "crawl_time": "2026-01-08",
    "last_updated": "2026-01-08"
  }
}
```

---

## 2. 美食数据结构

```json
{
  "id": "food_001",
  "name": "越南河粉",
  "nameEn": "Pho",
  "city": "河内",

  "description": "越南国菜，清汤河粉，配牛肉或鸡肉",
  "type": "主食",

  "price_range": {
    "min": 15,
    "max": 30,
    "currency": "CNY",
    "description": "15-30元"
  },

  "must_try": true,

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
    "可以根据口味加辣椒酱"
  ],

  "rating": {
    "overall": 4.8,
    "count": 856
  },

  "metadata": {
    "source": "小红书",
    "crawl_time": "2026-01-08"
  }
}
```

---

## 3. 住宿区域数据结构

```json
{
  "id": "accommodation_001",
  "city": "河内",
  "area_name": "还剑湖附近",

  "description": "河内市中心区域，交通便利",

  "pros": [
    "交通便利，靠近主要景点",
    "餐饮选择多",
    "购物方便"
  ],

  "cons": [
    "价格相对较高",
    "人流量大"
  ],

  "accommodation_types": ["酒店", "民宿", "青年旅舍"],

  "price_range": {
    "budget": {
      "min": 200,
      "max": 400,
      "currency": "CNY",
      "description": "经济型"
    },
    "mid_range": {
      "min": 400,
      "max": 800,
      "currency": "CNY",
      "description": "舒适型"
    },
    "luxury": {
      "min": 800,
      "max": 2000,
      "currency": "CNY",
      "description": "豪华型"
    }
  },

  "suitable_for": ["第一次来河内", "喜欢便利", "预算充足"],

  "transportation": {
    "to_airport": "40分钟",
    "to_old_quarter": "步行可达"
  },

  "nearby_attractions": ["还剑湖", "三十六行街", "圣若瑟主教座堂"],

  "rating": {
    "convenience": 4.7,
    "safety": 4.8
  },

  "metadata": {
    "source": "马蜂窝",
    "crawl_time": "2026-01-08"
  }
}
```

---

## 4. 交通信息数据结构

```json
{
  "id": "transport_001",
  "route": "北京_河内",

  "flight": {
    "direct": false,
    "routes": [
      {
        "from": "北京",
        "to": "河内",
        "stops": ["广州"],
        "airlines": ["南方航空", "越南航空"],
        "duration": "6-8小时",
        "price_range": {
          "min": 2000,
          "max": 4000,
          "currency": "CNY"
        }
      }
    ]
  },

  "visa_requirement": {
    "needed": true,
    "type": "电子签证",
    "processing_time": "3个工作日",
    "cost": 25,
    "cost_currency": "USD"
  },

  "best_booking_time": "提前1-2个月",

  "tips": [
    "电子签证官网申请",
    "注意有效期",
    "打印确认单"
  ],

  "metadata": {
    "source": "综合信息",
    "last_updated": "2026-01-08"
  }
}
```

---

## 5. 季节信息数据结构

```json
{
  "id": "season_001",
  "month": 2,
  "month_name": "二月",

  "weather": {
    "temperature": {
      "min": 15,
      "max": 20,
      "unit": "℃",
      "description": "温暖舒适"
    },
    "rainfall": "较少",
    "humidity": "适中"
  },

  "recommend_cities": ["河内", "下龙湾", "岘港"],

  "clothing_advice": "长袖、薄外套",

  "highlights": ["天气舒适", "适合旅游", "避开雨季"],

  "cautions": [],

  "festival": [],

  "metadata": {
    "source": "历史气象数据",
    "last_updated": "2026-01-08"
  }
}
```

---

## 6. 数据优先级

### MVP阶段必需数据
1. **景点**：至少20个热门景点
   - 河内：10个
   - 下龙湾：3个
   - 会安：3个
   - 胡志明市：4个

2. **美食**：至少15种
   - 越南河粉
   - 春卷
   - 咖啡
   - 法棍三明治
   - 等

3. **住宿区域**：至少5个主要区域

4. **季节信息**：12个月

### 后续补充
- 更多景点、美食
- 用户评价
- 实时价格
- 特殊活动

---

## 7. 数据存储格式

### 文件存储（MVP阶段）
```
backend/data/
├── attractions.json      # 景点数据
├── food.json             # 美食数据
├── accommodation.json     # 住宿数据
├── transportation.json    # 交通信息
└── seasons.json          # 季节信息
```

### 数据库（后续）
```sql
CREATE TABLE attractions (
  id TEXT PRIMARY KEY,
  data JSON
);
```

---

## 8. 数据质量要求

### 必需字段
- `id`: 唯一标识
- `name`: 名称
- `city`: 所在城市
- `description`: 描述
- `rating`: 评分
- `metadata.source`: 数据来源

### 可选字段
- `photos`: 图片（后续）
- `tips`: 小贴士
- 等等

### 数据验证
- 必需字段不能为空
- 评分在1-5之间
- 价格为正数
- 经纬度在合理范围

---

## 9. 更新策略

### 初期
- 手动整理部分核心数据
- 快速验证系统

### 中期
- 爬虫自动收集
- 定期更新（每周）

### 长期
- 用户贡献
- 实时更新
- 多源验证
