import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchPillProps {
  className?: string;
  autoFocus?: boolean;
  onClose?: () => void;
}

const SearchPill = ({ className, autoFocus, onClose }: SearchPillProps) => {
  return (
    <div className={cn("flex items-center gap-3 px-4 h-11 md:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20", className)}>
      <Search className="w-5 h-5 text-white/70 shrink-0" />
      <input
        type="text"
        placeholder="Search"
        autoFocus={autoFocus}
        className="flex-1 bg-transparent text-white placeholder-white/50 border-0 outline-0 text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Escape' && onClose) {
            onClose();
          }
        }}
      />
    </div>
  );
};

export default SearchPill;