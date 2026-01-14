interface TranscriptionResult {
  fullText: string;
  segments: Array<{
    text: string;
    start: number;
    end: number;
    speaker: string;
  }>;
  duration: number;
  wordCount: number;
}

const API_BASE_URL = 'http://localhost:8000'; // 后端服务地址

export async function uploadAndTranscribe(
  file: File,
  onProgress?: (progress: number) => void
): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Transcription failed');
    }

    // TODO: Implement real progress tracking via WebSocket or polling
    // For now, simulate progress
    if (onProgress) {
      onProgress(100);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

export function exportTranscript(result: TranscriptionResult, format: 'txt' | 'json' | 'srt') {
  let content: string;
  let filename: string;
  let mimeType: string;

  switch (format) {
    case 'txt':
      content = result.fullText;
      filename = `transcript-${Date.now()}.txt`;
      mimeType = 'text/plain';
      break;

    case 'json':
      content = JSON.stringify(result, null, 2);
      filename = `transcript-${Date.now()}.json`;
      mimeType = 'application/json';
      break;

    case 'srt':
      content = generateSRT(result);
      filename = `transcript-${Date.now()}.srt`;
      mimeType = 'text/plain';
      break;
  }

  // Create blob and download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generateSRT(result: TranscriptionResult): string {
  let srtContent = '';
  let wordIndex = 0;

  result.segments.forEach((segment, index) => {
    const startTime = formatSRTTime(segment.start);
    const endTime = formatSRTTime(segment.end);

    srtContent += `${index + 1}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    srtContent += `${segment.text}\n\n`;
  });

  return srtContent;
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
}
