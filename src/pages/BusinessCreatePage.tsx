import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PageRoot } from '@/components/layout/PageRoot';

// New components
import { BusinessProfileProgress } from '@/components/business/BusinessProfileProgress';
import { BusinessSectionTabs, BusinessSectionId } from '@/components/business/BusinessSectionTabs';
import { BusinessInfoSection } from '@/components/business/sections/BusinessInfoSection';
import { BusinessLocationSection } from '@/components/business/sections/BusinessLocationSection';
import { BusinessBrandingSection } from '@/components/business/sections/BusinessBrandingSection';
import { BusinessVerificationInfo } from '@/components/business/sections/BusinessVerificationInfo';

// Existing components
import { LocationValue } from '@/components/business/LocationAutocomplete';
import { PhoneValue } from '@/components/business/PhoneInputWithDialCode';
import { SelectedClub } from '@/components/business/ClubSearchDropdown';
import { SelectedCollege } from '@/components/business/CollegeSearchDropdown';
import { RequestAccessModal } from '@/components/business/RequestAccessModal';
import { ClaimCoursesStep } from '@/components/business/ClaimCoursesStep';
import { getCountryCodeFromClub } from '@/utils/countryCodeMapping';

type FlowStep = 'details' | 'claim-courses';

const BusinessCreatePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useSupabaseSession();
  
  const [step, setStep] = useState<FlowStep>('details');
