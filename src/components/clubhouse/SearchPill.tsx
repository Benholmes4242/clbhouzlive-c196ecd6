import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchPillProps {
  className?: string;
  autoFocus?: boolean;
  onClose?: () => void;
}

const SearchPill: React.FC<SearchPillProps> = ({ 
  className = "", 
  autoFocus = false,
  onClose 
}) => {
  const [value, setValue] = React.useState('');

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-4 w-5 h-5 text-white/60" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search golf courses, players..."
        autoFocus={autoFocus}
        className="w-full h-11 md:h-12 pl-12 pr-12 rounded-full 
                   bg-white/10 border border-white/20 
                   backdrop-blur-md text-white placeholder:text-white/60
                   focus:outline-none focus:ring-2 focus:ring-white/30
                   transition-all duration-200"
      />
      {(value || onClose) && (
        <button
          onClick={() => {
            setValue('');
            onClose?.();
          }}
          className="absolute right-4 w-5 h-5 text-white/60 hover:text-white/80 transition-colors"
        >
          <X className="w-full h-full" />
        </button>
      )}
    </div>
  );
};

export default SearchPill;