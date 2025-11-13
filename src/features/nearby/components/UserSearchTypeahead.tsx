import React, { useState, useEffect, useRef } from 'react';
import { Search, X, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import HcpBadge from '@/components/HcpBadge';
import '../GamesTab.css'; // Import for resultsSheet and resultRow styles

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
          <div className="searchBox">
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
              className="flex-1 bg-transparent border-0 outline-none text-[15px]"
              style={{ color: 'var(--hub-text)' }}
            />
          </div>

          {/* Dropdown results */}
          {showDropdown && searchTerm.trim() && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="resultsSheet">
                {/* Add Guest option - ALWAYS pinned at top */}
                <button
                  onClick={handleAddGuest}
                  className="resultRow"
                  style={{ marginBottom: '8px' }}
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <UserPlus className="w-4 h-4 text-white/70" />
                  </div>
                  <div className="rMid">
                    <div className="rTitle">➕ Add Guest</div>
                    <div className="rSub">Add an unnamed player</div>
                  </div>
                </button>
                
                {/* Loading indicator */}
                {isSearching && (
                  <div className="hint">Searching for users...</div>
                )}
                
                {/* User results - only show when not searching */}
                {!isSearching && results.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="resultRow"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-700/50 flex items-center justify-center shrink-0">
                      {user.profile_photo_url ? (
                        <img src={user.profile_photo_url} alt={user.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary font-semibold text-sm">{user.display_name[0]}</span>
                      )}
                    </div>
                    <div className="rMid">
                      <div className="rTitle flex items-center gap-2">
                        <span>{user.display_name}</span>
                        <HcpBadge value={user.eg_handicap_index} show={user.show_handicap ?? true} className="text-white/60" />
                      </div>
                      {user.username && (
                        <div className="rSub">@{user.username}</div>
                      )}
                    </div>
                    <UserPlus className="w-4 h-4 text-white/40" />
                  </button>
                ))}
                
                {/* No results message */}
                {!isSearching && results.length === 0 && (
                  <div className="hint">No users found matching "{searchTerm}"</div>
                )}
              </div>
            </>
          )}

          {/* Removed duplicate no results section */}
        </div>
      )}
    </div>
  );
}
