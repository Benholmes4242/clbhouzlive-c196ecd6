/**
 * DiscoverSearchInput - Premium search input for discover games sheet
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
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)',
      }}
    >
      <Search 
        className="w-4 h-4 flex-shrink-0"
        style={{ color: 'rgba(100, 116, 139, 0.4)' }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search course, trip, or club..."
        className="flex-1 bg-transparent text-[14px] placeholder:text-slate-400/50 outline-none"
        style={{ color: '#1e293b' }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="p-1 -mr-1 rounded-full hover:bg-black/5 active:scale-95 transition-all duration-150"
        >
          <X className="w-3.5 h-3.5" style={{ color: 'rgba(100, 116, 139, 0.4)' }} />
        </button>
      )}
    </div>
  );
}
