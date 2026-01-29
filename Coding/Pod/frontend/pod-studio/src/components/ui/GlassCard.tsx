import type { ReactNode, CSSProperties } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  active?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'subtle' | 'accent';
  style?: CSSProperties;
}

export const GlassCard = ({
  children,
  className = '',
  interactive = false,
  active = false,
  onClick,
  variant = 'default',
  style,
}: GlassCardProps) => {
  const baseClasses = `
    relative overflow-hidden
    backdrop-blur-xl
    border
    rounded-2xl
    transition-all duration-300
    ease-out
  `;

  const variantClasses = {
    default: `
      bg-white/5
      border-white/10
      hover:bg-white/8
      hover:border-white/15
      hover:shadow-xl
      hover:shadow-purple-500/5
    `,
    subtle: `
      bg-white/[0.02]
      border-white/[0.05]
      hover:bg-white/[0.04]
      hover:border-white/[0.08]
    `,
    accent: `
      bg-gradient-to-br from-violet-500/10 to-purple-500/10
      border-violet-500/20
      hover:from-violet-500/15
      hover:to-purple-500/15
      hover:border-violet-500/30
    `,
  };

  const activeClasses = active
    ? `
      bg-violet-500/10
      border-violet-500/30
      shadow-lg
      shadow-violet-500/10
      scale-[1.01]
    `
    : '';

  const interactiveClasses = interactive
    ? `
      cursor-pointer
      hover:scale-[1.01]
      active:scale-[0.99]
    `
    : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${activeClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
      style={style}
    >
      {/* 内光效 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      {/* 边框高光 */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

      {/* 内容 */}
      <div className="relative">{children}</div>

      {/* 激活状态光晕 */}
      {active && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 rounded-2xl blur-md -z-10" />
      )}
    </div>
  );
};
