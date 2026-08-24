import { useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { useClubSearch } from '@/hooks/useClubSearch';
import { ClubEntry } from '@/components/profile/profile-wizard/types';
import { VisibilityRow, type VisibilityValue } from './VisibilityDropdown';
import { FieldLabel } from '@/components/manage/fieldTreatment';

interface Props {
  clubs: ClubEntry[];
  visibility: string;
  onAdd: (club: Omit<ClubEntry, 'id'>) => void;
  onRemove: (id: string) => void;
  onVisibilityChange: (v: VisibilityValue) => void;
}

export function AdditionalClubsList({
  clubs, visibility, onAdd, onRemove, onVisibilityChange,
}: Props) {
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { data: results = [], loading: isSearching } = useClubSearch(query);

  const handleSelect = (name: string, clubId: string | null) => {
    const already = clubs.some(c => c.clubId === clubId || c.name === name);
    if (!already) {
      onAdd({ name, clubId: clubId ?? undefined });
    }
    setQuery('');
    setShowSearch(false);
  };

  return (
    <div className="space-y-3">
      {/* The kicker gets its own line; visibility gets its own row beneath. */}
      <div>
        <FieldLabel>Additional clubs</FieldLabel>
        <VisibilityRow value={visibility as VisibilityValue} onChange={onVisibilityChange} />
      </div>




      {clubs.length > 0 && (
        <div className="space-y-2">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="flex items-center justify-between bg-[rgba(255,255,255,0.06)] border border-border/60 rounded-[11px] px-3.5 py-3"
            >
              <p className="text-[15px] text-foreground">{club.name}</p>
              <button
                onClick={() => onRemove(club.id)}
                aria-label={`Remove ${club.name}`}
                style={{
                  width: 24,
                  height: 24,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  padding: 4,
                  margin: '-6px -4px -6px 0',
                  color: '#94A3B8',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}


      {showSearch ? (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a club"
            className="w-full bg-[rgba(255,255,255,0.06)] border border-border/60 rounded-[11px] pl-9 pr-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(255,255,255,0.22)] focus:bg-background transition-colors"
          />
          {query.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
              {isSearching ? (
                <div className="px-4 py-3 text-[14px] text-muted-foreground">Searching…</div>
              ) : results.length === 0 ? (
                <div className="px-4 py-3 text-[14px] text-muted-foreground">No clubs found</div>
              ) : (
                results.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => handleSelect(club.name, club.id)}
                    className="w-full text-left px-4 py-3 text-[14px] text-foreground hover:bg-muted transition-colors min-h-[44px]"
                  >
                    {club.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-2.5 text-[14px] font-semibold min-h-[44px]"
          style={{ color: '#0F172A' }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <Plus size={14} style={{ color: '#475569' }} />
          </div>
          Add a club
        </button>
      )}
    </div>
  );
}