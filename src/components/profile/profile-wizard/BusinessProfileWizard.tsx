/**
 * BusinessProfileWizard - 3-step wizard for business profile creation
 * Follows Post/Review wizard pattern
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { ProfileWizardHeader } from './ProfileWizardHeader';
import { ProfileWizardProgress } from './ProfileWizardProgress';
import { ProfileWizardNavigation } from './ProfileWizardNavigation';
import { BUSINESS_STEP_CONFIG, BusinessWizardStep } from './types';
import { BusinessInfoStep, BusinessLocationStep, BusinessBrandingStep } from './steps';
import { ProfileSuccessScreen } from './ProfileSuccessScreen';

import { SelectedClub } from '@/components/business/ClubSearchDropdown';
import { SelectedCollege } from '@/components/business/CollegeSearchDropdown';
import { LocationValue } from '@/components/business/LocationAutocomplete';
import { PhoneValue } from '@/components/business/PhoneInputWithDialCode';
import { RequestAccessModal } from '@/components/business/RequestAccessModal';
import { getCountryCodeFromClub } from '@/utils/countryCodeMapping';

const TOTAL_STEPS = 3;

export function BusinessProfileWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useSupabaseSession();

  const [step, setStep] = useState<BusinessWizardStep>(1);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null);
  const [createdBusinessSlug, setCreatedBusinessSlug] = useState<string | null>(null);

  // Form state
  const [category, setCategory] = useState(
    searchParams.get('category') === 'golf_club' ? 'Golf Club' : ''
  );
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

  // Duplicate handling
  const [existingBusinessForClub, setExistingBusinessForClub] = useState<{id: string; name: string} | null>(null);
  const [showRequestAccessModal, setShowRequestAccessModal] = useState(false);

  // Pre-fill from URL params (from "Claim this course" CTA)
  const prefilledClubId = searchParams.get('clubId');
  const prefilledClubName = searchParams.get('clubName');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Auto-select club from URL params
  useEffect(() => {
    if (prefilledClubId && prefilledClubName && !selectedClub) {
      setSelectedClub({
        id: prefilledClubId,
        name: prefilledClubName,
        club_key: null,
        country: null,
        sub_country: null,
        region: null,
        latitude: null,
        longitude: null,
      } as SelectedClub);
    }
  }, [prefilledClubId, prefilledClubName]);

  const isGolfClubCategory = category === 'Golf Club';
  const isUniversityCategory = category === 'University / College';

  // Check if club already has a business
  useEffect(() => {
    const checkClubBusiness = async () => {
      if (!selectedClub?.id) {
        setExistingBusinessForClub(null);
        return;
      }
      try {
        const { data } = await supabase
          .from('business_accounts')
          .select('id, name')
          .eq('club_id', selectedClub.id)
          .eq('is_deleted', false)
          .limit(1)
          .maybeSingle();
        setExistingBusinessForClub(data);
        
        if (!data && selectedClub) {
          const locationLabel = [selectedClub.sub_country, selectedClub.region, selectedClub.country].filter(Boolean).join(', ');
          setLocation({
            label: locationLabel,
            city: selectedClub.sub_country || selectedClub.region || '',
            region: selectedClub.region || undefined,
            country: selectedClub.sub_country || selectedClub.country || '',
            countryCode: getCountryCodeFromClub(selectedClub) || '',
            lat: selectedClub.latitude || undefined,
            lng: selectedClub.longitude || undefined,
          });
        }
      } catch (error) {
        console.error('Error checking club:', error);
      }
    };
    checkClubBusiness();
  }, [selectedClub?.id]);

  const effectiveBusinessName = useMemo(() => {
    if (isGolfClubCategory && selectedClub) return selectedClub.name;
    if (isUniversityCategory && selectedCollege) return selectedCollege.college_name;
    return businessName;
  }, [isGolfClubCategory, isUniversityCategory, selectedClub, selectedCollege, businessName]);

  const clubLocationString = useMemo(() => {
    if (!selectedClub) return undefined;
    return [selectedClub.sub_country, selectedClub.region, selectedClub.country].filter(Boolean).join(', ') || undefined;
  }, [selectedClub]);

  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        if (!category) return false;
        if (isGolfClubCategory) return !!selectedClub && !existingBusinessForClub;
        if (isUniversityCategory) return !!selectedCollege;
        return businessName.trim().length > 0;
      case 2:
        const hasLocation = isGolfClubCategory ? !!selectedClub : !!location;
        const hasContact = website.trim() || email.trim();
        return hasLocation && !!hasContact;
      case 3:
        return true; // Branding is optional
      default:
        return false;
    }
  }, [step, category, isGolfClubCategory, isUniversityCategory, selectedClub, selectedCollege, businessName, location, website, email, existingBusinessForClub]);

  const isDirty = category !== '' || businessName !== '' || selectedClub !== null;

  const nextStep = useCallback(() => {
    if (step < TOTAL_STEPS) setStep((s) => (s + 1) as BusinessWizardStep);
  }, [step]);

  const prevStep = useCallback(() => {
    if (step > 1) setStep((s) => (s - 1) as BusinessWizardStep);
  }, [step]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      navigate(-1);
    }
  }, [isDirty, navigate]);

  const confirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    navigate(-1);
  }, [navigate]);

  const handleBack = useCallback(() => {
    if (step === 1) handleClose();
    else prevStep();
  }, [step, handleClose, prevStep]);

  const handleSubmit = useCallback(async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const formattedLocation = location?.country ? `${location.city}, ${location.country}` : location?.label || '';
      const insertData: any = {
        name: effectiveBusinessName,
        category,
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

      if (isGolfClubCategory && selectedClub) {
        insertData.club_id = selectedClub.id;
        insertData.club_key = selectedClub.club_key || null;
        insertData.lat = selectedClub.latitude || null;
        insertData.lng = selectedClub.longitude || null;
      }

      const { data: businessData, error: businessError } = await supabase
        .from('business_accounts')
        .insert(insertData)
        .select('id, slug')
        .single();

      if (businessError) throw businessError;

      await supabase.from('business_members').insert({
        business_id: businessData.id,
        user_profile_id: user.id,
        role: 'owner',
      });

      await queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
      setCreatedBusinessId(businessData.id);
      setCreatedBusinessSlug(businessData.slug);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error creating business:', error);
      toast.error('Failed to create business profile');
    } finally {
      setSaving(false);
    }
  }, [user?.id, effectiveBusinessName, category, location, website, email, phone, description, logoUrl, coverUrl, isGolfClubCategory, selectedClub, queryClient]);

  const handleViewProfile = useCallback(() => {
    if (createdBusinessSlug) navigate(`/business/${createdBusinessSlug}`);
    else navigate('/businesses/manage');
  }, [createdBusinessSlug, navigate]);

  const handleDone = useCallback(() => {
    navigate('/businesses/manage');
  }, [navigate]);

  if (authLoading) {
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#94a3b8]" /></div>;
  }

  if (showSuccess) {
    return <ProfileSuccessScreen title="Business Created" subtitle="Your business profile is now live" onViewProfile={handleViewProfile} onDone={handleDone} />;
  }

  const stepConfig = BUSINESS_STEP_CONFIG[step];

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[9999] bg-[#F8FAFC] flex flex-col overflow-hidden pt-safe pb-safe" style={{ touchAction: 'pan-y pinch-zoom', overscrollBehavior: 'contain' }}>
        <div className="flex-shrink-0">
          <ProfileWizardHeader title={stepConfig.title} currentStep={step} totalSteps={TOTAL_STEPS} onBack={handleBack} onClose={handleClose} />
        </div>
        <ProfileWizardProgress currentStep={step} totalSteps={TOTAL_STEPS} />
        <main className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="h-full">
              {step === 1 && <BusinessInfoStep category={category} setCategory={setCategory} businessName={businessName} setBusinessName={setBusinessName} selectedClub={selectedClub} setSelectedClub={setSelectedClub} selectedCollege={selectedCollege} setSelectedCollege={setSelectedCollege} description={description} setDescription={setDescription} existingBusinessForClub={existingBusinessForClub} onRequestAccess={() => setShowRequestAccessModal(true)} />}
              {step === 2 && <BusinessLocationStep location={location} setLocation={setLocation} website={website} setWebsite={setWebsite} email={email} setEmail={setEmail} phone={phone} setPhone={setPhone} isGolfClub={isGolfClubCategory} clubLocation={clubLocationString} />}
              {step === 3 && <BusinessBrandingStep logoUrl={logoUrl} setLogoUrl={setLogoUrl} coverUrl={coverUrl} setCoverUrl={setCoverUrl} businessName={effectiveBusinessName} />}
            </motion.div>
          </AnimatePresence>
        </main>
        <ProfileWizardNavigation currentStep={step} totalSteps={TOTAL_STEPS} canProceed={canProceed} isSubmitting={saving} onBack={handleBack} onNext={nextStep} onSubmit={handleSubmit} submitLabel="Create Business" />
      </motion.div>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent className="z-[10000] rounded-2xl">
          <AlertDialogHeader><AlertDialogTitle>Discard changes?</AlertDialogTitle><AlertDialogDescription>Your changes aren't saved. Are you sure you want to leave?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-xl">Keep editing</AlertDialogCancel><Button variant="destructive" onClick={confirmClose} className="rounded-xl">Discard</Button></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {existingBusinessForClub && user && <RequestAccessModal open={showRequestAccessModal} onOpenChange={setShowRequestAccessModal} businessId={existingBusinessForClub.id} businessName={existingBusinessForClub.name} userId={user.id} />}
    </>
  );
}

export default BusinessProfileWizard;
