# LocalStorage 容量管理策略

**版本**：v1.0
**创建日期**：2026-01-20
**创建者**：架构师 Architect
**目标角色**：前端工程师

---

## 1. 容量估算

### 1.1 单集播客数据大小

| 数据类型 | 估算大小 | 说明 |
|---------|---------|------|
| 元数据（标题、封面等） | ~5 KB | JSON 结构 |
| 转录数据（60 分钟音频） | ~2 MB | 词级时间戳，约 8500 个词 |
| 笔记数据 | ~10 KB | 按平均 20 条笔记计算 |
| **单集总计** | **~2 MB** | - |

### 1.2 浏览器容量限制

| 浏览器 | LocalStorage 限制 | 实际可用 |
|--------|------------------|---------|
| Chrome | 5-10 MB | ~5 集播客 |
| Firefox | 5-10 MB | ~5 集播客 |
| Safari | 5 MB | ~2 集播客 |
| Edge | 5-10 MB | ~5 集播客 |

⚠️ **结论**：LocalStorage 最多存储 2-5 集播客，必须主动管理

---

## 2. 存储监控机制

### 2.1 使用率检测

```typescript
// src/utils/storageMonitor.ts

export class StorageMonitor {
  private readonly WARNING_THRESHOLD = 0.8; // 80% 警告
  private readonly CRITICAL_THRESHOLD = 0.95; // 95% 严重警告

  /**
   * 获取当前存储使用率
   */
  getUsageRate(): number {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total / (5 * 1024 * 1024); // 假设 5MB 限制
  }

  /**
   * 获取使用情况详情
   */
  getUsageDetails(): {
    used: number;      // 已使用 KB
    total: number;     // 总量 KB
    percentage: number; // 百分比
    status: 'ok' | 'warning' | 'critical';
  } {
    const used = this.getUsedSizeInKB();
    const total = 5 * 1024; // 5MB
    const percentage = (used / total) * 100;

    let status: 'ok' | 'warning' | 'critical' = 'ok';
    if (percentage >= 95) status = 'critical';
    else if (percentage >= 80) status = 'warning';

    return { used, total, percentage, status };
  }

  /**
   * 检查是否可以存储新数据
   */
  canStore(dataSizeKB: number): boolean {
    const current = this.getUsedSizeInKB();
    return (current + dataSizeKB) < (5 * 1024 * 0.95); // 保留 5% 缓冲
  }

  private getUsedSizeInKB(): number {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total / 1024;
  }
}
```

### 2.2 存储前预检查

```typescript
// src/utils/storage.ts

export function safeSetItem(key: string, value: any): boolean {
  const monitor = new StorageMonitor();

  // 预检查
  const dataSize = new Blob([JSON.stringify(value)]).size;
  const dataSizeKB = dataSize / 1024;

  if (!monitor.canStore(dataSizeKB)) {
    // 触发容量警告
    throw new StorageQuotaExceededError(
      'STORAGE_QUOTA_EXCEEDED',
      '存储空间不足，请清理旧数据'
    );
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    if (e instanceof QuotaExceededError) {
      throw new StorageQuotaExceededError(
        'STORAGE_QUOTA_EXCEEDED',
        '存储空间不足，请清理旧数据'
      );
    }
    throw e;
  }
}
```

---

## 3. 用户提示策略

### 3.1 分级提示

| 使用率 | 提示级别 | 交互 | 频率 |
|--------|---------|------|------|
| < 80% | 无提示 | - | - |
| 80% - 95% | ⚠️ 警告 | 非侵入式提示（Toast） | 每次写入时 |
| ≥ 95% | 🚨 严重警告 | 强制弹窗 | 每次写入时 |
| 100%（写入失败） | ❌ 阻塞 | 阻塞弹窗，必须清理 | 实时 |

### 3.2 提示文案

#### 警告级别（80% - 95%）

```
⚠️ 存储空间不足

当前已使用 85% 的本地存储空间。
建议清理旧的播客转录记录以释放空间。

[查看详情] [稍后提醒]
```

#### 严重警告（≥ 95%）

```
🚨 存储空间即将耗尽

当前已使用 96% 的本地存储空间。
如果不清理，将无法保存新的转录记录。

[立即清理] [查看占用详情]
```

#### 写入失败（100%）

```
❌ 无法保存

存储空间已满，无法保存新的转录记录。

请执行以下操作之一：
1. 删除旧的播客记录
2. 导出数据后清理

[删除旧记录] [导出数据] [取消]
```

---

## 4. 自动清理建议

### 4.1 清理策略

| 策略 | 优先级 | 说明 |
|------|--------|------|
| **按时间清理** | 推荐 | 删除最早创建的节目 |
| **按大小清理** | 备选 | 删除占用空间最大的节目 |
| **按使用频率** | 可选 | 删除最久未播放的节目 |

### 4.2 清理界面设计

