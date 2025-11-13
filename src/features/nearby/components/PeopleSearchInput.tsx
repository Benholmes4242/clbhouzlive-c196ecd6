import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, X } from 'lucide-react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PlayerGamesList } from './PlayerGamesList';

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
  const inputRef = useRef<HTMLInputElement>(null);

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
        <div className="max-w-md mx-auto rounded-xl bg-white/5 backdrop-blur-md border border-white/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-white/50 mb-1">Viewing games by</div>
              <div className="text-sm font-medium text-white">{selectedUser.display_name}</div>
            </div>
            <button
              onClick={handleClear}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative max-w-md mx-auto">
          <button
            onClick={() => {
              setOpen(!isOpen);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className="w-full h-10 rounded-[14px] px-4 flex items-center gap-3 transition-colors text-[15px]"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--hub-text)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
          >
            <Search className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
            <span style={{ color: 'var(--hub-text-dim)' }}>Search for a golfer...</span>
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setOpen(false)}
              />
              <div className="absolute z-30 w-full mt-2 rounded-[14px] shadow-2xl overflow-hidden backdrop-blur-xl"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Type golfer name..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full h-9 pl-10 pr-3 rounded-lg text-sm outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: 'var(--hub-text)',
                      }}
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {query.length < 2 ? (
                    <div className="px-4 py-3 text-sm" style={{ color: 'var(--hub-text-muted)' }}>
                      Type at least 2 characters
                    </div>
                  ) : isLoading ? (
                    <div className="px-4 py-3 text-sm" style={{ color: 'var(--hub-text-muted)' }}>
                      Searching...
                    </div>
                  ) : results.length === 0 ? (
                    <div className="px-4 py-3 text-sm" style={{ color: 'var(--hub-text-muted)' }}>
                      No golfers found
                    </div>
                  ) : (
                    results.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleSelect(user)}
                        className="w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left"
                        style={{
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <img 
                          src={user.profile_photo_url || '/placeholder.svg'} 
                          alt={user.display_name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: 'var(--hub-text)' }}>
                            {user.display_name}
                          </div>
                          <div className="text-xs truncate" style={{ color: 'var(--hub-text-sub)' }}>
                            @{user.username}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
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
