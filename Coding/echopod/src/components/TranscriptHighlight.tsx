import { useMemo } from 'react';

interface Segment {
  text: string;
  start: number;
  end: number;
  speaker: string;
}

interface TranscriptHighlightProps {
  segments: Segment[];
  currentTime: number;
  onWordClick?: (wordIndex: number) => void;
}

export default function TranscriptHighlight({
  segments,
  currentTime,
  onWordClick,
}: TranscriptHighlightProps) {
  // Split text into words and calculate timestamps
  const words = useMemo(() => {
    const result: Array<{
      word: string;
      start: number;
      end: number;
      speaker: string;
      isActive: boolean;
    }> = [];

    segments.forEach((segment) => {
      const segmentWords = segment.text.split(/\s+/);
      const segmentDuration = segment.end - segment.start;
      const wordDuration = segmentDuration / segmentWords.length;

      segmentWords.forEach((word, index) => {
        const wordStart = segment.start + index * wordDuration;
        const wordEnd = wordStart + wordDuration;

        result.push({
          word,
          start: wordStart,
          end: wordEnd,
          speaker: segment.speaker,
          isActive: currentTime >= wordStart && currentTime < wordEnd,
        });
      });
    });

    return result;
  }, [segments, currentTime]);

  const handleWordClick = (index: number) => {
    const audio = document.querySelector('audio') as HTMLAudioElement;
    if (!audio) return;

    const word = words[index];
    audio.currentTime = word.start;
  };

  return (
    <div className="space-y-4">
      {segments.map((segment, segmentIndex) => {
        const speakerClass = segment.speaker === 'SPEAKER_00' ? 'speaker-a' : 'speaker-b';
        const speakerLabel = segment.speaker === 'SPEAKER_00' ? '嘉宾A' : '嘉宾B';

        return (
          <div key={segmentIndex} className="group">
            <div className={`text-sm font-medium mb-2 ${speakerClass}`}>
              {speakerLabel}
            </div>
            <p className="text-lg leading-relaxed text-gray-200">
              {segment.text.split(/\s+/).map((word, wordIndex) => {
                // Find the global word index
                const globalWordIndex = words.findIndex(
                  (w) => w.word === word && w.start >= segment.start && w.end <= segment.end
                );

                const isHighlighted = words[globalWordIndex]?.isActive || false;

                return (
                  <span
                    key={wordIndex}
                    onClick={() => onWordClick?.(globalWordIndex)}
                    className={`inline-block px-1 py-0.5 rounded cursor-pointer transition-all duration-200 ${
                      isHighlighted
                        ? 'word-highlight bg-primary-500/20 text-primary-400'
                        : 'hover:bg-dark-surface/50'
                    }`}
                  >
                    {word}{' '}
                  </span>
                );
              })}
            </p>
          </div>
        );
      })}
    </div>
  );
}
