import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface ThumbButtonProps {
  type: 'up' | 'down';
  active: boolean;
  count: number;
  onClick: () => void;
  disabled?: boolean;
}

export const ThumbButton: React.FC<ThumbButtonProps> = ({
  type,
  active,
  count,
  onClick,
  disabled,
}) => {
  const Icon = type === 'up' ? ThumbsUp : ThumbsDown;
  
  const base =
    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-100';
  
  const inactive = 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50';
  
  const activeClass =
    type === 'up'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-rose-200 bg-rose-50 text-rose-700';

  const disabledClass = 'opacity-50 cursor-not-allowed pointer-events-none';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${active ? activeClass : inactive} ${disabled ? disabledClass : 'active:scale-95'}`}
    >
      <Icon className="w-4 h-4" />
      <span>{type === 'up' ? 'Helpful' : 'Unhelpful'}</span>
      <span>({count})</span>
    </button>
  );
};
