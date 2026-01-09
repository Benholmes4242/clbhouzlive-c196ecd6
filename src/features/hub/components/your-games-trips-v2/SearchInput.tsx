/**
 * SearchInput - Search field matching V2 design
 */

import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search games or trips…' }: SearchInputProps) {
  return (
    <div className="relative">
      <Search 
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
        style={{ color: 'rgba(30, 41, 59, 0.35)' }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 text-[14px] rounded-[12px] outline-none transition-all duration-150"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          color: '#1e293b',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.3)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
        }}
      />
    </div>
  );
}
