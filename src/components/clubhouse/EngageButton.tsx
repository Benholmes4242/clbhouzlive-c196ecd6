import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EngageButtonProps {
  icon: LucideIcon;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

const EngageButton = ({ 
  icon: Icon, 
  count, 
  active, 
  onClick,
  className 
}: EngageButtonProps) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Add ripple effect
    const button = e.currentTarget;
    button.classList.remove('rippling');
    void button.offsetWidth; // Force reflow
    button.classList.add('rippling');
    
    onClick?.();
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        className={cn(
          "relative grid place-items-center rounded-full size-12 md:size-14",
          "bg-[hsl(var(--hud-bg))] border border-[hsl(var(--hud-border))]",
          "backdrop-blur-md shadow-[var(--hud-shadow)]",
          "transition-transform active:scale-95 text-white",
          active && "text-[hsl(var(--accent))]",
          className
        )}
        onClick={handleClick}
      >
        <Icon className="w-6 h-6" />
      </button>
      {count != null && (
        <span className="text-xs text-white/90 font-medium">
          {count > 999 ? `${Math.floor(count / 1000)}k` : count}
        </span>
      )}
    </div>
  );
};

export default EngageButton;