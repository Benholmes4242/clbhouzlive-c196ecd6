import { useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { useClubSearch } from '@/hooks/useClubSearch';
import { ClubEntry } from '@/components/profile/profile-wizard/types';
import { VisibilityDropdown } from './VisibilityDropdown';

interface Props {
  clubs: ClubEntry[];
  visibility: string;
  onAdd: (club: Omit<ClubEntry, 'id'>) => void;
  onRemove: (id: string) => void;
  onVisibilityChange: (v: string) => void;
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
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-medium text-muted-foreground">Additional Clubs</label>
        <VisibilityDropdown value={visibility as any} onChange={onVisibilityChange as any} />
      </div>

      {clubs.length > 0 && (
        <div className="space-y-2">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="flex items-center justify-between bg-muted rounded-xl px-4 py-3 min-h-[44px]"
            >
              <p className="text-[14px] font-medium text-foreground">{club.name}</p>
              <button
                onClick={() => onRemove(club.id)}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground -mr-2"
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
            className="w-full bg-muted border-0 rounded-xl pl-9 pr-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
          />
          {query.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
              {isSearching ? (
                <div className="px-4 py-3 text-[14px] text-muted-foreground">Searching…</div>
              ) : results.length === 0 ? (
                <div className="px-4 py-3 text-[14px] text-muted-foreground">No clubs found</div>
              ) : (
                results.map((club: any) => (
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
          className="flex items-center gap-2 text-primary text-[14px] font-medium min-h-[44px]"
        >
          <Plus size={16} />
          Add a club
        </button>
      )}
    </div>
  );
}
