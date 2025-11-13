import React, { useState, useEffect, useRef } from 'react';
import { Search, X, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import HcpBadge from '@/components/HcpBadge';

interface UserProfile {
  id: string;
  display_name: string;
  username?: string;
  profile_photo_url?: string;
  eg_handicap_index?: number | null;
  show_handicap?: boolean;
  guest_name?: string; // Added for guest participants
}

interface UserSearchTypeaheadProps {
  selectedUsers: UserProfile[];
  onUserAdd: (user: UserProfile) => void;
  onUserRemove: (userId: string) => void;
  maxUsers: number;
}

export function UserSearchTypeahead({
  selectedUsers,
  onUserAdd,
  onUserRemove,
  maxUsers,
}: UserSearchTypeaheadProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const searchUsers = async (term: string) => {
    try {
      setIsSearching(true);
      setShowDropdown(true);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, eg_handicap_index, show_handicap')
        .or(`display_name.ilike.%${term}%,username.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;

      // Filter out already selected users
      const filtered = (data || []).filter(
        (user) => !selectedUsers.some((selected) => selected.id === user.id)
      );

      setResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user: UserProfile) => {
    if (selectedUsers.length >= maxUsers) return;
    onUserAdd(user);
    setSearchTerm('');
    setResults([]);
    setShowDropdown(false);
  };

  const handleAddGuest = () => {
    if (selectedUsers.length >= maxUsers) return;
    const guestCount = selectedUsers.filter(u => u.guest_name).length + 1;
    const guestUser: UserProfile = {
      id: `guest-${Date.now()}`,
      display_name: `Guest ${guestCount}`,
      guest_name: `Guest ${guestCount}`,
    };
    onUserAdd(guestUser);
    setSearchTerm('');
    setResults([]);
    setShowDropdown(false);
  };

  const remainingSlots = maxUsers - selectedUsers.length;

  return (
    <div className="space-y-3">
      {/* Label removed - moved to parent component */}

      {/* Selected users chips */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm text-white"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-neutral-700/50 flex items-center justify-center shrink-0">
                  {user.guest_name ? (
                    <UserPlus className="w-3 h-3 text-white/60" />
                  ) : user.profile_photo_url ? (
                    <img src={user.profile_photo_url} alt={user.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-semibold text-xs">{user.display_name[0]}</span>
                  )}
                </div>
                <span>{user.display_name}</span>
                {!user.guest_name && (
                  <HcpBadge value={user.eg_handicap_index} show={user.show_handicap ?? true} />
                )}
              </div>
              <button
                onClick={() => onUserRemove(user.id)}
                className="hover:text-white/70 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      {remainingSlots > 0 && (
        <div className="relative">
          <div className="relative flex items-center gap-10px rounded-[14px] px-4 py-3 transition-colors"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Search className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name or add a guest"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value.trim()) {
                  setShowDropdown(true);
                }
              }}
              onFocus={() => {
                if (searchTerm.trim() || results.length > 0) setShowDropdown(true);
              }}
              className="flex-1 bg-transparent border-0 outline-none text-[15px] placeholder:opacity-60"
              style={{
                color: 'var(--hub-text)',
              }}
            />
          </div>

          {/* Dropdown results */}
          {showDropdown && searchTerm.trim() && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute z-20 w-full mt-2 rounded-[14px] shadow-2xl max-h-64 overflow-y-auto backdrop-blur-xl"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {/* Add Guest option - ALWAYS pinned at top, regardless of search state */}
                <button
                  onClick={handleAddGuest}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <UserPlus className="w-4 h-4 text-white/70" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white text-sm font-medium">
                      ➕ Add Guest
                    </div>
                    <div className="text-white/60 text-xs">Add an unnamed player</div>
                  </div>
                </button>
                
                {/* Loading indicator */}
                {isSearching && (
                  <div className="px-4 py-3 text-sm text-center"
                    style={{
                      color: 'var(--hub-text-dim)',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    Searching for users...
                  </div>
                )}
                
                {/* User results - only show when not searching */}
                {!isSearching && results.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-colors last:border-b-0"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-700/50 flex items-center justify-center shrink-0">
                      {user.profile_photo_url ? (
                        <img src={user.profile_photo_url} alt={user.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary font-semibold text-sm">{user.display_name[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 text-white text-sm font-medium">
                        <span>{user.display_name}</span>
                        <HcpBadge value={user.eg_handicap_index} show={user.show_handicap ?? true} className="text-white/60" />
                      </div>
                      {user.username && (
                        <div className="text-white/60 text-xs">@{user.username}</div>
                      )}
                    </div>
                    <UserPlus className="w-4 h-4 text-white/40" />
                  </button>
                ))}
                
                {/* No user results message - only show when search complete */}
                {!isSearching && results.length === 0 && (
                  <div className="px-4 py-3 text-sm text-center"
                    style={{ color: 'var(--hub-text-dim)' }}
                  >
                    No users found matching "{searchTerm}"
                  </div>
                )}
              </div>
            </>
          )}

          {/* No results */}
          {showDropdown && !isSearching && searchTerm && results.length === 0 && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute z-20 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl backdrop-blur-xl p-4">
                <p className="text-sm text-white/60 text-center">No users found</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
