import React from 'react';
import { cn } from '@/lib/utils';

interface TopBarProps {
  isVisible: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ isVisible }) => {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] pt-[env(safe-area-inset-top,8px)] pb-3 px-4 transition-all duration-300',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      )}
      style={{
        background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="text-center text-white text-[20px] font-bold tracking-tight">
        Clbhouz
      </div>
    </header>
  );
};
