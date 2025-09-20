import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EngageButtonProps {
  icon: LucideIcon;
  count?: number | null;
  active?: boolean;
  onClick?: () => void;
}

const EngageButton: React.FC<EngageButtonProps> = ({ 
  icon: Icon, 
  count, 
  active = false, 
  onClick 
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Add ripple effect
    e.currentTarget.classList.remove('rippling');
    void e.currentTarget.offsetWidth; // Force reflow
    e.currentTarget.classList.add('rippling');
    onClick?.();
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        className={`relative grid place-items-center rounded-full size-12 md:size-14
                    bg-[hsl(var(--hud-bg))] border border-[hsl(var(--hud-border))]
                    backdrop-blur-md shadow-[var(--hud-shadow)]
                    transition-all duration-200 active:scale-95
                    ${active ? 'text-[hsl(var(--accent))]' : 'text-white/90'}
                    hover:scale-105`}
        onClick={handleClick}
      >
        <Icon className="w-6 h-6" />
        <span className="pointer-events-none absolute inset-0 rounded-full opacity-0" />
      </button>
      {count != null && count > 0 && (
        <span className="text-xs text-white/90 font-medium">
          {count > 999 ? `${Math.floor(count / 1000)}k` : count}
        </span>
      )}
    </div>
  );
};

export default EngageButton;