const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null);
  const [createdBusinessSlug, setCreatedBusinessSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Section state
  const [activeSection, setActiveSection] = useState<BusinessSectionId>('info');
  
  // Form state
  const [category, setCategory] = useState('');
  const [selectedClub, setSelectedClub] = useState<SelectedClub | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<SelectedCollege | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState<PhoneValue | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

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

  const isGolfClubCategory = category === 'Golf Club';
  const isUniversityCategory = category === 'University / College';

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

  // Get effective business name
  const effectiveBusinessName = useMemo(() => {
    if (isGolfClubCategory && selectedClub) return selectedClub.name;
    if (isUniversityCategory && selectedCollege) return selectedCollege.college_name;
    return businessName;
  }, [isGolfClubCategory, isUniversityCategory, selectedClub, selectedCollege, businessName]);

  // Get club location string for display
  const clubLocationString = useMemo(() => {
    if (!selectedClub) return undefined;
    return [selectedClub.sub_country, selectedClub.region, selectedClub.country]
      .filter(Boolean)
      .join(', ') || undefined;
  }, [selectedClub]);

  // Calculate completed sections
  const completedSections = useMemo(() => {
    const completed: string[] = [];
    
    // Info section complete
    if (category) {
      if (isGolfClubCategory && selectedClub && !existingBusinessForClub) {
        completed.push('info');
      } else if (isUniversityCategory && selectedCollege) {
        completed.push('info');
      } else if (!isGolfClubCategory && !isUniversityCategory && businessName.trim()) {
        completed.push('info');
      }
    }
    
    // Location section complete
    const hasLocation = isGolfClubCategory ? !!selectedClub : !!location;
    const hasContact = website.trim() || email.trim();
    if (hasLocation && hasContact) {
      completed.push('location');
    }
    
    // Branding section complete (optional but tracked)
    if (logoUrl) {
      completed.push('branding');
    }
    
    return completed;
  }, [category, isGolfClubCategory, isUniversityCategory, selectedClub, selectedCollege, businessName, location, website, email, logoUrl, existingBusinessForClub]);

  // Progress calculation
  const progress = useMemo(() => {
    const total = 3; // info, location, branding
    const completed = completedSections.length;
    
    let nextStep = 'Add business info';
    if (!completedSections.includes('info')) {
      nextStep = 'Add business info';
    } else if (!completedSections.includes('location')) {
      nextStep = 'Add location & contact';
    } else if (!completedSections.includes('branding')) {
      nextStep = 'Upload your logo';
    } else {
      nextStep = 'Ready to create!';
    }
    
    return { completed, total, nextStep };
  }, [completedSections]);

  // Form validation
  const isValid = useMemo(() => {
    if (!category) return false;
    
    if (isGolfClubCategory) {
      if (!selectedClub) return false;
      if (existingBusinessForClub) return false;
    } else if (isUniversityCategory) {
      if (!selectedCollege) return false;
    } else {
      if (!businessName.trim()) return false;
    }
    
    if (!isGolfClubCategory && !location) return false;
    if (!website.trim() && !email.trim()) return false;
    
    return true;
  }, [category, isGolfClubCategory, isUniversityCategory, selectedClub, selectedCollege, businessName, location, website, email, existingBusinessForClub]);

  const handleSubmit = async () => {
    if (!user?.id || !isValid) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const formattedLocation = location?.country 
        ? `${location.city}, ${location.country}`
        : location?.label || '';

      const insertData: any = {
        name: effectiveBusinessName,
        category: category,
        location: formattedLocation,
        website: website.trim() || null,
        email: email.trim() || null,
        phone: phone?.fullNumber || null,
        description: description || null,
        logo_url: logoUrl,
        cover_image_url: coverUrl,
        is_verified: false,
        lat: location?.lat || null,
        lng: location?.lng || null,
        city: location?.city || null,
        region: location?.region || null,
        country: location?.country || null,
        address_label: location?.label || null,
      };

      // Link to golf club if applicable
      if (isGolfClubCategory && selectedClub) {
        insertData.club_id = selectedClub.id;
        insertData.club_key = selectedClub.club_key || null;
        insertData.lat = selectedClub.latitude || null;
        insertData.lng = selectedClub.longitude || null;
        insertData.city = selectedClub.sub_country || selectedClub.region || null;
        insertData.region = selectedClub.region || null;
        insertData.country = selectedClub.sub_country || selectedClub.country || null;
      }

      const { data: businessData, error: businessError } = await supabase
        .from('business_accounts')
        .insert(insertData)
        .select('id, slug')
        .single();

      if (businessError) {
        if (businessError.code === '23505' && businessError.message?.includes('club_id')) {
          toast.error('This club already has a business profile');
          return;
        }
        throw businessError;
      }

      const businessId = businessData.id;
      const businessSlug = businessData.slug;
      setCreatedBusinessId(businessId);
      setCreatedBusinessSlug(businessSlug);

      // Add current user as owner
      const { error: memberError } = await supabase
        .from('business_members')
        .insert({
          business_id: businessId,
          user_profile_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      await queryClient.invalidateQueries({ queryKey: ['my-businesses'] });

      setSaveSuccess(true);
      
      // If Golf Club with multiple courses, show claim step
      if (isGolfClubCategory && selectedClub) {
        setTimeout(() => {
          setStep('claim-courses');
        }, 600);
      } else {
        toast.success('Business profile created!');
        setTimeout(() => {
          navigate('/business/success', {
            state: {
              businessId: businessId,
              businessName: effectiveBusinessName,
              category: category,
              location: formattedLocation,
              avatarUrl: logoUrl,
              slug: businessSlug,
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
        avatarUrl: logoUrl,
        slug: createdBusinessSlug,
      },
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#94a3b8]" />
      </div>
    );
  }

  // Claim courses step
  if (step === 'claim-courses' && createdBusinessId && selectedClub) {
    return (
      <PageRoot className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#e2e8f0]">
          <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-medium text-[#94a3b8]">
                Final step
              </span>
            </div>
            <h1 className="text-xl font-semibold text-center mt-1 text-[#1e293b]">
              Claim your courses
            </h1>
            <p className="text-sm text-[#64748b] text-center mt-1">
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
    <PageRoot className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#e2e8f0]">
        <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <h1 className="text-xl font-bold text-[#1e293b] text-center">
            Create business profile
          </h1>
          <p className="text-sm text-[#64748b] text-center mt-1">
            Set up your presence on Clbhouz
          </p>
        </div>
      </header>
      
      {/* Progress Card */}
      <div className="pt-4 max-w-3xl mx-auto w-full">
        <BusinessProfileProgress
          completedFields={progress.completed}
          totalFields={progress.total}
          nextStep={progress.nextStep}
        />
      </div>
      
      {/* Section Tabs */}
      <div className="max-w-3xl mx-auto w-full">
        <BusinessSectionTabs
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          completedSections={completedSections}
        />
      </div>
      
      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-32">
          <AnimatePresence mode="wait">
            {activeSection === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <BusinessInfoSection
                  category={category}
                  setCategory={setCategory}
                  businessName={businessName}
                  setBusinessName={setBusinessName}
                  selectedClub={selectedClub}
                  setSelectedClub={setSelectedClub}
                  selectedCollege={selectedCollege}
                  setSelectedCollege={setSelectedCollege}
                  description={description}
                  setDescription={setDescription}
                  existingBusinessForClub={existingBusinessForClub}
                  onRequestAccess={() => setShowRequestAccessModal(true)}
                />
              </motion.div>
            )}
            
            {activeSection === 'location' && (
              <motion.div
                key="location"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <BusinessLocationSection
                  location={location}
                  setLocation={setLocation}
                  website={website}
                  setWebsite={setWebsite}
                  email={email}
                  setEmail={setEmail}
                  phone={phone}
                  setPhone={setPhone}
                  isGolfClub={isGolfClubCategory}
                  clubLocation={clubLocationString}
                />
              </motion.div>
            )}
            
            {activeSection === 'branding' && (
              <motion.div
                key="branding"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <BusinessBrandingSection
                  logoUrl={logoUrl}
                  setLogoUrl={setLogoUrl}
                  coverUrl={coverUrl}
                  setCoverUrl={setCoverUrl}
                  businessName={effectiveBusinessName}
                />
              </motion.div>
            )}
            
            {activeSection === 'verification' && (
              <motion.div
                key="verification"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <BusinessVerificationInfo />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Sticky Footer */}
      <footer className="fixed inset-x-0 bottom-0 z-20 bg-white border-t border-[#e2e8f0]">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 pb-safe">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={saving}
            className="flex-1 h-12 text-sm font-medium text-[#64748b] bg-white border border-[#e2e8f0] rounded-xl hover:bg-[#f8fafc] transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving || saveSuccess || !isValid || !!existingBusinessForClub || checkingClub}
            className={cn(
              "flex-[1.5] h-12 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2",
              saveSuccess 
                ? "bg-emerald-500 text-white"
                : isValid && !saving
                  ? "bg-[#1e293b] text-white hover:bg-[#334155]"
                  : "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
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
          </button>
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
