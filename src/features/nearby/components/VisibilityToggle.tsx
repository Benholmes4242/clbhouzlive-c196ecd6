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
        backgroundColor: 'var(--accent-frost-bg)',
        border: '1px solid var(--accent-frost-border)',
        color: 'var(--accent-frost-text)',
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
