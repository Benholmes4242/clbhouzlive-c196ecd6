import { useState, useRef, useEffect } from 'react';
import { Search, X, GraduationCap } from 'lucide-react';
import { useCollegeMediaSearch } from '@/hooks/useCollegeMediaSearch';

interface Props {
  collegeName: string | null;
  collegeId: string | null;
  onSelect: (name: string | null, id: string | null) => void;
}

export function CollegeSelector({ collegeName, collegeId, onSelect }: Props) {
  const [query, setQuery] = useState(collegeName ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: colleges = [], isLoading: isSearching } = useCollegeMediaSearch(query);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2 block">
        College / University
      </label>
      <div ref={containerRef} className="relative">
        <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search your college or university"
          className="w-full bg-[#F8FAFC] border border-border/60 rounded-[10px] pl-9 pr-10 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); onSelect(null, null); }}
            className="absolute right-0 top-0 flex items-center justify-center h-full min-h-[44px] min-w-[44px] text-muted-foreground"
          >
            <X size={16} />
          </button>
        )}

        {isOpen && query.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-20 max-h-52 overflow-y-auto">
            {isSearching ? (
              <div className="px-4 py-3 text-[14px] text-muted-foreground">Searching…</div>
            ) : colleges.length === 0 ? (
              <div className="px-4 py-3 text-[14px] text-muted-foreground">No results</div>
            ) : (
              colleges.map((college: any) => (
                <button
                  key={college.normalized_name}
                  onClick={() => {
                    setQuery(college.college_name);
                    setIsOpen(false);
                    onSelect(college.normalized_name, college.id);
                  }}
                  className="w-full text-left px-4 py-3 text-[14px] text-foreground hover:bg-muted transition-colors min-h-[44px]"
                >
                  {college.college_name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
