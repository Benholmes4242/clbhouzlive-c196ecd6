import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, X, Plus, Check, ExternalLink, Mail, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useClubSearch, GolfClub } from '@/hooks/useClubSearch';
import { getFlagCode } from '@/utils/countryFlags';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { InviteClubModal } from './InviteClubModal';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { VisibilityDropdown, VisibilityValue } from './VisibilityDropdown';
import HandicapSyncInlineNotice from './HandicapSyncInlineNotice';

interface GolfInfoSectionProps {
  homeClub: string;
  homeClubId: string | null;
  handicap: string;
  userId?: string;
  homeClubVisibility: VisibilityValue;
  additionalClubsVisibility: VisibilityValue;
  handicapSyncInterest?: boolean;
  onChange: (field: string, value: string | null) => void;
  onVisibilityChange: (field: 'homeClubVisibility' | 'additionalClubsVisibility', value: VisibilityValue) => void;
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
  homeClubVisibility,
  additionalClubsVisibility,
  handicapSyncInterest = false,
  onChange,
  onVisibilityChange,
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

  // Load additional clubs from user_home_clubs (filter out primary)
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
          .filter(Boolean)
          // Filter out primary club if it exists in additional (shouldn't but safety)
          .filter((club: AdditionalClub) => club.id !== homeClubId);
        
