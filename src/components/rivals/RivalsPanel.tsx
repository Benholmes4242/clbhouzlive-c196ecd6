import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useRivals } from '@/hooks/useRivals';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Search, X, TrendingUp, TrendingDown, Minus, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const RivalsPanel: React.FC = () => {
  const { user } = useSupabaseSession();
  const { rivals, addRival, removeRival, isAddingRival } = useRivals(user?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(5);

      if (error) throw error;

      // Filter out current user and existing rivals
      const rivalIds = rivals.map(r => r.rival_user_id);
      const filtered = data?.filter(
        p => p.id !== user?.id && !rivalIds.includes(p.id)
      ) || [];

      setSearchResults(filtered);
    } catch (error) {
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddRival = (userId: string) => {
    addRival(userId);
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Your Rivals</h2>
        <p className="text-sm text-muted-foreground">
          Add up to 5 rivals and compete for XP and leaderboard position
        </p>
      </div>

      {/* Add Rival Search */}
      {rivals.length < 5 && (
        <div className="mb-6 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Search for players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchQuery.trim()}
              size="icon"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-lg divide-y">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <SquircleAvatar
                      src={user.profile_photo_url}
                      alt={user.display_name || user.username || ''}
                      userId={user.id}
                      size={32}
                      hideRing
                    />
                    <div>
                      <p className="font-medium text-sm">{user.display_name || user.username}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddRival(user.id)}
                    disabled={isAddingRival}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rivals List */}
      {rivals.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No rivals yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Search for players to add as rivals
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rivals.map(rival => (
            <div
              key={rival.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <SquircleAvatar
                  src={rival.profile.profile_photo_url}
                  alt={rival.profile.display_name || rival.profile.username || ''}
                  userId={rival.rival_user_id}
                  size={48}
                  hideRing
                />
                
                <div className="flex-1">
                  <p className="font-medium">{rival.profile.display_name || rival.profile.username}</p>
                  <p className="text-sm text-muted-foreground">@{rival.profile.username}</p>
                </div>

                {rival.comparison && (
                  <div className="flex items-center gap-2">
                    {rival.comparison.is_ahead ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          +{rival.comparison.xp_difference} XP ahead
                        </span>
                      </>
                    ) : rival.comparison.xp_difference > 0 ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                          -{rival.comparison.xp_difference} XP behind
                        </span>
                      </>
                    ) : (
                      <>
                        <Minus className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Tied
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRival(rival.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {rivals.length >= 5 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Maximum rivals reached (5/5)
        </p>
      )}
    </Card>
  );
};
