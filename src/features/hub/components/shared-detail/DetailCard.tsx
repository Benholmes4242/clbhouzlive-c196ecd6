/**
 * DetailCard - Reusable glass card for game/trip detail sheets
 * Displays icon + content in a consistent style
 */

import React from 'react';

interface DetailCardProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  accent?: boolean;
  onClick?: () => void;
  rightElement?: React.ReactNode;
}

export function DetailCard({ 
  icon: Icon, 
  title, 
  subtitle,
  accent = false,
  onClick,
  rightElement,
}: DetailCardProps) {
  const Wrapper = onClick ? 'button' : 'div';
  
  return (
    <Wrapper
      onClick={onClick}
      className="w-full flex items-center gap-3.5 p-4 rounded-2xl transition-all text-left"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)',
        border: '1px solid rgba(0, 0, 0, 0.03)',
      }}
    >
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: accent ? 'rgba(59, 130, 246, 0.08)' : 'rgba(0, 0, 0, 0.03)',
        }}
      >
        <Icon 
          className="w-5 h-5" 
          style={{ color: accent ? 'rgb(59, 130, 246)' : 'rgba(30, 41, 59, 0.45)' }} 
        />
      </div>
      <div className="flex-1 min-w-0">
        <div 
          className="font-medium text-[14px] leading-snug"
          style={{ color: '#1e293b' }}
        >
          {title}
        </div>
        {subtitle && (
          <div 
            className="text-[12px] mt-0.5"
            style={{ color: 'rgba(30, 41, 59, 0.5)' }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {rightElement}
    </Wrapper>
  );
}
