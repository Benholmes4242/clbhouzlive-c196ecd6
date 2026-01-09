import React, { useState, useEffect, useRef } from 'react';
import { Search, X, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import HcpBadge from '@/components/HcpBadge';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm"
              style={{ 
                background: 'rgba(100, 116, 139, 0.08)',
                border: '1px solid rgba(100, 116, 139, 0.15)',
              }}
            >
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  {user.guest_name ? (
                    <div 
                      className="w-5 h-5 flex items-center justify-center shrink-0"
                      style={{ borderRadius: '6px', background: 'rgba(100, 116, 139, 0.1)' }}
                    >
                      <UserPlus className="w-3 h-3" style={{ color: '#64748b' }} />
                    </div>
                  ) : (
                    <SquircleAvatar
                      size={20}
                      src={user.profile_photo_url}
                      alt={user.display_name}
                      fallback={user.display_name?.charAt(0)?.toUpperCase() || '?'}
                    />
                  )}
                  <span className="font-medium truncate" style={{ color: '#1e293b' }}>{user.display_name}</span>
                  {!user.guest_name && (
                    <HcpBadge value={user.eg_handicap_index} show={user.show_handicap ?? true} />
                  )}
                </div>
              </div>
              <button
                onClick={() => onUserRemove(user.id)}
                className="hover:opacity-70 transition-colors"
                style={{ color: '#64748b' }}
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
              data-keyboard-aware
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
              <div 
                className="absolute left-0 right-0 top-full z-[100] mt-2 rounded-xl overflow-hidden"
                style={{ 
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: '0 10px 24px rgba(0, 0, 0, 0.12)',
                  maxHeight: '42vh',
                  overflowY: 'auto',
                  padding: '8px',
                }}
              >
                {/* Add Guest option - ALWAYS pinned at top */}
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddGuest();
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-lg transition-colors"
                  style={{ marginBottom: '8px', background: 'rgba(100, 116, 139, 0.04)' }}
                >
                  <div 
                    className="w-8 h-8 flex items-center justify-center shrink-0"
                    style={{ borderRadius: '8px', background: 'rgba(100, 116, 139, 0.08)' }}
                  >
                    <UserPlus className="w-4 h-4" style={{ color: '#64748b' }} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-[15px]" style={{ color: '#1e293b' }}>➕ Add Guest</div>
                    <div className="text-[13px]" style={{ color: '#64748b' }}>Add an unnamed player</div>
                  </div>
                </button>
                
                {/* Loading indicator */}
                {isSearching && (
                  <div className="p-4 text-center text-[14px]" style={{ color: '#64748b' }}>Searching for users...</div>
                )}
                
                {/* User results - only show when not searching */}
                {!isSearching && results.map((user) => (
                  <button
                    key={user.id}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUserSelect(user);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-lg transition-colors hover:bg-slate-50"
                  >
                    <SquircleAvatar
                      size={36}
                      src={user.profile_photo_url}
                      alt={user.display_name}
                      fallback={user.display_name?.charAt(0)?.toUpperCase() || '?'}
                    />
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 font-semibold text-[15px]" style={{ color: '#1e293b' }}>
                        <span className="truncate">{user.display_name}</span>
                        <HcpBadge value={user.eg_handicap_index} show={user.show_handicap ?? true} />
                      </div>
                      {user.username && (
                        <div className="text-[13px]" style={{ color: '#64748b' }}>@{user.username}</div>
                      )}
                    </div>
                    <UserPlus className="w-4 h-4" style={{ color: '#94a3b8' }} />
                  </button>
                ))}
                
                {/* No results message */}
                {!isSearching && results.length === 0 && (
                  <div className="p-4 text-center text-[14px]" style={{ color: '#64748b' }}>No users found matching "{searchTerm}"</div>
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
