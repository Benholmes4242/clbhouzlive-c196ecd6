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
        backgroundColor: value ? 'var(--accent-green-bg)' : 'var(--pill-inactive-bg)',
        color: value ? 'var(--accent-green-text)' : 'var(--pill-inactive-text)',
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
