export const PodcastSkeletonEnhanced = () => {
  return (
    <div className="relative w-full max-w-4xl mx-auto px-6 py-20">
      {/* 中央动画区域 */}
      <div className="flex flex-col items-center justify-center mb-16">
        {/* 声波动画 */}
        <div className="relative w-64 h-64 mb-8">
          {/* 外圈 */}
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-pulse" />

          {/* 中圈 */}
          <div
            className="absolute inset-4 rounded-full border border-purple-500/40"
            style={{
              animation: 'spin 8s linear infinite',
            }}
          />

          {/* 内圈 */}
          <div
            className="absolute inset-8 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-xl flex items-center justify-center"
            style={{
              animation: 'breathe 3s ease-in-out infinite',
            }}
          >
            {/* 图标 */}
            <svg
              className="w-16 h-16 text-violet-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{
                animation: 'pulse-glow 2s ease-in-out infinite',
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>

          {/* 声波点 */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const distance = 100 + Math.sin(Date.now() / 500 + i) * 10;
            const x = Math.cos(angle) * distance + 128;
            const y = Math.sin(angle) * distance + 128;

            return (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-violet-400/60"
                style={{
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)',
                  animation: `pulse-dot 2s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            );
          })}
        </div>

        {/* 文本提示 */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-semibold text-white">
            正在转录音频...
          </h2>
          <p className="text-white/60 text-lg">
            AI 正在将声音转化为文字，请稍候片刻
          </p>
        </div>

        {/* 进度条 */}
        <div className="w-full max-w-md mt-8">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300"
              style={{
                width: '60%',
                animation: 'progress 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>

      {/* 骨架屏内容 */}
      <div className="space-y-4 opacity-50">
        {/* 模拟内容卡片 */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
            style={{
              animation: `fade-in-up 0.6s ease-out ${i * 0.1}s both`,
            }}
          >
            <div className="flex items-start gap-4">
              {/* 头像 */}
              <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />

              {/* 内容 */}
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-white/10 rounded w-1/3 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 bg-white/5 rounded w-full animate-pulse" />
                  <div className="h-3 bg-white/5 rounded w-5/6 animate-pulse" />
                  <div className="h-3 bg-white/5 rounded w-4/6 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.6;
            filter: drop-shadow(0 0 0px rgba(139, 92, 246, 0));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.5));
          }
        }

        @keyframes pulse-dot {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 1;
          }
        }

        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 0.5;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
