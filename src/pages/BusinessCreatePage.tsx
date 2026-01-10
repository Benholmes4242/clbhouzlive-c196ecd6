import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Building2, MapPin, Globe, Mail, Phone, Check, Loader2, GraduationCap, ShoppingBag, Briefcase, Flag, BadgeCheck, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageRoot } from '@/components/layout/PageRoot';
import { cn } from '@/lib/utils';
import { LocationAutocomplete, LocationValue } from '@/components/business/LocationAutocomplete';
import { PhoneInputWithDialCode, PhoneValue } from '@/components/business/PhoneInputWithDialCode';
import { ClubSearchDropdown, SelectedClub } from '@/components/business/ClubSearchDropdown';
import { RequestAccessModal } from '@/components/business/RequestAccessModal';
import { ClaimCoursesStep } from '@/components/business/ClaimCoursesStep';
import { getCountryCodeFromClub } from '@/utils/countryCodeMapping';

// Import shared business categories
import { BUSINESS_CATEGORIES_WITH_ICONS } from '@/constants/businessCategories';

type FlowStep = 'details' | 'claim-courses' | 'success';

const BusinessCreatePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useSupabaseSession();
  
  const [step, setStep] = useState<FlowStep>('details');
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Form state
  const [category, setCategory] = useState('');
  const [selectedClub, setSelectedClub] = useState<SelectedClub | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [phone, setPhone] = useState<PhoneValue | null>(null);
  const [formData, setFormData] = useState({
    businessWebsite: '',
    businessContactEmail: '',
    businessBio: '',
  });

  // Duplicate club handling
  const [existingBusinessForClub, setExistingBusinessForClub] = useState<{id: string; name: string} | null>(null);
  const [checkingClub, setCheckingClub] = useState(false);
  const [showRequestAccessModal, setShowRequestAccessModal] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Check if club already has a business profile
  useEffect(() => {
    const checkClubBusiness = async () => {
      if (!selectedClub?.id) {
        setExistingBusinessForClub(null);
        return;
      }

      setCheckingClub(true);
      try {
        const { data, error } = await supabase
          .from('business_accounts')
          .select('id, name')
          .eq('club_id', selectedClub.id)
          .eq('is_deleted', false)
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setExistingBusinessForClub(data);

        // Auto-fill location from club data if not already claimed
        if (!data && selectedClub) {
          const locationLabel = [selectedClub.sub_country, selectedClub.region, selectedClub.country]
            .filter(Boolean)
            .join(', ');
          
          // Get proper ISO country code from club data
          const countryCode = getCountryCodeFromClub(selectedClub);
          
          setLocation({
            label: locationLabel,
            city: selectedClub.sub_country || selectedClub.region || '',
            region: selectedClub.region || undefined,
            country: selectedClub.sub_country || selectedClub.country || '',
            countryCode: countryCode || '',
            lat: selectedClub.latitude || undefined,
            lng: selectedClub.longitude || undefined,
          });
        }
      } catch (error) {
        console.error('Error checking club business:', error);
      } finally {
        setCheckingClub(false);
      }
    };

    checkClubBusiness();
  }, [selectedClub?.id]);

  const isGolfClubCategory = category === 'Golf Club';

  // Get effective business name
  const effectiveBusinessName = isGolfClubCategory ? selectedClub?.name || '' : businessName;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validation
  const isValid = (() => {
    // Category required
    if (!category) return false;

    // Business name required (from club selection or free text)
    if (isGolfClubCategory) {
      if (!selectedClub) return false;
      // Can't proceed if club already claimed
      if (existingBusinessForClub) return false;
    } else {
      if (!businessName.trim()) return false;
    }

    // Location required
    if (!location) return false;

    // At least one contact method
    if (!formData.businessWebsite.trim() && !formData.businessContactEmail.trim()) return false;

    return true;
  })();

  const handleSubmit = async () => {
    if (!location) {
      setLocationError('Please select a location from the list');
      return;
    }
    
    if (!user?.id || !isValid) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const formattedLocation = location.country 
        ? `${location.city}, ${location.country}`
        : location.label;

      // Create the business account
      const insertData: any = {
        name: effectiveBusinessName,
        category: category,
        location: formattedLocation,
        website: formData.businessWebsite || null,
        email: formData.businessContactEmail || null,
        phone: phone?.fullNumber || null,
        description: formData.businessBio || null,
        is_verified: false,
        // Persist location coordinates
        lat: location.lat || null,
        lng: location.lng || null,
        city: location.city || null,
        region: location.region || null,
        country: location.country || null,
        address_label: location.label || null,
      };

      // Link to golf club if applicable - force club data over any form drift
      if (isGolfClubCategory && selectedClub) {
        insertData.club_id = selectedClub.id;
        insertData.club_key = selectedClub.club_key || null;
        // Override with club data to ensure consistency
        insertData.lat = selectedClub.latitude || null;
        insertData.lng = selectedClub.longitude || null;
        insertData.city = selectedClub.sub_country || selectedClub.region || null;
        insertData.region = selectedClub.region || null;
        insertData.country = selectedClub.sub_country || selectedClub.country || null;
      }

      const { data: businessData, error: businessError } = await supabase
        .from('business_accounts')
        .insert(insertData)
        .select('id')
        .single();

      if (businessError) {
        // Check for unique constraint violation (duplicate club)
        if (businessError.code === '23505' && businessError.message?.includes('club_id')) {
          toast.error('This club already has a business profile');
          return;
        }
        throw businessError;
      }

      const businessId = businessData.id;
      setCreatedBusinessId(businessId);

      // Add current user as owner
      const { error: memberError } = await supabase
        .from('business_members')
        .insert({
          business_id: businessId,
          user_profile_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      // Invalidate caches
      await queryClient.invalidateQueries({ queryKey: ['my-businesses'] });

      setSaveSuccess(true);
      
      // If Golf Club with multiple courses, show claim step
      if (isGolfClubCategory && selectedClub) {
        setTimeout(() => {
          setStep('claim-courses');
        }, 600);
      } else {
        // Navigate to success
        toast.success('Business profile created!');
        setTimeout(() => {
          navigate('/business/success', {
            state: {
              businessId: businessId,
              businessName: effectiveBusinessName,
              category: category,
              location: formattedLocation,
            },
          });
        }, 600);
      }
    } catch (error) {
      console.error('Error creating business profile:', error);
      toast.error('Failed to create business profile');
    } finally {
      setSaving(false);
    }
  };

  const handleClaimCoursesComplete = () => {
    toast.success('Business profile created!');
    navigate('/business/success', {
      state: {
        businessId: createdBusinessId,
        businessName: effectiveBusinessName,
        category: category,
        location: location?.label,
      },
    });
  };

  const handleBack = () => {
    if (step === 'claim-courses') {
      // Skip courses and go to success
      handleClaimCoursesComplete();
    } else {
      navigate(-1);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.25,
        ease: 'easeOut' as const,
      },
    }),
  };

  // Claim courses step
  if (step === 'claim-courses' && createdBusinessId && selectedClub) {
    return (
      <PageRoot className="min-h-screen flex flex-col bg-muted/40">
        <header className="sticky top-0 z-20 border-b border-border/40 bg-background/95 backdrop-blur">
          <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-medium text-muted-foreground/70">
                Final step
              </span>
            </div>
            <h1 className="text-xl font-semibold text-center mt-1 text-foreground">
              Claim your courses
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Select which courses belong to your club.
            </p>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-3xl px-4 py-6">
            <ClaimCoursesStep
              clubId={selectedClub.id}
              businessId={createdBusinessId}
              onComplete={handleClaimCoursesComplete}
              onSkip={handleClaimCoursesComplete}
            />
          </div>
        </main>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="min-h-screen flex flex-col bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-3">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground/70">
              Step 2 of 2
            </span>
          </div>
          
          <h1 className="text-xl font-semibold text-center mt-1 text-foreground">
            Set up your business profile
          </h1>
          
          <p className="text-sm text-muted-foreground text-center mt-1">
            This is how your business will appear to golfers on clbhouz.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl pb-28">
          {/* Section: Business Identity */}
          <motion.section
            custom={0}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-5 bg-background border-b border-border/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Business identity</h2>
            </div>

            <div className="space-y-4 mt-4">
              {/* Category - REQUIRED FIRST */}
              <div className="space-y-1.5">
                <Label htmlFor="businessCategory" className="text-xs text-muted-foreground">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={category}
                  onValueChange={(value) => {
                    setCategory(value);
                    // Clear club selection when switching away from Golf Club
                    if (value !== 'Golf Club') {
                      setSelectedClub(null);
                      setExistingBusinessForClub(null);
                    }
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES_WITH_ICONS.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{cat.label}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  This helps golfers find the right type of business.
                </p>
              </div>

              {/* Business Name - depends on category */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                
                {isGolfClubCategory ? (
                  <>
                    <ClubSearchDropdown
                      value={selectedClub}
                      onChange={setSelectedClub}
                      placeholder="Search for your golf club..."
                      disabled={!category}
                      error={existingBusinessForClub ? undefined : undefined}
                    />
                    
                    {/* Already claimed warning */}
                    {existingBusinessForClub && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-sq-sm">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-amber-800 font-medium">
                              This club already has a business profile
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                              If you work here, you can request access to manage the profile.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowRequestAccessModal(true)}
                              className="mt-2 h-8 text-xs"
                            >
                              Request access
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!selectedClub && !category && (
                      <p className="text-[11px] text-muted-foreground">
                        Select "Golf Club" category first.
                      </p>
                    )}
                    {selectedClub && !existingBusinessForClub && (
                      <p className="text-[11px] text-muted-foreground">
                        Your business will be linked to this club's courses.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder={category ? "e.g., Elite Golf Academy" : "Select a category first"}
                      className="h-10 capitalize"
                      autoCapitalize="words"
                      disabled={!category}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      This is shown publicly on your profile and in search.
                    </p>
                  </>
                )}
              </div>

              {/* About */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="businessBio" className="text-xs text-muted-foreground">
                    About your business
                  </Label>
                  <span className="text-[11px] text-muted-foreground/70">
                    {formData.businessBio.length}/500
                  </span>
                </div>
                <Textarea
                  id="businessBio"
                  value={formData.businessBio}
                  onChange={(e) => handleInputChange('businessBio', e.target.value)}
                  placeholder="Tell golfers about your business..."
                  className="min-h-[120px] resize-none rounded-sq-sm leading-relaxed"
                  maxLength={500}
                />
                <p className="text-[11px] text-muted-foreground">
                  Tip: Mention what makes you different - facilities, coaching style, atmosphere, or events.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Section: Location & Contact */}
          <motion.section
            custom={1}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-5 bg-muted/30 border-b border-border/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Location & contact</h2>
            </div>
            
            {!isValid && effectiveBusinessName.trim().length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Add a location and at least one contact method (website or email) to continue.
              </p>
            )}

            <div className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Location <span className="text-destructive">*</span>
                </Label>
                {isGolfClubCategory && selectedClub && !existingBusinessForClub ? (
                  <>
                    {/* Locked location for linked clubs */}
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-border rounded-sq-sm bg-muted/50">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-foreground">
                        {[selectedClub.sub_country, selectedClub.region, selectedClub.country].filter(Boolean).join(', ') || 'Location unavailable'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Location is linked to the club record. Contact support to update details.
                    </p>
                  </>
                ) : (
                  <>
                    <LocationAutocomplete
                      value={location}
                      onChange={(val) => {
                        setLocation(val);
                        setLocationError(null);
                      }}
                      placeholder="Search for a city…"
                      error={locationError || undefined}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Choose your main base so golfers know where to find you.
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessWebsite" className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Website
                </Label>
                <Input
                  id="businessWebsite"
                  value={formData.businessWebsite}
                  onChange={(e) => handleInputChange('businessWebsite', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="businessContactEmail" className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Contact email
                  </Label>
                  <Input
                    id="businessContactEmail"
                    type="email"
                    value={formData.businessContactEmail}
                    onChange={(e) => handleInputChange('businessContactEmail', e.target.value)}
                    placeholder="contact@business.com"
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Phone
                  </Label>
                  <PhoneInputWithDialCode
                    value={phone}
                    onChange={setPhone}
                  />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground pt-3">
                Your contact details are only shown on your business profile.
              </p>
            </div>
          </motion.section>

          {/* Verification callout */}
          <motion.section
            custom={2}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-5"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">
                  <BadgeCheck className="h-3.5 w-3.5 text-slate-600" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Get verified on clbhouz</h3>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                Once your profile is live, you can request verification to show golfers your business is authentic and trusted.
              </p>
              
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/60 mt-1.5">•</span>
                  <span>Submit a verification request from your business profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/60 mt-1.5">•</span>
                  <span>We'll review your details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/60 mt-1.5">•</span>
                  <span>Approved profiles receive a verified badge</span>
                </li>
              </ul>
              
              <p className="text-[11px] text-muted-foreground/70">
                Verification is optional and not required to use clbhouz.
              </p>
            </div>
          </motion.section>
        </div>
      </main>

      {/* Sticky Footer */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border/40 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={saving}
            className="flex-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2.5"
          >
            Cancel
          </button>

          <Button
            variant="secondary"
            onClick={handleSubmit}
            disabled={saving || saveSuccess || !isValid || !!existingBusinessForClub || checkingClub}
            className={cn(
              "flex-[1.5] h-11",
              saveSuccess && "bg-emerald-500 hover:bg-emerald-500 text-white"
            )}
          >
            <AnimatePresence mode="wait">
              {saving ? (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating…
                </motion.span>
              ) : saveSuccess ? (
                <motion.span
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                  Created
                </motion.span>
              ) : (
                <motion.span
                  key="create"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Create business profile
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </footer>

      {/* Request Access Modal */}
      {existingBusinessForClub && user && (
        <RequestAccessModal
          open={showRequestAccessModal}
          onOpenChange={setShowRequestAccessModal}
          businessId={existingBusinessForClub.id}
          businessName={existingBusinessForClub.name}
          userId={user.id}
        />
      )}
    </PageRoot>
  );
};

export default BusinessCreatePage;