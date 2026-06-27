import { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Check } from 'lucide-react';
import { useClubSearch } from '@/hooks/useClubSearch';
import { VisibilityDropdown } from './VisibilityDropdown';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface Props {
  clubName: string;
  clubId: string | null;
  visibility: string;
  onClubSelect: (name: string, id: string | null) => void;
  onVisibilityChange: (v: string) => void;
}

const INK = '#0F172A';
const GREEN = '#059669';

export function HomeClubCard({
  clubName, clubId, visibility,
  onClubSelect, onVisibilityChange,
}: Props) {
  const [query, setQuery] = useState(clubName);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: clubs = [], loading: isSearching } = useClubSearch(query);

  // Keep query in sync when the parent updates clubName (e.g. after hydration).
  useEffect(() => {
    setQuery(clubName);
  }, [clubName]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-select if search returns exactly one result.
  useEffect(() => {
    if (!isSearching && clubs.length === 1 && query.length >= 2 && isOpen && !clubId) {
      handleSelect(clubs[0].name, clubs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubs, isSearching, query, isOpen, clubId]);

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

  // CONFIRMED CHIP: a real club has been chosen from the dropdown.
  if (clubId) {
    return (
      <div className="space-y-3">
        <div style={{ marginBottom: 8 }}>
          <SectionHeader tier="standard" kicker="Home Club" />
        </div>
        <div
          className="w-full flex items-center justify-between bg-[#F8FAFC] border border-border/60 rounded-[11px] px-3.5 py-3 min-h-[48px]"
          style={{ borderColor: 'rgba(15,23,42,0.10)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <MapPin size={16} className="shrink-0" style={{ color: INK }} />
            <span className="truncate text-[15px] font-medium" style={{ color: INK }}>
              {clubName}
            </span>
            <Check size={14} strokeWidth={2.5} style={{ color: GREEN, flexShrink: 0 }} />
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-[12px] font-semibold uppercase tracking-[0.08em] px-2 min-h-[44px] flex items-center"
            style={{ color: '#64748B' }}
            aria-label="Change home club"
          >
            Change
          </button>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[12px] text-muted-foreground/70">Visibility</p>
          <VisibilityDropdown value={visibility as any} onChange={onVisibilityChange as any} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div style={{ marginBottom: 8 }}>
        <SectionHeader tier="standard" kicker="Home Club" />
      </div>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              // IMPORTANT: do NOT persist typed-but-unselected text here.
              // A real selection only happens via handleSelect (dropdown row).
              setTimeout(() => setIsOpen(false), 150);
            }}
            placeholder="Search for your home club"
            className="w-full bg-[#F8FAFC] border border-border/60 rounded-[11px] pl-9 pr-10 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors"
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
