/**
 * Game Search Bar
 * Apple-style search bar with focus animations
 */

import { Search } from 'lucide-react';
import { useState } from 'react';

type GameSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function GameSearchBar({ value, onChange, placeholder = 'Search golf club...' }: GameSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div 
      className={`
        relative w-full rounded-2xl border backdrop-blur-xl transition-all duration-300
        ${isFocused 
          ? 'border-white/16 bg-white/8 scale-y-[1.02]' 
          : 'border-white/8 bg-white/5'
        }
      `}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Search size={20} className="text-white/60 shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/40 outline-none"
        />
      </div>
    </div>
  );
}
