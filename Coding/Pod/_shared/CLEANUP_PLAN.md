# _shared 文件夹清理方案

> **创建时间**: 2026-01-28
> **目标**: 删除过期文档，保留核心参考

---

## 📊 当前状态

- **总文件数**: 27 个
- **总大小**: 696K
- **文件类型**: 技术规范、任务文档、配置文档

---

## 🗑️ 可以删除的文档（15个）

### 1. 过期项目状态（1个）
- `00_project_status.md` (17K)
  - ❌ 原因：2026-01-21 过期，已被 CHANGELOG.md 替代

### 2. Go 后端迁移相关（4个）
- `18_architect_task_go_migration_design.md` (10K)
- `19_go_backend_migration_architecture.md` (23K)
- `20_go_backend_compliance_fix_guide.md` (4.6K)
- `21_stage4_crawler_service_task.md` (12K)
  - ❌ 原因：Go 迁移计划已取消，后端使用 Python FastAPI

### 3. 阶段性任务文档（6个）
- `20_stage3_minio_integration_task.md` (15K)
- `21_frontend_compliance_fix_guide.md` (9.0K)
- `22_stage5_frontend_integration_guide.md` (7.1K)
- `23_stage5_test_report.md` (5.4K)
- `10_task_assignment_mixed_parallel.md` (9.9K)
- `11_supervisor_system.md` (6.8K)
  - ❌ 原因：一次性任务文档，已完成

### 4. 旧的修复指南（2个）
- `backend_fix_guide.md` (14K)
- `frontend_fix_guide.md` (10K)
  - ❌ 原因：临时修复文档，问题已解决

### 5. 临时协作文档（1个）
- `README_collaboration.md` (6.0K)
  - ❌ 原因：临时协作说明，已过时

### 6. 过期的设计文档（1个）
- `04_changelog.md` (1.6K)
  - ❌ 原因：已被根目录 CHANGELOG.md 替代

**可删除大小**: 约 150K

---

## ✅ 应保留的核心文档（12个）

### 🔥 核心技术规范（5个）
1. `01_api_spec.json` (15K)
   - ✅ API 契约规范
2. `02_design_tokens.md` (11K)
   - ✅ 设计系统规范
3. `05_asr_switching_spec.md` (8.9K)
   - ✅ ASR 切换机制
4. `06_storage_management_spec.md` (9.0K)
   - ✅ 存储管理策略
5. `09_multi_engine_architecture.md` (34K)
   - ✅ 多引擎架构设计

### 📚 实现指南（2个）
6. `07_doubao_asr_implementation.md` (29K)
   - ✅ 豆包 ASR 完整实现指南
7. `13_oss_setup_guide.md` (8.6K)
   - ✅ OSS 配置教程

### 🧪 测试相关（1个）
8. `03_testing_checklist.md` (17K)
   - ✅ 测试清单

### 🔑 配置文档（2个）
9. `11_asr_config.md` (4.2K)
   - ✅ ASR 配置
10. `12_asr_credentials.md` (2.4K)
    - ✅ ASR 凭证（敏感信息，需保留）

### 📝 模板文档（1个）
11. `WORK_LOG_TEMPLATE.md` (2.4K)
    - ✅ 工作日志模板

### 📋 其他（1个）
12. `01_api_spec.json` 的 JSON 文件
    - ✅ API 规范

**保留大小**: 约 546K

---

## 📊 优化效果

| 项目 | 数量 | 大小 |
|------|------|------|
| **删除** | 15 个 | 150K |
| **保留** | 12 个 | 546K |
| **减少比例** | **55.6%** | **21.6%** |

---

## 🚀 执行步骤

```bash
cd "/Users/tbingy/Desktop/Claude Code/Coding/Pod/_shared"

# 删除过期文档
rm 00_project_status.md
rm 18_architect_task_go_migration_design.md
rm 19_go_backend_migration_architecture.md
rm 20_go_backend_compliance_fix_guide.md
rm 21_stage4_crawler_service_task.md
rm 20_stage3_minio_integration_task.md
rm 21_frontend_compliance_fix_guide.md
rm 22_stage5_frontend_integration_guide.md
rm 23_stage5_test_report.md
rm 10_task_assignment_mixed_parallel.md
rm 11_supervisor_system.md
rm backend_fix_guide.md
rm frontend_fix_guide.md
rm README_collaboration.md
rm 04_changelog.md

# 创建归档文件夹（可选）
mkdir -p ../docs/archived/_shared_backup
# 移动到归档（如果想备份）
# mv *.md ../docs/archived/_shared_backup/
```

---

## ✅ 精简后结构

```
_shared/
├── 核心规范/
│   ├── 01_api_spec.json          # API 契约
│   ├── 02_design_tokens.md       # 设计系统
│   ├── 05_asr_switching_spec.md  # ASR 切换
│   ├── 06_storage_management_spec.md  # 存储管理
│   └── 09_multi_engine_architecture.md  # 多引擎架构
│
├── 实现指南/
│   ├── 07_doubao_asr_implementation.md  # 豆包 ASR 指南
│   └── 13_oss_setup_guide.md     # OSS 配置
│
├── 测试/
│   └── 03_testing_checklist.md   # 测试清单
│
├── 配置/
│   ├── 11_asr_config.md          # ASR 配置
│   └── 12_asr_credentials.md     # ASR 凭证
│
└── 模板/
    └── WORK_LOG_TEMPLATE.md      # 工作日志模板
```

---

**确认删除这些文件吗？**
