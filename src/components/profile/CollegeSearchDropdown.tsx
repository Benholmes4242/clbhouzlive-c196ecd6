import React, { useState, useRef, useEffect } from 'react';
import { useCollegeMediaSearch, CollegeMediaResult } from '@/hooks/useCollegeMediaSearch';
import { GraduationCap, Check, X, Loader2 } from 'lucide-react';

interface CollegeSearchDropdownProps {
  value: CollegeMediaResult | null;
  onChange: (college: CollegeMediaResult | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Searchable dropdown for selecting a college from college_media.
 * Used in signup/onboarding flows.
 */
export const CollegeSearchDropdown: React.FC<CollegeSearchDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Search for your college...',
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { data: results, isLoading } = useCollegeMediaSearch(searchTerm);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (college: CollegeMediaResult) => {
    onChange(college);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm('');
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const getInputBackground = () => {
    if (disabled) return 'rgba(255, 255, 255, 0.02)';
    if (isFocused) return 'rgba(255, 255, 255, 0.08)';
    return 'rgba(255, 255, 255, 0.05)';
  };

  // If a college is selected, show it with clear button
  if (value) {
    const displayName = value.short_name || value.college_name;
    return (
      <div 
        className="flex items-center justify-between h-[54px] px-4 rounded-2xl transition-all"
        style={{
          background: getInputBackground(),
          border: '1px solid #2F9E44',
        }}
      >
        <div className="flex items-center gap-2.5">
          {value.logo_url ? (
            <img 
              src={value.logo_url} 
              alt={`${displayName} logo`}
              className="w-6 h-6 rounded-full object-contain bg-background"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-white/50" />
            </div>
          )}
          <span className="text-white text-[15px]">{displayName}</span>
        </div>
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/50" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            if (searchTerm.length >= 2) setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-[54px] px-4 pr-10 rounded-2xl text-white text-[15px] focus:outline-none transition-all duration-200"
          style={{
            fontFamily: 'SF Pro Text, system-ui, sans-serif',
            background: getInputBackground(),
            border: '1px solid rgba(255, 255, 255, 0.07)',
            opacity: disabled ? 0.5 : 1,
          }}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
          ) : (
            <GraduationCap className="w-4 h-4 text-white/30" />
          )}
        </div>
      </div>

      {/* Dropdown results */}
      {isOpen && results && results.length > 0 && (
        <div 
          className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden shadow-xl max-h-[280px] overflow-y-auto"
          style={{
            background: 'rgba(30, 32, 35, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {results.map((college) => {
            const displayName = college.short_name || college.college_name;
            return (
              <button
                key={college.normalized_name}
                type="button"
                onClick={() => handleSelect(college)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
              >
                {college.logo_url ? (
                  <img 
                    src={college.logo_url} 
                    alt={`${displayName} logo`}
                    className="w-7 h-7 rounded-full object-contain bg-background flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-4 h-4 text-white/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[14px] truncate">{college.college_name}</p>
                  {college.short_name && college.short_name !== college.college_name && (
                    <p className="text-white/40 text-[12px]">{college.short_name}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {isOpen && searchTerm.length >= 2 && !isLoading && results?.length === 0 && (
        <div 
          className="absolute z-50 w-full mt-2 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(30, 32, 35, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <p className="text-white/40 text-[13px] text-center">No colleges found</p>
        </div>
      )}
    </div>
  );
};

export default CollegeSearchDropdown;
