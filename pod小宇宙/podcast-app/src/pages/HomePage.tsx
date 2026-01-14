import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAudioStore } from '../stores/audioStore';
import { uploadAndTranscribe } from '../utils/api';

/**
 * 「回声 Echo」V3.0 - 首页
 * "声音的圣殿" - Dark Poeticism Design
 */
export default function HomePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setCurrentAudio, setTranscribing, setProgress, setTranscription } = useAudioStore();
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (file: File) => {
    // 检查文件类型
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav'];
    const fileExtension = file.name.toLowerCase().split('.').pop();

    if (!allowedTypes.includes(file.type) && !['mp3', 'wav'].includes(fileExtension || '')) {
      alert('GLM-ASR API 仅支持 MP3 和 WAV 格式。\n\n请将 M4A 文件转换为 MP3 格式后再上传。');
      return;
    }

    // Set current audio
    setCurrentAudio({
      id: Date.now().toString(),
      name: file.name,
      url: file,
      duration: 0,
      file,
    });

    // Start transcription
    setTranscribing(true);
    setProgress(0);

    try {
      const result = await uploadAndTranscribe(file, (progress) => {
        setProgress(progress);
      });

      setTranscription(result);
      navigate('/transcription');
    } catch (error) {
      console.error('Transcription error:', error);
      alert('转录失败，请重试');
    } finally {
      setTranscribing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const isTranscribing = useAudioStore((state) => state.isTranscribing);
  const progress = useAudioStore((state) => state.progress);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full text-center">
        {/* Hero Section - 诗意标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          {/* 漂浮的麦克风图标 */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="inline-block mb-8 relative"
          >
            {/* 光晕背景 */}
            <div className="absolute inset-0 bg-plasma/20 blur-3xl rounded-full scale-150" />
            <Mic className="relative w-20 h-20 text-plasma" strokeWidth={1.5} />
          </motion.div>

          {/* 主标题 - 使用衬线体 */}
          <h1 className="text-[72px] font-poetic text-stardust mb-6">
            回声
          </h1>

          {/* 副标题 - 斜体诗意文案 */}
          <p className="text-[24px] font-poetic text-crystal italic mb-4">
            让声音有迹可循
          </p>

          <p className="text-whisper text-bone">
            上传播客音频，AI 自动生成高质量逐字稿
          </p>
        </motion.div>

        {/* 声音井 - 上传区域 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative max-w-[600px] mx-auto"
        >
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative overflow-hidden organic-shape
              transition-all duration-500 cursor-pointer group
              ${isDragging
                ? 'scale-105'
                : 'hover:scale-102'
              }
            `}
            style={{
              backdropFilter: 'blur(20px)',
              background: 'linear-gradient(135deg, rgba(10, 14, 26, 0.9), rgba(3, 1, 5, 0.9))',
              border: '2px solid',
              borderImage: 'linear-gradient(135deg, hsl(280, 80%, 60%), hsl(180, 80%, 60%), hsl(340, 80%, 60%)) 1',
              padding: '100px 60px',
              minHeight: '400px',
            }}
          >
            {/* 极光渐变边框动画 */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(90deg, hsl(280, 80%, 60%), hsl(180, 80%, 60%), hsl(340, 80%, 60%), hsl(25, 90%, 60%), hsl(280, 80%, 60%))',
                backgroundSize: '400% 400%',
                animation: 'aurora-flow 20s ease infinite',
              }}
            />

            {/* 内部微光 */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/3"
              style={{
                background: 'radial-gradient(ellipse at bottom, rgba(255, 107, 53, 0.1), transparent)',
                filter: 'blur(20px)',
              }}
            />

            <div className="relative z-10">
              {isTranscribing ? (
                // 转录状态 - 星座旋转
                <div className="space-y-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 mx-auto relative"
                  >
                    {/* 3层旋转光环 */}
                    <div className="absolute inset-0 rounded-full border-4 border-mist border-t-plasma animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-2 rounded-full border-4 border-mist border-b-electric animate-[spin_5s_linear_infinite_reverse]" />
                    <div className="absolute inset-4 rounded-full border-4 border-mist border-l-plasma animate-[spin_7s_linear_infinite]" />
                  </motion.div>

                  <h3 className="text-[24px] font-poetic text-stardust">
                    正在转录中...
                  </h3>

                  <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-between text-sm text-bone mb-3">
                      <span>进度</span>
                      <span className="mono">{progress.toFixed(0)}%</span>
                    </div>

                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                      <motion.div
                        className="h-full aurora-gradient"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  <p className="text-bone text-sm">
                    请稍候，这可能需要几分钟...
                  </p>
                </div>
              ) : (
                // 上传状态 - 声音井
                <div className="space-y-8">
                  {/* 漂浮的麦克风图标 */}
                  <motion.div
                    animate={isDragging ? { y: [0, -10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                    className="inline-block float-animation"
                  >
                    <Mic className="w-24 h-24 mx-auto text-bone group-hover:text-plasma transition-colors duration-300" strokeWidth={1.5} />
                  </motion.div>

                  <div>
                    <h3 className="text-[30px] font-poetic text-stardust mb-3">
                      {isDragging ? '释放文件' : '拖入你的播客'}
                    </h3>
                    <p className="text-crystal text-lg italic">
                      或点击选择文件（MP3、WAV）
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-8 text-sm text-bone">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-plasma" />
                      <span>最大 25MB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-electric" />
                      <span>支持长音频</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,.mp3,.wav"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />
          </div>
        </motion.div>

        {/* 特性卡片 - 极简诗意 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto"
        >
          {[
            {
              icon: '⚡',
              title: '极速转录',
              description: 'AI 驱动，分钟级完成',
            },
            {
              icon: '🎯',
              title: '精准识别',
              description: '准确率高达 93% 以上',
            },
            {
              icon: '👥',
              title: '说话人区分',
              description: '自动识别不同对话者',
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="organic-shape p-8 text-center transition-all duration-300"
              style={{
                backdropFilter: 'blur(20px)',
                background: 'rgba(18, 18, 26, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-poetic text-stardust mb-2">{feature.title}</h3>
              <p className="text-sm text-bone">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
