import React, { useState, useEffect, useRef } from 'react';
import { Search, X, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface UserProfile {
  id: string;
  display_name: string;
  username?: string;
  profile_photo_url?: string;
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
        .select('id, display_name, username, profile_photo_url')
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

  const remainingSlots = maxUsers - selectedUsers.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white/90">
          Tag players (optional)
        </label>
        <span className="text-xs text-white/60">
          {remainingSlots} {remainingSlots === 1 ? 'seat' : 'seats'} available
        </span>
      </div>

      {/* Selected users chips */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm text-white"
            >
              <span>{user.display_name}</span>
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setShowDropdown(true);
              }}
              className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          {/* Dropdown results */}
          {showDropdown && results.length > 0 && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute z-20 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto backdrop-blur-xl">
                {results.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-b-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                      {user.display_name[0]}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white text-sm font-medium">
                        {user.display_name}
                      </div>
                      {user.username && (
                        <div className="text-white/60 text-xs">@{user.username}</div>
                      )}
                    </div>
                    <UserPlus className="w-4 h-4 text-white/40" />
                  </button>
                ))}
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
