/**
 * DiscoverSearchInput - Search input for discover games sheet
 */

import React from 'react';
import { Search, X } from 'lucide-react';

interface DiscoverSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function DiscoverSearchInput({ value, onChange }: DiscoverSearchInputProps) {
  return (
    <div 
      className="relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all duration-150"
      style={{
        background: 'rgba(255, 255, 255, 0.6)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
      <Search 
        className="w-4 h-4 flex-shrink-0"
        style={{ color: 'rgba(100, 116, 139, 0.5)' }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search course or host..."
        className="flex-1 bg-transparent text-[14px] placeholder:text-slate-400/60 outline-none"
        style={{ color: '#1e293b' }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="p-1 -mr-1 rounded-full hover:bg-black/5 transition-colors"
        >
          <X className="w-3.5 h-3.5" style={{ color: 'rgba(100, 116, 139, 0.5)' }} />
        </button>
      )}
    </div>
  );
}
