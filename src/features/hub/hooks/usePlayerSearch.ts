/**
 * usePlayerSearch - Hook for searching real users and friends
 * 
 * Returns friends first, then searches all users when query is provided
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';

export interface PlayerProfile {
  id: string;
  name: string;
  display_name?: string;
  username?: string;
  profile_photo_url?: string;
  isFriend?: boolean;
}

interface UsePlayerSearchOptions {
  currentUserId?: string;
  excludeIds?: string[]; // Already selected players
  searchQuery: string;
}

interface UsePlayerSearchResult {
  friends: PlayerProfile[];
  searchResults: PlayerProfile[];
  isLoading: boolean;
  error: Error | null;
}

export function usePlayerSearch({
  currentUserId,
  excludeIds = [],
  searchQuery,
}: UsePlayerSearchOptions): UsePlayerSearchResult {
  const [friends, setFriends] = useState<PlayerProfile[]>([]);
  const [searchResults, setSearchResults] = useState<PlayerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [friendsLoaded, setFriendsLoaded] = useState(false);

  // Refs to prevent re-entry and track state
  const isSearchingRef = useRef(false);
  const friendsRef = useRef<PlayerProfile[]>([]);

  const debouncedQuery = useDebounce(searchQuery, 300);
  
  // Memoize excludeIds to prevent dependency changes
  const excludeIdsKey = excludeIds.join(',');

  // Keep friendsRef in sync
  useEffect(() => {
    friendsRef.current = friends;
  }, [friends]);

  // Load friends on mount - only runs once per currentUserId
  useEffect(() => {
    if (!currentUserId || friendsLoaded) return;

    let cancelled = false;

    async function loadFriends() {
      try {
        // Get friend relationships where status is 'accepted'
        const { data: friendships, error: friendError } = await supabase
          .from('user_friends')
          .select('friend_id')
          .eq('user_id', currentUserId)
          .eq('status', 'accepted')
          .limit(30);

        if (cancelled) return;
        if (friendError) throw friendError;

        if (!friendships?.length) {
          // Fall back to recent game co-players if no friends
          const { data: recentPlayers, error: recentError } = await supabase
            .from('game_participants')
            .select(`
              user_id,
              games!inner(host_user_id)
            `)
            .or(`games.host_user_id.eq.${currentUserId}`)
            .not('user_id', 'is', null)
            .neq('user_id', currentUserId)
            .order('created_at', { ascending: false })
            .limit(20);

          if (cancelled) return;

          if (!recentError && recentPlayers?.length) {
            const uniqueUserIds = [...new Set(recentPlayers.map(p => p.user_id).filter(Boolean))] as string[];
            
            if (uniqueUserIds.length > 0) {
              const { data: profiles } = await supabase
                .from('user_profiles')
                .select('id, display_name, username, profile_photo_url')
                .in('id', uniqueUserIds.slice(0, 20));

              if (cancelled) return;

              if (profiles) {
                setFriends(profiles.map(p => ({
                  id: p.id,
                  name: p.display_name || p.username || 'Unknown',
                  display_name: p.display_name,
                  username: p.username,
                  profile_photo_url: p.profile_photo_url,
                  isFriend: false,
                })));
              }
            }
          }
          setFriendsLoaded(true);
          return;
        }

        const friendIds = friendships.map(f => f.friend_id);

        // Get friend profiles
        const { data: profiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .in('id', friendIds);

        if (cancelled) return;
        if (profileError) throw profileError;

        setFriends((profiles || []).map(p => ({
          id: p.id,
          name: p.display_name || p.username || 'Unknown',
          display_name: p.display_name,
          username: p.username,
          profile_photo_url: p.profile_photo_url,
          isFriend: true,
        })));
        setFriendsLoaded(true);
      } catch (err) {
        if (cancelled) return;
        console.error('Error loading friends:', err);
        setError(err instanceof Error ? err : new Error('Failed to load friends'));
        setFriendsLoaded(true);
      }
    }

    loadFriends();
    
    return () => {
      cancelled = true;
    };
  }, [currentUserId, friendsLoaded]);

  // Search users when query changes - uses stable dependencies only
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Guard against re-entry
    if (isSearchingRef.current) return;

    let cancelled = false;

    async function searchUsers() {
      isSearchingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const query = debouncedQuery.toLowerCase();
        
        // Search by display_name or username
        const { data: profiles, error: searchError } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
          .limit(30);

        if (cancelled) return;
        if (searchError) throw searchError;

        // Use ref for friends to avoid dependency
        const currentFriends = friendsRef.current;
        const currentExcludeIds = excludeIds;

        // Exclude current user and already selected
        const filtered = (profiles || [])
          .filter(p => p.id !== currentUserId && !currentExcludeIds.includes(p.id))
          .map(p => ({
            id: p.id,
            name: p.display_name || p.username || 'Unknown',
            display_name: p.display_name,
            username: p.username,
            profile_photo_url: p.profile_photo_url,
            isFriend: currentFriends.some(f => f.id === p.id),
          }));

        setSearchResults(filtered);
      } catch (err) {
        if (cancelled) return;
        console.error('Error searching users:', err);
        setError(err instanceof Error ? err : new Error('Search failed'));
      } finally {
        isSearchingRef.current = false;
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    searchUsers();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, currentUserId]); // Only stable primitives - excludeIds checked inside

  // Filter friends by search query (client-side for instant feedback)
  const filteredFriends = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const excludeSet = new Set(excludeIds);
    return friends
      .filter(f => !excludeSet.has(f.id))
      .filter(f => 
        !searchQuery.trim() || 
        f.name.toLowerCase().includes(lowerQuery) ||
        f.display_name?.toLowerCase().includes(lowerQuery) ||
        f.username?.toLowerCase().includes(lowerQuery)
      );
  }, [friends, searchQuery, excludeIdsKey]);

  // Dedupe search results from friends (friends already shown separately)
  const deduplicatedSearchResults = useMemo(() => {
    const friendIds = new Set(filteredFriends.map(f => f.id));
    const excludeSet = new Set(excludeIds);
    return searchResults
      .filter(r => !friendIds.has(r.id))
      .filter(r => !excludeSet.has(r.id));
  }, [searchResults, filteredFriends, excludeIdsKey]);

  return {
    friends: filteredFriends,
    searchResults: deduplicatedSearchResults,
    isLoading,
    error,
  };
}
