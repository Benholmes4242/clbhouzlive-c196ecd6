import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, X, Plus, Check, ExternalLink, Mail, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useClubSearch, GolfClub } from '@/hooks/useClubSearch';
import { getFlagCode } from '@/utils/countryFlags';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { InviteClubModal } from './InviteClubModal';
import { useNavigate } from 'react-router-dom';

interface GolfInfoSectionProps {
  homeClub: string;
  homeClubId: string | null;
  handicap: string;
  userId?: string;
  onChange: (field: string, value: string | null) => void;
}

interface AdditionalClub {
  id: string;
  name: string;
  country: string | null;
}

interface ClubBusinessStatus {
  hasProfile: boolean;
  businessId?: string;
  businessName?: string;
}

export const GolfInfoSection: React.FC<GolfInfoSectionProps> = ({
  homeClub,
  homeClubId,
  handicap,
  userId,
  onChange,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Additional clubs
  const [additionalClubs, setAdditionalClubs] = useState<AdditionalClub[]>([]);
  const [showAddClub, setShowAddClub] = useState(false);
  const [addClubQuery, setAddClubQuery] = useState('');
  const addClubRef = useRef<HTMLDivElement>(null);
  
  // Club business status (for Connected/Invite)
  const [clubBusinessStatus, setClubBusinessStatus] = useState<ClubBusinessStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Search hooks
  const { data: searchResults, loading } = useClubSearch(searchQuery, {
    debounceMs: 250,
    limit: 10,
  });
  
  const { data: addClubResults, loading: addClubLoading } = useClubSearch(addClubQuery, {
    debounceMs: 250,
    limit: 10,
  });

  // Check if primary club has a business profile
  useEffect(() => {
    const checkClubBusiness = async () => {
      if (!homeClubId) {
        setClubBusinessStatus(null);
        return;
      }

      setCheckingStatus(true);
      try {
        const { data, error } = await supabase
          .from('business_accounts')
          .select('id, name')
          .eq('club_id', homeClubId)
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        
        setClubBusinessStatus({
          hasProfile: !!data,
          businessId: data?.id,
          businessName: data?.name,
        });
      } catch (error) {
        console.error('Error checking club business:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkClubBusiness();
  }, [homeClubId]);

  // Load additional clubs from user_home_clubs
  useEffect(() => {
    const loadAdditionalClubs = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('user_home_clubs')
          .select(`
            club_id,
            golf_clubs (id, name, country)
          `)
          .eq('user_profile_id', userId);

        if (error) throw error;

        const clubs = (data || [])
          .map((row: any) => row.golf_clubs)
          .filter(Boolean);
        
        setAdditionalClubs(clubs);
      } catch (error) {
        console.error('Error loading additional clubs:', error);
      }
    };

    loadAdditionalClubs();
  }, [userId]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (addClubRef.current && !addClubRef.current.contains(e.target as Node)) {
        setShowAddClub(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClubSelect = (club: GolfClub) => {
    onChange('homeClub', club.name);
    onChange('homeClubId', club.id);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleClearClub = () => {
    onChange('homeClub', '');
    onChange('homeClubId', null);
    setSearchQuery('');
    setClubBusinessStatus(null);
  };

  const handleAddAdditionalClub = async (club: GolfClub) => {
    if (!userId) return;
    
    // Don't add if it's the primary club or already in additional
    if (club.id === homeClubId || additionalClubs.some(c => c.id === club.id)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_home_clubs')
        .insert({
          user_profile_id: userId,
          club_id: club.id,
        } as any);

      if (error) throw error;

      setAdditionalClubs(prev => [...prev, {
        id: club.id,
        name: club.name,
        country: club.country,
      }]);
    } catch (error) {
      console.error('Error adding club:', error);
    }

    setShowAddClub(false);
    setAddClubQuery('');
  };

  const handleRemoveAdditionalClub = async (clubId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_home_clubs')
        .delete()
        .eq('user_profile_id', userId)
        .eq('club_id', clubId);

      if (error) throw error;

      setAdditionalClubs(prev => prev.filter(c => c.id !== clubId));
    } catch (error) {
      console.error('Error removing club:', error);
    }
  };

  const handleMakePrimary = async (club: AdditionalClub) => {
    // Move current primary to additional (if exists)
    if (homeClubId && homeClub) {
      await handleAddAdditionalClub({
        id: homeClubId,
        name: homeClub,
        country: null,
        region: null,
        sub_country: null,
        continent: null,
      });
    }
    
    // Remove new primary from additional
    await handleRemoveAdditionalClub(club.id);
    
    // Set new primary
    onChange('homeClub', club.name);
    onChange('homeClubId', club.id);
  };

  const handleViewClubProfile = () => {
    if (clubBusinessStatus?.businessId) {
      navigate(`/business/${clubBusinessStatus.businessId}`);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-medium">Golf information</h2>
        <p className="text-xs text-muted-foreground">Your home club and handicap.</p>
      </div>

      <div className="space-y-4">
        {/* Primary Home Club */}
        <div className="space-y-1.5">
          <Label htmlFor="homeClub" className="text-xs text-muted-foreground">
            Home Club
          </Label>
          <div ref={searchRef} className="relative">
            {homeClub ? (
              <div className="flex items-center gap-2 px-3 py-2.5 border border-border rounded-sq-sm bg-muted/30">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 text-sm">{homeClub}</span>
                <button
                  type="button"
                  onClick={handleClearClub}
                  className="p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="homeClub"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder="Search for your home club..."
                    className="pl-10 h-10"
                  />
                </div>

                {/* Search Results Dropdown */}
                {isSearchOpen && searchQuery.length >= 2 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-sq-sm shadow-lg max-h-64 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No clubs found
                      </div>
                    ) : (
                      <div className="py-1">
                        {searchResults.map((club) => (
                          <button
                            key={club.id}
                            type="button"
                            onClick={() => handleClubSelect(club)}
                            className="w-full px-3 py-2 text-left hover:bg-slate-100 transition-colors flex items-center gap-3"
                          >
                            {club.country && (
                              <img
                                src={`https://flagcdn.com/w20/${getFlagCode(club.country)}.png`}
                                alt={club.country}
                                className="w-5 h-4 object-cover rounded-sm flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {club.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {[club.sub_country, club.country].filter(Boolean).join(', ')}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Connected / Invite messaging */}
          {homeClubId && !checkingStatus && (
            <div className="mt-2">
              {clubBusinessStatus?.hasProfile ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                    <Check className="w-3 h-3" />
                    Connected
                  </span>
                  <span className="text-muted-foreground">
                    Your club has a business profile.
                  </span>
                  <button
                    type="button"
                    onClick={handleViewClubProfile}
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    View
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">
                    Your club hasn't set up a business profile yet.
                  </span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setShowInviteModal(true)}
                    className="h-auto p-0 text-xs text-primary"
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    Invite club
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <p className="text-[11px] text-muted-foreground">
            This helps us show you local courses and friends.
          </p>
        </div>

        {/* Additional Clubs */}
        {(additionalClubs.length > 0 || homeClub) && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Additional clubs
            </Label>
            
            {/* List of additional clubs */}
            {additionalClubs.length > 0 && (
              <div className="space-y-1">
                {additionalClubs.map((club) => (
                  <div
                    key={club.id}
                    className="flex items-center gap-2 px-3 py-2 border border-border/50 rounded-sq-sm bg-muted/20"
                  >
                    <span className="flex-1 text-sm truncate">{club.name}</span>
                    <button
                      type="button"
                      onClick={() => handleMakePrimary(club)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <Star className="w-3 h-3" />
                      Make primary
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveAdditionalClub(club.id)}
                      className="p-1 hover:bg-muted rounded-full transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add another club */}
            {showAddClub ? (
              <div ref={addClubRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={addClubQuery}
                    onChange={(e) => setAddClubQuery(e.target.value)}
                    placeholder="Search for a club..."
                    className="pl-10 h-9 text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddClub(false);
                      setAddClubQuery('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                
                {addClubQuery.length >= 2 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-sq-sm shadow-lg max-h-48 overflow-y-auto">
                    {addClubLoading ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        Searching...
                      </div>
                    ) : addClubResults.length === 0 ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        No clubs found
                      </div>
                    ) : (
                      <div className="py-1">
                        {addClubResults
                          .filter(c => c.id !== homeClubId && !additionalClubs.some(ac => ac.id === c.id))
                          .map((club) => (
                            <button
                              key={club.id}
                              type="button"
                              onClick={() => handleAddAdditionalClub(club)}
                              className="w-full px-3 py-2 text-left hover:bg-slate-100 transition-colors"
                            >
                              <div className="text-sm font-medium truncate">
                                {club.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {[club.sub_country, club.country].filter(Boolean).join(', ')}
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddClub(true)}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add another club
              </button>
            )}
          </div>
        )}

        {/* Handicap Index */}
        <div className="space-y-1.5">
          <Label htmlFor="handicap" className="text-xs text-muted-foreground">
            Handicap Index
          </Label>
          <Input
            id="handicap"
            type="number"
            step="0.1"
            min="-10"
            max="54"
            value={handicap}
            onChange={(e) => onChange('handicap', e.target.value)}
            placeholder="e.g., 12.4"
            className="h-10"
          />
          <p className="text-[11px] text-muted-foreground">
            Used for leaderboards and round stats – leave blank if you don't have one yet.
          </p>
        </div>
      </div>

      {/* Invite Club Modal */}
      {homeClubId && homeClub && userId && (
        <InviteClubModal
          open={showInviteModal}
          onOpenChange={setShowInviteModal}
          clubId={homeClubId}
          clubName={homeClub}
          userId={userId}
        />
      )}
    </div>
  );
};