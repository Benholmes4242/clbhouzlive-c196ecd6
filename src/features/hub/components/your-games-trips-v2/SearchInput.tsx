/**
 * SearchInput - Premium search field with inner shadow
 * V2 design: rounded, soft border, subtle focus state
 * V3: Added clear button when text is present
 */

import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search games or trips…' }: SearchInputProps) {
  return (
    <div className="relative">
      <Search 
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
        style={{ color: 'rgba(100, 116, 139, 0.5)' }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 text-[14px] rounded-[14px] outline-none transition-all duration-200"
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
          color: '#1e293b',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.2)';
          e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.04), 0 0 0 3px rgba(100, 116, 139, 0.06)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
          e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.04)';
        }}
      />
      
      {/* Clear button - only show when text is present */}
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors hover:bg-black/5 active:scale-95"
          type="button"
          aria-label="Clear search"
        >
          <X 
            className="w-4 h-4"
            style={{ color: 'rgba(100, 116, 139, 0.5)' }}
          />
        </button>
      )}
    </div>
  );
}
