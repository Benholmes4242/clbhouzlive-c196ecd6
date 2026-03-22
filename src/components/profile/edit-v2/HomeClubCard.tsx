import { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { useClubSearch } from '@/hooks/useClubSearch';
import { VisibilityDropdown } from './VisibilityDropdown';

interface Props {
  clubName: string;
  clubId: string | null;
  visibility: string;
  onClubSelect: (name: string, id: string | null) => void;
  onVisibilityChange: (v: string) => void;
}

export function HomeClubCard({
  clubName, clubId, visibility,
  onClubSelect, onVisibilityChange,
}: Props) {
  const [query, setQuery] = useState(clubName);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: clubs = [], loading: isSearching } = useClubSearch(query);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (name: string, id: string | null) => {
    setQuery(name);
    setIsOpen(false);
    onClubSelect(name, id);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    onClubSelect('', null);
  };

  return (
    <div className="space-y-3">
      <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground block">Home Club</label>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search for your home club"
            className="w-full bg-[#F8FAFC] border border-border/60 rounded-[10px] pl-9 pr-10 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-0 top-0 h-full flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {isOpen && query.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-20 max-h-52 overflow-y-auto">
            {isSearching ? (
              <div className="px-4 py-3 text-[14px] text-muted-foreground">Searching…</div>
            ) : clubs.length === 0 ? (
              <div className="px-4 py-3 text-[14px] text-muted-foreground">No clubs found</div>
            ) : (
              clubs.map((club: any) => (
                <button
                  key={club.id}
                  onClick={() => handleSelect(club.name, club.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors min-h-[44px]"
                >
                  <MapPin size={14} className="text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[14px] font-medium text-foreground">{club.name}</p>
                    {club.country && (
                      <p className="text-[12px] text-muted-foreground">{club.country}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground/70">Visibility</p>
        <VisibilityDropdown value={visibility as any} onChange={onVisibilityChange as any} />
      </div>
    </div>
  );
}
