import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, X, Plus, Check, ExternalLink, Mail, Lock, GraduationCap } from 'lucide-react';
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
import { useCollegeMediaSearch, useCollegeMediaByName, CollegeMediaResult } from '@/hooks/useCollegeMediaSearch';
import { SectionHeader } from './SectionHeader';

interface DeferredClub {
  id: string;
  name: string;
  country: string | null;
}

interface GolfInfoSectionProps {
  homeClub: string;
  homeClubId: string | null;
  collegeNormalized: string | null;
  handicap: string;
  userId?: string;
  homeClubVisibility: VisibilityValue;
  additionalClubsVisibility: VisibilityValue;
  handicapSyncInterest?: boolean;
  onChange: (field: string, value: string | null) => void;
  onVisibilityChange: (field: 'homeClubVisibility' | 'additionalClubsVisibility', value: VisibilityValue) => void;
  // Deferred club operations (optional — if not provided, falls back to immediate save)
  deferredAddedClubs?: DeferredClub[];
  deferredRemovedClubIds?: string[];
  onDeferredAddClub?: (club: DeferredClub) => void;
  onDeferredRemoveClub?: (clubId: string) => void;
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
  collegeNormalized,
  handicap,
  userId,
  homeClubVisibility,
  additionalClubsVisibility,
  handicapSyncInterest = false,
  onChange,
  onVisibilityChange,
  deferredAddedClubs,
  deferredRemovedClubIds,
  onDeferredAddClub,
  onDeferredRemoveClub,
}) => {
  const isDeferred = !!onDeferredAddClub && !!onDeferredRemoveClub;
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
  
  // College search state
  const [collegeSearchQuery, setCollegeSearchQuery] = useState('');
  const [isCollegeSearchOpen, setIsCollegeSearchOpen] = useState(false);
  const collegeSearchRef = useRef<HTMLDivElement>(null);
  
  // Search hooks
  const { data: searchResults, loading } = useClubSearch(searchQuery, {
    debounceMs: 250,
    limit: 10,
  });
  
  const { data: addClubResults, loading: addClubLoading } = useClubSearch(addClubQuery, {
    debounceMs: 250,
    limit: 10,
  });
  
  // College search hooks
  const { data: collegeSearchResults, isLoading: collegeSearchLoading } = useCollegeMediaSearch(collegeSearchQuery);
  const { data: currentCollege } = useCollegeMediaByName(collegeNormalized);

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
      if (collegeSearchRef.current && !collegeSearchRef.current.contains(e.target as Node)) {
        setIsCollegeSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // College selection handlers
  const handleCollegeSelect = (college: CollegeMediaResult) => {
    onChange('collegeNormalized', college.normalized_name);
    setCollegeSearchQuery('');
    setIsCollegeSearchOpen(false);
  };

  const handleClearCollege = () => {
    onChange('collegeNormalized', null);
    setCollegeSearchQuery('');
  };

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
    // Also check deferred adds
    if (deferredAddedClubs?.some(c => c.id === club.id)) {
      toast.info('This club is already added');
      return;
    }

    if (isDeferred && onDeferredAddClub) {
      onDeferredAddClub({ id: club.id, name: club.name, country: club.country });
      setShowAddClub(false);
      setAddClubQuery('');
      return;
    }

    // Fallback: immediate save (legacy)
    try {
      const { error } = await supabase
        .from('user_home_clubs')
        .insert({
          user_profile_id: userId,
          club_id: club.id,
        } as any);

      if (error) {
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

    if (isDeferred && onDeferredRemoveClub) {
      onDeferredRemoveClub(clubId);
      return;
    }

    // Fallback: immediate delete (legacy)
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

  // Build the effective list of additional clubs (DB + deferred adds - deferred removes)
  const effectiveAdditionalClubs = [
    ...additionalClubs.filter(c => !(deferredRemovedClubIds || []).includes(c.id)),
    ...(deferredAddedClubs || []),
  ];

  // Filter out primary and already-added clubs from results
  const filteredAddClubResults = addClubResults.filter(
    c => c.id !== homeClubId && !effectiveAdditionalClubs.some(ac => ac.id === c.id)
  );

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={<MapPin className="w-5 h-5" />}
        title="Golf Information"
        subtitle="Connect with nearby golfers and show club activity"
        sectionType="golf"
      />

      <div className="space-y-5">
        {/* Primary Home Club Card */}
        <div className={cn(
          "rounded-sq-md border border-border p-4 space-y-3",
          homeClub ? "bg-white" : "bg-[#F8FAFC]"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Home club
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
              <div className="flex items-center gap-3 px-3 py-2.5 border border-border rounded-sq-sm bg-[#F8FAFC]">
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
                            {(() => {
                              const flagCode = club.country ? getFlagCode(club.country) : null;
                              return flagCode ? (
                                <img
                                  src={`https://flagcdn.com/w20/${flagCode}.png`}
                                  alt={club.country}
                                  className="w-5 h-4 object-cover rounded-sm flex-shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : null;
                            })()}
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
                <div className="flex items-center justify-between gap-2 py-2 px-3 bg-white border border-border rounded-sq-sm">
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
              <Label className="text-xs font-medium text-muted-foreground">
                Additional clubs
              </Label>
              <VisibilityDropdown
                value={additionalClubsVisibility}
                onChange={(val) => onVisibilityChange('additionalClubsVisibility', val)}
              />
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
            {effectiveAdditionalClubs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {effectiveAdditionalClubs.map((club) => (
                  <div
                    key={club.id}
                    className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-[#F8FAFC] border border-border rounded-full text-sm"
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
                            {(() => {
                              const flagCode = club.country ? getFlagCode(club.country) : null;
                              return flagCode ? (
                                <img
                                  src={`https://flagcdn.com/w20/${flagCode}.png`}
                                  alt={club.country}
                                  className="w-5 h-4 object-cover rounded-sm flex-shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : null;
                            })()}
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
            {effectiveAdditionalClubs.length === 0 && !showAddClub && (
              <p className="text-xs text-muted-foreground py-2">
                Add clubs you also play at regularly.
              </p>
            )}
            
            {/* Add club button - bottom right */}
            {!showAddClub && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddClub(true)}
                  className="h-7 px-3 text-xs rounded-full border border-border bg-[#F8FAFC] hover:bg-slate-100 transition"
                >
                  + Add club
                </button>
              </div>
            )}
          </div>
        )}

        {/* College Selection - Enhanced prominent display */}
        <div className={cn(
          "rounded-2xl border-2 p-5 space-y-3 transition-all",
          collegeNormalized && currentCollege
            ? "border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5" 
            : "border-border bg-card"
        )}>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground">
              College
            </Label>
            {collegeNormalized && currentCollege && (
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full">
                Badge active
              </span>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            Add your college to show a badge on your profile and connect with alumni.
          </p>

          <div ref={collegeSearchRef} className="relative">
            {collegeNormalized && currentCollege ? (
              /* Prominent College Card when selected */
              <div className="flex items-center gap-4 p-4 border border-primary/20 bg-card rounded-xl shadow-sm">
                {/* Large circular logo */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full shadow-lg border-2 border-primary/20 overflow-hidden">
                    {currentCollege.logo_url ? (
                      <img
                        src={currentCollege.logo_url}
                        alt={currentCollege.short_name || currentCollege.college_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-background flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-primary" />
                      </div>
                    )}
                  </div>
                  {/* Subtle animated ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-base text-foreground truncate block">
                    {currentCollege.short_name || currentCollege.college_name}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    Showing on your profile
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handleClearCollege}
                  className="p-2 hover:bg-destructive/10 rounded-full transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={collegeSearchQuery}
                    onChange={(e) => {
                      setCollegeSearchQuery(e.target.value);
                      setIsCollegeSearchOpen(true);
                    }}
                    onFocus={() => setIsCollegeSearchOpen(true)}
                    placeholder="Search for your college..."
                    className="pl-10 h-12 text-base border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* College Search Results Dropdown */}
                {isCollegeSearchOpen && collegeSearchQuery.length >= 2 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {collegeSearchLoading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Searching...
                      </div>
                    ) : !collegeSearchResults?.length ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No colleges found. Try the full name (e.g., "University of Texas").
                      </div>
                    ) : (
                      <div className="py-1">
                        {collegeSearchResults.map((college) => (
                          <button
                            key={college.normalized_name}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleCollegeSelect(college)}
                            className="w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors flex items-center gap-3"
                          >
                            {college.logo_url ? (
                              <img
                                src={college.logo_url}
                                alt={college.short_name || college.college_name}
                                className="w-8 h-8 rounded-full object-contain bg-background flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {college.short_name || college.college_name}
                              </div>
                              {college.short_name && college.short_name !== college.college_name && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {college.college_name}
                                </div>
                              )}
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
        </div>

        {/* Handicap Index */}
        <div className="space-y-1.5">
          <HandicapInput
            value={handicap}
            onChange={(v) => onChange('handicap', v)}
          />
          
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
