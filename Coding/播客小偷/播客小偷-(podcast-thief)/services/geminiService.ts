import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PodcastAnalysis } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The specific title of the podcast episode found via Google Search." },
    summary: { type: Type.STRING, description: "A detailed summary (approx 150-200 words) strictly based on the search results." },
    overview: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 key takeaways or topics discussed in the episode."
    },
    keywords: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "Keyword text" },
          weight: { type: Type.NUMBER, description: "Importance 0.1 to 1.0" }
        }
      },
      description: "Key concepts mentioned in the episode."
    },
    transcript: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          speaker: { type: Type.STRING, description: "Speaker name (e.g. Host, Guest Name)" },
          time: { type: Type.STRING, description: "Estimated timestamp MM:SS" },
          content: { type: Type.STRING, description: "Dialogue content. Must be in Chinese, keeping technical terms in original English if applicable." }
        }
      },
      description: "A comprehensive dialogue reconstruction based on the search content. Must be long (30+ turns) and detailed."
    }
  },
  required: ["title", "summary", "overview", "keywords", "transcript"]
};

export const analyzePodcastLink = async (urlOrTopic: string): Promise<PodcastAnalysis> => {
  // gemini-3-flash-preview is required for effective Tool use (Google Search)
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    你是一个专业的播客内容分析AI "博客小偷" (Podcast Thief)。
    用户提供了一个链接: "${urlOrTopic}"。

    **核心指令 (Critical Instructions)**：
    1. **必须调用 Google Search** 搜索该链接的具体内容。
       - **严禁编造 (No Hallucinations)**：绝对不要生成与该链接实际内容无关的通用播客对话。
       - **必须精准匹配**：如果链接指向 "Manus 首席科学家"、"AI Agent" 或 "被收购" 等特定话题，你的所有输出（标题、摘要、逐字稿）必须完全围绕这些具体事实展开。
       - 搜索线索：请重点关注链接对应的播客 Show Notes、评论或相关媒体报道来获取内容。

    2. **内容生成要求**：
       - **语言**：全文本必须使用**简体中文**。
       - **保留原文**：如果对话中涉及专有名词（如 Manus, AI Agent, LLM, Cost Logic），请保留英文或使用业界通用的中英夹杂表述，不要强行翻译。
       - **标题**：返回搜索到的准确单集标题。
       - **逐字稿 (Transcript)**：
         - 既然用户无法获取原始音频，你需要基于搜索到的详细文本资料（如采访回顾、深度文章），**重构**出一份高质量的对话记录。
         - **完整性**：请生成至少 **30-40 轮**对话，确保覆盖访谈的起因、经过、核心技术探讨（如纯血派 Agent、统一架构）、商业逻辑分析及未来展望。
         - 不要只写开头！内容必须深入且具体。

    请严格遵守以上规则，生成 JSON 格式的报告。
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as PodcastAnalysis;
    }
    
    throw new Error("Gemini returned empty response");

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};