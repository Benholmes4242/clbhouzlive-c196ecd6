import { useState, useEffect, useRef } from 'react';
import { Search, GraduationCap, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export interface SelectedCollege {
  id: string;
  college_name: string;
  normalized_name: string;
  logo_url?: string | null;
  country?: string | null;
}

interface CollegeSearchDropdownProps {
  value: SelectedCollege | null;
  onChange: (college: SelectedCollege | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CollegeSearchDropdown({
  value,
  onChange,
  placeholder = "Search for your college...",
  disabled = false,
  className,
}: CollegeSearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SelectedCollege[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search colleges
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchColleges = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('college_media')
          .select('id, college_name, normalized_name, logo_url, country')
          .ilike('college_name', `%${query}%`)
          .limit(10);

        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error('College search error:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchColleges, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (disabled) {
    return (
      <div className={cn(
        "flex items-center gap-2 h-12 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm text-[#94a3b8]",
        className
      )}>
        <GraduationCap className="w-4 h-4" />
        <span>Select a category first</span>
      </div>
    );
  }

  if (value) {
    return (
      <div className={cn(
        "flex items-center gap-3 h-12 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl",
        className
      )}>
        <div className="w-8 h-8 rounded-lg bg-white border border-[#e2e8f0] flex items-center justify-center overflow-hidden flex-shrink-0">
          {value.logo_url ? (
            <img src={value.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <GraduationCap className="w-4 h-4 text-[#64748b]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1e293b] truncate">
            {value.college_name}
          </p>
          {value.country && (
            <p className="text-xs text-[#64748b] truncate">{value.country}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-1 text-[#94a3b8] hover:text-[#64748b] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-12 pl-11 pr-10 bg-white border border-[#e2e8f0] rounded-xl text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#e2e8f0] focus:border-[#e2e8f0]"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] animate-spin" />
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-lg max-h-64 overflow-auto">
          {results.map((college) => (
            <button
              key={college.id}
              type="button"
              onClick={() => {
                onChange(college);
                setQuery('');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center overflow-hidden flex-shrink-0">
                {college.logo_url ? (
                  <img src={college.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <GraduationCap className="w-5 h-5 text-[#64748b]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1e293b] truncate">
                  {college.college_name}
                </p>
                {college.country && (
                  <p className="text-xs text-[#64748b] truncate">{college.country}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && query.length >= 2 && !isLoading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-lg p-4 text-center">
          <p className="text-sm text-[#64748b]">No colleges found</p>
          <p className="text-xs text-[#94a3b8] mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
