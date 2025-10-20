import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface VisibilityToggleProps {
  value: boolean;
  onChange: (visible: boolean) => void;
}

export function VisibilityToggle({ value, onChange }: VisibilityToggleProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full transition-colors"
      style={{
        background: value ? '#6e9277' : '#eceff1',
        color: value ? '#fff' : '#2b2f2e',
      }}
      aria-label={value ? 'Visible online' : 'Hidden'}
    >
      {value ? <Eye size={14} /> : <EyeOff size={14} />}
      <span className="text-xs font-medium">
        {value ? 'Visible online' : 'Hidden'}
      </span>
    </button>
  );
}