```typescript
// 清理弹窗组件

<StorageCleanupDialog>
  <Header>存储空间管理</Header>

  <UsageProgress value={85} max={100} />

  <EpisodeList>
    {episodes.map(ep => (
      <EpisodeItem>
        <EpisodeTitle>{ep.title}</EpisodeTitle>
        <EpisodeSize>{ep.size} MB</EpisodeSize>
        <EpisodeDate>{ep.created_at}</EpisodeDate>
        <DeleteButton onClick={() => deleteEpisode(ep.id)}>
          删除
        </DeleteButton>
      </EpisodeItem>
    ))}
  </EpisodeList>

  <Footer>
    <PrimaryButton>自动清理最旧的 1 集</PrimaryButton>
    <SecondaryButton>取消</SecondaryButton>
  </Footer>
</StorageCleanupDialog>
```

---

## 5. 数据导出与备份

### 5.1 导出功能

```typescript
// src/utils/storageExport.ts

export function exportAllData(): void {
  const episodes = getAllEpisodes();
  const settings = getSettings();

  const data = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    episodes,
    settings
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pod-studio-backup-${Date.now()}.json`;
  a.click();
}

export function importData(jsonFile: File): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = JSON.parse(e.target?.result as string);
    // 导入逻辑
  };
  reader.readAsText(jsonFile);
}
```

### 5.2 Markdown 导出（单集）

```typescript
export function exportEpisodeAsMarkdown(episodeId: string): void {
  const episode = getEpisode(episodeId);
  const markdown = generateMarkdown(episode);

  const blob = new Blob([markdown], { type: 'text/markdown' });
  // 下载逻辑
}

function generateMarkdown(episode: Episode): string {
  let md = `# ${episode.title}\n\n`;
  md += `**播客**：${episode.podcast_name}\n\n`;
  md += `**时长**：${formatDuration(episode.duration)}\n\n`;
  md += `---\n\n`;

  episode.transcript.words.forEach(word => {
    const timestamp = formatTimestamp(word.start);
    md += `[${word.speaker}] ${timestamp} ${word.text} `;
  });

  return md;
}
```

---

## 6. MVP 阶段最小实现

### 6.1 必须实现（P0）

- ✅ 写入前检查容量
- ✅ 容量超限时抛出 `STORAGE_QUOTA_EXCEEDED` 错误
- ✅ 错误发生时显示"存储空间已满"提示
- ✅ 提供删除旧记录的功能

### 6.2 建议实现（P1）

- ✅ 80% 使用率时提前警告
- ✅ 存储使用率可视化（进度条）
- ✅ 显示每个节目的大小

### 6.3 可选实现（P2）

- ⚠️ 数据导出功能
- ⚠️ 自动清理建议
- ⚠️ 跨设备迁移

---

## 7. 错误码更新

更新 `_shared/01_api_spec.json` 中的错误码定义：

```json
{
  "STORAGE_QUOTA_EXCEEDED": {
    "code": 5001,
    "http_status": 507,
    "message": "本地存储空间不足，请清理旧数据",
    "user_action": "删除旧的播客记录或导出数据",
    "frontend_handling": {
      "show_dialog": true,
      "dialog_type": "blocking",
      "actions": ["delete_old", "export_data", "cancel"]
    }
  }
}
```

---

## 8. 给前端工程师的实现清单

- [ ] 实现 `StorageMonitor` 类
- [ ] 实现 `safeSetItem` 函数（预检查 + try-catch）
- [ ] 实现存储使用率可视化组件
- [ ] 实现容量警告 Toast（80%）
- [ ] 实现容量严重警告弹窗（95%）
- [ ] 实现写入失败阻塞弹窗（100%）
- [ ] 实现删除旧记录功能
- [ ] （可选）实现数据导出功能

---

## 9. 给产品经理的建议

**测试场景**：
- TC-DATA-002：写入 10 集长播客，验证是否触发容量警告
- TC-DATA-005：导出数据为 JSON/Markdown 格式

**验收标准**：
- ✅ 存储超限时用户能看到明确提示
- ✅ 用户能删除旧记录释放空间
- ✅ 删除后能正常保存新数据

---

## 10. 与产品经理测试清单的对应关系

| 测试清单中的问题 | 本文档的回应 |
|----------------|-------------|
| **LocalStorage 容量超限处理未定义** | ✅ 第 2-6 节定义了监控、提示、清理策略 |
| **需要添加 STORAGE_QUOTA_EXCEEDED 错误码** | ✅ 第 7 节更新了错误码定义 |

---

**文档状态**：✅ 已完成
**下一步行动**：
1. 前端工程师实现存储监控和管理功能
2. 产品经理更新测试清单，标记此问题已解决
3. （可选）后续实现 IndexedDB 替代方案（更大容量）

---

**变更记录**：
- 2026-01-20 v1.0：初始版本，回应产品经理审核问题
