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
        background: 'rgba(10, 10, 10, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="flex items-center justify-center">
        {/* Logo - centered with slightly larger presence */}
        <span className="text-white text-[20px] font-bold tracking-tight">
          Clbhouz
        </span>
      </div>
    </header>
  );
};
