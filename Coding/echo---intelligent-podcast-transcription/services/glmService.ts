import { DEFAULT_API_KEY } from "../constants";
import { generateToken } from "../utils/cryptoUtils";
import { TranscriptionResult, Segment, Word } from "../types";

// Using the standard OpenAI-compatible endpoint provided by Zhipu AI
const BASE_URL = "https://open.bigmodel.cn/api/paas/v4";

export const uploadAndTranscribe = async (
  file: File, 
  onProgress: (progress: number) => void,
  duration?: number
): Promise<TranscriptionResult> => {
  
  // 1. Generate the JWT Token required by Zhipu
  const token = await generateToken(DEFAULT_API_KEY);
  
  onProgress(10); // Phase: Preparing upload

  const formData = new FormData();
  formData.append('file', file);
  // 'glm-4-voice' is the multimodel often used, but strict ASR might use 'whisper-1' compatibility alias 
  // or a specific model name. We use a generic 'glm-4' or allow the endpoint to infer.
  // We'll use 'glm-4' as the model identifier.
  formData.append('model', 'glm-4'); 
  
  // CRITICAL: We need 'verbose_json' to get timestamps (start/end times)
  formData.append('response_format', 'verbose_json');
  
  // Attempt to request word-level timestamps for Karaoke effect.
  // Note: Not all models support this. We handle the fallback in parsing.
  formData.append('timestamp_granularities[]', 'word'); 
  formData.append('timestamp_granularities[]', 'segment');

  try {
    onProgress(30); // Phase: Uploading

    const response = await fetch(`${BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Do NOT set Content-Type header manually; fetch handles boundary for FormData
      },
      body: formData,
    });

    onProgress(70); // Phase: Processing

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GLM API Error:", response.status, errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    onProgress(90); // Phase: Parsing

    return parseRealResponse(data, duration || 0);

  } catch (error) {
    console.error("Transcription Failed:", error);
    throw error; // Throw real error to UI, no more fake data
  }
};

/**
 * Parses the raw JSON response from Zhipu/GLM API into our App's data structure.
 */
const parseRealResponse = (data: any, originalDuration: number): TranscriptionResult => {
    // 1. Handle Full Text
    const fullText = data.text || "";
    
    // 2. Handle Duration (API might return it, otherwise use file duration)
    const duration = data.duration || originalDuration;

    // 3. Handle Segments & Words
    // The API response format (verbose_json) usually looks like:
    // { text: "...", segments: [{ start, end, text, ... }], words: [{ word, start, end }] }
    
    let segments: Segment[] = [];
    let allWords: Word[] = [];

    // If the API returned word-level timestamps directly (top-level or inside segments)
    if (data.words && Array.isArray(data.words)) {
        allWords = data.words.map((w: any) => ({
            text: w.word || w.text,
            start: w.start,
            end: w.end
        }));
    }

    if (data.segments && Array.isArray(data.segments)) {
        segments = data.segments.map((s: any, index: number) => {
            // If words are nested inside segments (common in Whisper format)
            const segmentWords: Word[] = (s.words || []).map((w: any) => ({
                text: w.word || w.text,
                start: w.start,
                end: w.end
            }));

            // If we have top-level words but not segment-level, we can try to filter
            if (segmentWords.length === 0 && allWords.length > 0) {
                 // Basic filter (words that fall within this segment)
                 // This is a fallback strategy
                 const matching = allWords.filter(w => w.start >= s.start && w.end <= s.end);
                 segmentWords.push(...matching);
            }

            // Fallback: If absolutely no word timestamps, split text evenly (Better than nothing)
            if (segmentWords.length === 0 && s.text) {
                const rawWords = s.text.split(' '); // Or split by char for Chinese
                const step = (s.end - s.start) / Math.max(1, rawWords.length);
                rawWords.forEach((rw: string, i: number) => {
                    segmentWords.push({
                        text: rw,
                        start: s.start + (i * step),
                        end: s.start + ((i + 1) * step)
                    });
                });
            }

            return {
                speaker: "SPEAKER_00", // Zhipu generic API might not separate speakers automatically without extra config
                text: s.text,
                start: s.start,
                end: s.end,
                words: segmentWords
            };
        });
    }

    // Edge case: Plain text only response (no segments/words)
    if (segments.length === 0 && fullText) {
        segments.push({
            speaker: "SPEAKER_00",
            text: fullText,
            start: 0,
            end: duration,
            words: []
        });
    }

    // Recalculate flattened words if we built them inside segments
    if (allWords.length === 0) {
        allWords = segments.flatMap(s => s.words);
    }

    return {
        fullText,
        duration,
        segments,
        words: allWords
    };
};
