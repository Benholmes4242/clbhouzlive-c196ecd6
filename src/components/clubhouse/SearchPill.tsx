import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchPillProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClose?: () => void;
  autoFocus?: boolean;
}

const SearchPill = forwardRef<HTMLInputElement, SearchPillProps>(
  ({ className, onClose, autoFocus, ...props }, ref) => {
    return (
      <div className={cn(
        "relative flex items-center",
        "rounded-full px-4 h-11 md:h-12",
        "bg-white/10 backdrop-blur-md border border-white/20",
        "transition-all duration-200",
        className
      )}>
        <Search className="h-4 w-4 text-white/70 mr-3 shrink-0" />
        <input
          ref={ref}
          type="text"
          placeholder="Search..."
          autoFocus={autoFocus}
          className={cn(
            "flex-1 bg-transparent text-white placeholder:text-white/50",
            "border-0 outline-none focus:outline-none",
            "text-sm md:text-base"
          )}
          {...props}
        />
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 p-1 text-white/70 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchPill.displayName = "SearchPill";

export default SearchPill;