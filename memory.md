# Claude Code 使用记忆

## 2026-01-09

### Prompt 工程学习

**重要**：James 要求在写 prompt 时借鉴 Anthropic 官方教程的结构。

#### 10 要素复杂 Prompt 结构

来自：`prompt-eng-interactive-tutorial/Anthropic 1P/09_Complex_Prompts_from_Scratch.ipynb`

##### 核心要素（按推荐顺序）

1. **角色定义** (Task Context)
   - AI 应该扮演什么角色
   - 例："你是 AdAstra Careers 公司的 AI 职业教练 Joe"

2. **语气设定** (Tone Context)
   - 回答应该用什么语气
   - 例："保持友好客服语气"

3. **任务描述和规则** (Detailed Task Description)
   - 具体要做什么任务
   - 必须遵守的规则
   - 不知道怎么回答时的"退路"

4. **示例** (Examples) - **最有效！**
   - 用 `<example></example>` XML 标签包裹
   - 展示期望的回答格式
   - 越多示例越好
   - 必须包含边缘情况的示例

5. **输入数据** (Input Data)
   - 用 XML 标签包裹：`<data>...</data>`
   - AI 需要处理的具体数据

6. **立即任务** (Immediate Task)
   - 明确告诉 AI 当前要做什么
   - 最好放在 prompt 末尾

7. **逐步思考** (Precognition)
   - 让 AI 先思考再回答
   - 例："在回答之前先思考"
   - 放在 prompt 末尾

8. **输出格式** (Output Formatting)
   - 指定输出格式
   - 用 XML 标签等明确格式要求

9. **预填充回答** (Prefill)
   - 在 assistant 角色中预先填充开头
   - 引导 AI 的回答方向

10. **user 角色**
    - Messages API 必须以 user 角色开始

##### 实际用例参考

1. **职业教练聊天机器人**
   - 角色：AI 职业顾问 Joe
   - 包含完整对话历史处理

2. **法律文档分析**
   - 处理长文档
   - 准确引用格式 `[3].`

3. **税务分析**
   - 解读复杂法规
   - 回答具体问题

4. **代码审查助手**
   - 发现代码问题
   - 教学式引导

##### 关键原则

- 不是所有 prompt 都需要全部 10 个要素
- 先用多个要素确保能工作，然后再精简
- **示例是最有效的工具**
- prompt 工程需要不断尝试和调整
- 顺序有时很重要（如立即任务、逐步思考放在末尾）

### 项目探索

- 仓库：https://github.com/anthropics/prompt-eng-interactive-tutorial.git
- 已克隆到本地
- JupyterLab 环境已配置完成
