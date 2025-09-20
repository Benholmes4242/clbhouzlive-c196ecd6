import React from 'react';
import { Search } from 'lucide-react';

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
  const [searchValue, setSearchValue] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      console.log('Search submitted:', searchValue);
      onClose?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
        <input
          type="text"
          placeholder="Search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          autoFocus={autoFocus}
          className="w-full rounded-full px-4 pl-12 h-11 md:h-12 
                     bg-white/10 border border-white/20 
                     text-white placeholder-white/60
                     focus:outline-none focus:ring-2 focus:ring-white/30
                     backdrop-blur-md"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => setSearchValue('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 
                       text-white/60 hover:text-white/80"
          >
            ×
          </button>
        )}
      </div>
    </form>
  );
};

export default SearchPill;