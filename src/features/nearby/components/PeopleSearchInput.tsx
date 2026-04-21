import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PlayerGamesList } from './PlayerGamesList';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import '../GamesTab.css';

interface User {
  id: string;
  display_name: string;
  username: string;
  profile_photo_url: string | null;
  home_club: string | null;
  eg_handicap_index: number | null;
}

interface PeopleSearchInputProps {
  selectedUser: { id: string; display_name: string } | null;
  onSelect: (user: { id: string; display_name: string } | null) => void;
}

export function PeopleSearchInput({ selectedUser, onSelect }: PeopleSearchInputProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setOpen] = useState(false);
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sheetUser, setSheetUser] = useState<User | null>(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url, home_club, eg_handicap_index')
          .ilike('display_name', `%${query}%`)
          .limit(10);

        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (user: User) => {
    haptic('light');
    setSheetUser(user);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    haptic('light');
    onSelect(null);
  };

  return (
    <>
      {selectedUser ? (
        <div className="selectedClubRow">
          <span className="prefix">Viewing games by</span>
          <div className="clubPill">
            <span className="clubName">{selectedUser.display_name}</span>
            <TapButton className="x" aria-label="Clear" onClick={handleClear}>✕</TapButton>
          </div>
        </div>
      ) : (
        <>
          <label className="findLabel">Find a players games</label>
          <div className="searchBox">
            <Search size={18} style={{ color: 'white', flexShrink: 0 }} />
            <input
              placeholder="Search for a golfer..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
            />
          </div>
          {isOpen && query.length >= 2 && (
            <div className="resultsSheet">
              {isLoading ? (
                <div className="hint">Searching...</div>
              ) : results.length === 0 ? (
                <div className="hint">No golfers found</div>
              ) : (
                results.map(user => (
                  <TapButton key={user.id} className="resultRow" onClick={() => handleSelect(user)}>
                    <SquircleAvatar
                      src={user.profile_photo_url}
                      alt={user.display_name}
                      userId={user.id}
                      size={40}
                      hideRing
                    />
                    <div className="rMid">
                      <div className="rTitle">{user.display_name}</div>
                      <div className="rSub">@{user.username}</div>
                    </div>
                  </TapButton>
                ))
              )}
            </div>
          )}
          {isOpen && query.length > 0 && query.length < 2 && (
            <div className="resultsSheet">
              <div className="hint">Type at least 2 characters</div>
            </div>
          )}
        </>
      )}

      {/* Player Games Sheet */}
      {sheetUser && (
        <Sheet open={!!sheetUser} onOpenChange={() => setSheetUser(null)}>
          <SheetContent side="bottom" className="bg-neutral-900 border-t border-neutral-800 max-h-[80vh] overflow-hidden">
            <SheetHeader>
              <SheetTitle className="text-white">{sheetUser.display_name}'s Games</SheetTitle>
            </SheetHeader>
            <PlayerGamesList userId={sheetUser.id} />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