        setAdditionalClubs(clubs);
      } catch (error) {
        console.error('Error loading additional clubs:', error);
      }
    };

    loadAdditionalClubs();
  }, [userId, homeClubId]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (addClubRef.current && !addClubRef.current.contains(e.target as Node)) {
        setShowAddClub(false);
        setAddClubQuery('');
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
      toast.info('This club is already added');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_home_clubs')
        .insert({
          user_profile_id: userId,
          club_id: club.id,
        } as any);

      if (error) {
        // Handle duplicate constraint (23505)
        if (error.code === '23505') {
          toast.info('This club is already added');
          return;
        }
        throw error;
      }

      setAdditionalClubs(prev => [...prev, {
        id: club.id,
        name: club.name,
        country: club.country,
      }]);
      
      toast.success('Club added');
    } catch (error) {
      console.error('Error adding club:', error);
      toast.error('Failed to add club');
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
      toast.success('Club removed');
    } catch (error) {
      console.error('Error removing club:', error);
      toast.error('Failed to remove club');
    }
  };

  const handleViewClubProfile = () => {
    if (clubBusinessStatus?.businessId) {
      navigate(`/business/${clubBusinessStatus.businessId}`);
    }
  };

  // Filter out primary and already-added clubs from results
  const filteredAddClubResults = addClubResults.filter(
    c => c.id !== homeClubId && !additionalClubs.some(ac => ac.id === c.id)
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-medium">Golf information</h2>
        <p className="text-xs text-muted-foreground">We use this to show members, nearby golfers, and club activity.</p>
      </div>

      <div className="space-y-5">
        {/* Primary Home Club Card */}
        <div className="rounded-sq-md border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Home Club
              </Label>
              {homeClub && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Primary
                </span>
              )}
            </div>
            <VisibilityDropdown
              value={homeClubVisibility}
              onChange={(val) => onVisibilityChange('homeClubVisibility', val)}
            />
          </div>
          
          <p className="text-xs text-muted-foreground -mt-1">
            Controls who can see your primary club on your profile and in People.
          </p>
          
          {/* Private visibility banner */}
          {homeClubVisibility === 'private' && (
            <div className="flex items-center gap-2 rounded-sq-sm border border-border bg-muted/30 px-3 py-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Only you can see your home club.</span>
            </div>
          )}
          
          <div ref={searchRef} className="relative">
            {homeClub ? (
              <div className="flex items-center gap-3 px-3 py-2.5 border border-border rounded-sq-sm bg-muted/30">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 text-sm font-medium">{homeClub}</span>
                <button
                  type="button"
                  onClick={handleClearClub}
                  className="p-1.5 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder="Search for your home club..."
                    className="pl-10 h-11"
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
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleClubSelect(club)}
                            className="w-full px-3 py-2.5 text-left hover:bg-slate-100 transition-colors flex items-center gap-3"
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
            <div className="pt-1">
              {clubBusinessStatus?.hasProfile ? (
                <div className="flex items-center justify-between gap-2 py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-sq-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-medium rounded-full">
                      <Check className="w-3 h-3" />
                      Connected
                    </span>
                    <span className="text-xs text-emerald-700">
                      You're connected to your club's business profile.
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleViewClubProfile}
                    className="h-7 px-2 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100"
                  >
                    View profile
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 py-2 px-3 bg-muted/50 border border-border rounded-sq-sm">
                  <span className="text-xs text-muted-foreground">
                    No business profile yet.
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInviteModal(true)}
                    className="h-7 px-3 text-xs"
                  >
                    <Mail className="w-3 h-3 mr-1.5" />
                    Invite club
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Additional Clubs Card */}
        {homeClub && (
          <div className="rounded-sq-md border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Additional Clubs
              </Label>
              <div className="flex items-center gap-2">
                <VisibilityDropdown
                  value={additionalClubsVisibility}
                  onChange={(val) => onVisibilityChange('additionalClubsVisibility', val)}
                />
                {!showAddClub && (
                  <button
                    type="button"
                    onClick={() => setShowAddClub(true)}
                    className="h-7 px-3 text-xs rounded-full border border-border hover:bg-muted/40 transition"
                  >
                    + Add club
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground -mt-1">
              Controls who can see "Also plays at…" and your extra clubs.
            </p>
            
            {/* Private visibility banner */}
            {additionalClubsVisibility === 'private' && (
              <div className="flex items-center gap-2 rounded-sq-sm border border-border bg-muted/30 px-3 py-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Only you can see your additional clubs.</span>
              </div>
            )}

            {/* List of additional clubs as chips */}
            {additionalClubs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {additionalClubs.map((club) => (
                  <div
                    key={club.id}
                    className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-muted/50 border border-border rounded-full text-sm"
                  >
                    <span className="truncate max-w-[180px]">{club.name}</span>
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
            
            {/* Add another club search */}
            {showAddClub && (
              <div ref={addClubRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={addClubQuery}
                    onChange={(e) => setAddClubQuery(e.target.value)}
                    placeholder="Search for a club..."
                    className="pl-10 pr-10 h-10 text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddClub(false);
                      setAddClubQuery('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-full"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                
                {/* Dropdown results - FIXED: onMouseDown + onPointerDown to prevent close-before-click */}
                {addClubQuery.length >= 2 && (
                  <div 
                    className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-sq-sm shadow-lg max-h-48 overflow-y-auto"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {addClubLoading ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        Searching...
                      </div>
                    ) : filteredAddClubResults.length === 0 ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        No clubs found
                      </div>
                    ) : (
                      <div className="py-1">
                        {filteredAddClubResults.map((club) => (
                          <button
                            key={club.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => {
                              handleAddAdditionalClub(club);
                            }}
                            className="w-full px-3 py-2.5 text-left hover:bg-slate-100 transition-colors flex items-center gap-3"
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
              </div>
            )}
            
            {/* Empty state */}
            {additionalClubs.length === 0 && !showAddClub && (
              <p className="text-xs text-muted-foreground py-2">
                Add clubs you also play at regularly.
              </p>
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
            placeholder="e.g. 12.4"
            className="h-11"
          />
          <p className="text-[11px] text-muted-foreground">
            Your official handicap index (optional).
          </p>
          
          {/* Handicap Sync Interest Notice */}
          {userId && (
            <HandicapSyncInlineNotice
              userId={userId}
              hasRegisteredInterest={handicapSyncInterest}
            />
          )}
        </div>
      </div>

      {/* Invite Club Modal */}
      {showInviteModal && homeClubId && userId && (
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
