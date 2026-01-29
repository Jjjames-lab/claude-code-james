/**
 * API 服务层
 * 提供与后端 API 交互的所有方法
 * 符合 API 契约规范：_shared/01_api_spec.json
 */

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';
const PYTHON_API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8001/api/v1';
const DEFAULT_TIMEOUT = 30000; // 30 秒

/**
 * API 错误类
 */
export class ApiError extends Error {
  code: string;
  httpStatus: number;

  constructor(code: string, message: string, httpStatus: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

/**
 * API 响应类型
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 通用请求封装
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // 创建超时控制器
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    const result: ApiResponse<T> = await response.json();

    if (!result.success) {
      throw new ApiError(
        result.error?.code || 'UNKNOWN_ERROR',
        result.error?.message || '未知错误',
        response.status
      );
    }

    return result.data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('TIMEOUT_ERROR', '请求超时', 408);
    }

    throw new ApiError('NETWORK_ERROR', '网络连接失败', 0);
  }
}

// ==================== 数据类型定义 ====================

/**
 * 词级转录数据（符合 API 契约）
 */
export interface TranscriptWord {
  text: string;
  start: number; // 毫秒
  end: number; // 毫秒
  speaker: string;
}

/**
 * 转录结果
 */
export interface TranscriptResult {
  words: TranscriptWord[];
  utterances: Utterance[];  // 添加句子级分段
  total_duration: number;
  asr_engine: string;
  word_count: number;
}

// 句子级分段类型
export interface Utterance {
  text: string;
  start: number;
  end: number;
  words: TranscriptWord[];
  speaker: string;
}

/**
 * 解析小宇宙链接响应
 */
export interface EpisodeParseResponse {
  episode_id: string;
  podcast_id: string;  // 添加 podcast_id
  audio_url: string;
  duration: number;
  cover_image: string;
  show_notes: string;
  episode_title: string;
  podcast_name: string;
}

/**
 * 单集节目信息
 */
export interface EpisodeInfo {
  episode_id: string;
  episode_title: string;
  audio_url: string;
  duration: number;
  cover_image: string;
  show_notes: string;
  created_at: string;
}

/**
 * 解析播客主页响应
 */
export interface PodcastParseResponse {
  podcast_id: string;
  podcast_name: string;
  host_name: string;
  description: string;
  logo: string;
  episodes: EpisodeInfo[];
  total_episodes: number;
}

/**
 * 转录任务响应
 */
export interface TranscriptTaskResponse {
  task_id: string;
  status: 'processing' | 'completed' | 'failed';
  estimated_time?: number;
  engine?: string;
  progress?: number;
  current_engine?: string;
  result?: TranscriptResult;
}

/**
 * 健康检查响应
 */
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  services: {
    asr_doubao: string;
    asr_qwen: string;
    ai_glm: string;
  };
}

/**
 * AI 纠偏响应
 */
export interface CorrectionResponse {
  original_text: string;
  corrected_text: string;
  changes: Array<{
    from: string;
    to: string;
    type: string;
  }>;
}

// ==================== API 方法 ====================

/**
 * 解析小宇宙节目链接
 * POST /episode/parse
 * @param url 小宇宙节目链接
 * @param timeout 超时时间（毫秒），默认 30 秒
 */
export async function parseEpisode(
  url: string,
  timeout: number = 30000
): Promise<EpisodeParseResponse> {
  return request<EpisodeParseResponse>('/episode/parse', {
    method: 'POST',
    body: JSON.stringify({ url }),
  }, timeout);
}

/**
 * 解析小宇宙播客主页链接
 * POST /api/crawler/parse-podcast
 * @param url 小宇宙播客主页链接
 * @param limit 每页数量，默认 5
 * @param offset 偏移量，默认 0
 * @param timeout 超时时间（毫秒），默认 30 秒
 */
export async function parsePodcast(
  url: string,
  limit: number = 5,
  offset: number = 0,
  timeout: number = 30000
): Promise<PodcastParseResponse> {
  const response = await fetch(`${PYTHON_API_BASE_URL.replace('/api/v1', '')}/api/crawler/parse-podcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, limit, offset }),
  });

  const result: ApiResponse<PodcastParseResponse> = await response.json();

  if (!result.success) {
    throw new ApiError(
      'PARSE_ERROR',
      result.error || '解析失败',
      response.status
    );
  }

  return result.data as PodcastParseResponse;
}

/**
 * 启动 ASR 转录任务（直接从URL转录）
 * POST /asr/transcribe-url
 * @param audioUrl 音频文件地址
 * @param episodeId 节目 ID（不使用，仅保留接口兼容）
 * @param engine ASR 引擎选择（可选）
 * @param useStandard 是否使用豆包标准版（默认 false，使用极速版）
 * @param timeout 超时时间（毫秒），默认 300 秒（5 分钟）
 */
export async function startTranscription(
  audioUrl: string,
  _episodeId: string,
  _engine?: 'doubao' | 'qwen',
  useStandard: boolean = false,
  timeout: number = 300000
): Promise<TranscriptResult> {
  const formData = new FormData();
  formData.append('url', audioUrl);
  formData.append('strategy', 'fallback');
  formData.append('use_standard', useStandard.toString());  // 添加标准版标志

  const url = `${PYTHON_API_BASE_URL}/asr/transcribe-url`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const result: any = await response.json();
    console.log('[API] 转录API原始响应:', JSON.stringify(result, null, 2));

    if (!result.success) {
      console.error('[API] 转录失败:', result);
      throw new ApiError('TRANSCRIBE_ERROR', result.error || '转录失败', response.status);
    }

    console.log('[API] 转录成功，result.data:', JSON.stringify(result.data, null, 2));

    // 直接返回转录结果
    const finalResult = {
      words: result.data.words.map((w: any) => ({
        text: w.text,
        start: w.start,
        end: w.end,
        speaker: w.speaker || 'unknown',
      })),
      utterances: result.data.utterances || [],  // 添加句子级分段
      total_duration: result.data.duration,
      asr_engine: result.data.engine,
      word_count: result.data.word_count,
    };

    console.log('[API] 最终转换结果:', JSON.stringify(finalResult, null, 2));
    console.log('[API] utterances[0]:', JSON.stringify(finalResult.utterances[0], null, 2));

    return finalResult;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('TIMEOUT_ERROR', '转录超时', 408);
    }

    throw new ApiError('NETWORK_ERROR', '网络连接失败', 0);
  }
}

/**
 * 查询转录任务状态
 * GET /transcript/status?task_id=xxx
 * @param taskId 任务 ID
 */
export async function getTranscriptionStatus(
  taskId: string
): Promise<TranscriptTaskResponse> {
  return request<TranscriptTaskResponse>(
    `/transcript/status?task_id=${encodeURIComponent(taskId)}`
  );
}

/**
 * AI 纠偏
 * POST /transcript/correct
 * @param textSegment 需要纠偏的文本段落
 * @param contextBefore 前文上下文（可选）
 * @param contextAfter 后文上下文（可选）
 */
export async function correctText(
  textSegment: string,
  contextBefore?: string,
  contextAfter?: string
): Promise<CorrectionResponse> {
  return request<CorrectionResponse>('/transcript/correct', {
    method: 'POST',
    body: JSON.stringify({
      text_segment: textSegment,
      context_before: contextBefore,
      context_after: contextAfter,
    }),
  });
}

/**
 * 健康检查
 * GET /health
 */
export async function healthCheck(): Promise<HealthCheckResponse> {
  return request<HealthCheckResponse>('/health', {}, 5000);
}

/**
 * LLM逐字稿处理
 * POST /api/v1/llm/polish
 */
export async function polishTranscript(
  rawText: string,
  topic?: string,
  keywords?: string[]
): Promise<{ polished_text: string; model: string }> {
  const response = await fetch(`${PYTHON_API_BASE_URL}/llm/polish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      raw_text: rawText,
      topic: topic,
      keywords: keywords,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError('LLM_ERROR', error.detail || 'LLM处理失败', response.status);
  }

  return response.json();
}

/**
 * 章节数据类型
 */
export interface Chapter {
  title: string;
  points: string[];
  segment_index: number;
}

export interface ChapterData {
  chapters: Chapter[];
}

/**
 * LLM生成章节
 * POST /api/v1/llm/generate-chapters
 */
export async function generateChapters(
  transcript: string,
  topic?: string,
  keywords?: string[]
): Promise<ChapterData> {
  const response = await fetch(`${PYTHON_API_BASE_URL}/llm/generate-chapters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript: transcript,
      topic: topic,
      keywords: keywords,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError('LLM_ERROR', error.detail || '生成章节失败', response.status);
  }

  const result = await response.json();

  // 返回标准格式：{ success: true, data: { chapters: [...] } }
  if (result.success && result.data) {
    return result.data;
  }

  throw new ApiError('LLM_ERROR', '生成章节返回格式错误', response.status);
}

// ==================== 导出 ====================

const api = {
  parseEpisode,
  parsePodcast,
  startTranscription,
  getTranscriptionStatus,
  correctText,
  healthCheck,
  polishTranscript,
  generateChapters,
};

export default api;
