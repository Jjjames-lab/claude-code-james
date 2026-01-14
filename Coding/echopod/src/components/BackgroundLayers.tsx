import { useEffect, useRef, useState } from 'react';

/**
 * 7层背景系统组件
 * Layer 7: 深空底色
 * Layer 6: 远景星云
 * Layer 5: 中景星尘
 * Layer 4: 近景极光
 * Layer 3: 音波涟漪
 * Layer 2: 声音粒子
 * Layer 1: 记忆尘埃
 */
export default function BackgroundLayers() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; size: number; opacity: number; twinkle: number }>>([]);
  const [ripples, setRipples] = useState<Array<{ id: number }>>([]);

  // 初始化星尘 (Layer 5)
  useEffect(() => {
    const newStars = Array.from({ length: 200 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.3,
      twinkle: Math.random() * 3 + 2, // 闪烁周期
    }));
    setStars(newStars);
  }, []);

  // 生成音波涟漪 (Layer 3)
  useEffect(() => {
    const interval = setInterval(() => {
      setRipples(prev => {
        const newRipple = { id: Date.now() };
        return [...prev.slice(-4), newRipple]; // 最多保留5个涟漪
      });
    }, 8000); // 每8秒一个新涟漪

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="background-layers">
      {/* Layer 7: 深空底色 (最底层) */}
      <div className="bg-layer-void" />

      {/* Layer 6: 远景星云 */}
      <div className="bg-layer-nebula" />

      {/* Layer 5: 中景星尘 */}
      <div className="bg-layer-stardust">
        {stars.map(star => (
          <div
            key={star.id}
            className="absolute rounded-full star-twinkle"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDuration: `${star.twinkle}s`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Layer 4: 近景极光 */}
      <div className="bg-layer-aurora" />

      {/* Layer 3: 音波涟漪 */}
      <div className="bg-layer-ripple">
        {ripples.map(ripple => (
          <div
            key={ripple.id}
            className="ripple-wave"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>

      {/* Layer 2: 声音粒子 (Canvas) */}
      <div className="bg-layer-particles">
        <SoundParticleCanvas />
      </div>

      {/* Layer 1: 记忆尘埃 */}
      <div className="bg-layer-dust">
        <MemoryDust />
      </div>
    </div>
  );
}

/**
 * 声音粒子系统 (Layer 2)
 * 从播放器升起的粒子
 */
function SoundParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    hue: number;
    life: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置canvas尺寸
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 粒子系统循环
    let animationId: number;
    let lastEmission = 0;

    const animate = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 发射新粒子 (每200ms发射一个)
      if (timestamp - lastEmission > 200) {
        particlesRef.current.push({
          x: canvas.width / 2,
          y: canvas.height * 0.6, // 从屏幕下方60%处升起
          vx: (Math.random() - 0.5) * 0.5,
          vy: -1 - Math.random() * 1.5,
          size: 2 + Math.random() * 4,
          opacity: 0.8,
          hue: (timestamp / 50) % 360, // 颜色随时间变化
          life: 1.0,
        });
        lastEmission = timestamp;
      }

      // 更新和绘制粒子
      particlesRef.current.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.005; // 粒子寿命
        p.opacity = p.life * 0.8;
        p.size *= 0.995; // 逐渐变小

        // 移除死亡粒子
        if (p.life <= 0) {
          particlesRef.current.splice(index, 1);
          return;
        }

        // 绘制粒子
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.opacity})`;
        ctx.fill();

        // 发光效果
        ctx.shadowColor = `hsla(${p.hue}, 80%, 60%, 0.5)`;
        ctx.shadowBlur = 10;
      });

      animationId = requestAnimationFrame(animate);
    };

    animate(0);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}

/**
 * 记忆尘埃系统 (Layer 1)
 * 记录用户的交互痕迹
 */
function MemoryDust() {
  const [dusts, setDusts] = useState<Array<{
    id: number;
    x: number;
    y: number;
    type: 'click' | 'select' | 'bookmark';
    time: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    // 点击事件
    const handleClick = (e: MouseEvent) => {
      const newDust = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
        type: 'click' as const,
        time: Date.now(),
        opacity: 1,
      };
      setDusts(prev => [...prev.slice(-49), newDust]); // 最多保留50个

      // 5分钟后移除临时尘埃
      setTimeout(() => {
        setDusts(prev => prev.filter(d => d.id !== newDust.id));
      }, 300000);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      {dusts.map(dust => (
        <div
          key={dust.id}
          className="fixed rounded-full pointer-events-none"
          style={{
            left: dust.x,
            top: dust.y,
            width: dust.type === 'bookmark' ? 4 : 2,
            height: dust.type === 'bookmark' ? 4 : 2,
            backgroundColor: dust.type === 'bookmark' ? '#FFD700' : '#FFFFFF',
            opacity: dust.opacity,
            boxShadow: dust.type === 'bookmark' ? '0 0 10px #FFD700' : 'none',
            animation: dust.type === 'bookmark' ? 'twinkle 2s ease-in-out infinite' : 'none',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </>
  );
}
