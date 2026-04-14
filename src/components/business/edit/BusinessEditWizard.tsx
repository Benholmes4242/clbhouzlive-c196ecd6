/**
 * BusinessEditWizard — 3-step wizard for editing a business profile
 * Visual layer matches BusinessProfileWizard (create) and PersonalProfileWizard exactly.
 * All changes deferred to Save on Step 3.
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessImageUpload } from '@/hooks/useBusinessImageUpload';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AppLog } from '@/lib/logger';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { ProfileWizardHeader } from '@/components/profile/profile-wizard/ProfileWizardHeader';
import { ProfileWizardProgress } from '@/components/profile/profile-wizard/ProfileWizardProgress';
import { ProfileWizardNavigation } from '@/components/profile/profile-wizard/ProfileWizardNavigation';
import { BUSINESS_STEP_CONFIG, BusinessWizardStep } from '@/components/profile/profile-wizard/types';
import type { WizardDirection } from '@/components/profile/profile-wizard/types';

import { AddressValue } from '@/components/business/AddressAutocomplete';
import { PhoneValue } from '@/components/business/PhoneInputWithDialCode';

import { BusinessEditStep1Info } from './BusinessEditStep1Info';
import { BusinessEditStep2Location } from './BusinessEditStep2Location';
import { BusinessEditStep3Branding } from './BusinessEditStep3Branding';

const TOTAL_STEPS = 3;

const DEFAULT_OPENING_HOURS: Record<string, { open: string; close: string; closed: boolean }> = {
  Mon: { open: '08:00', close: '18:00', closed: false },
  Tue: { open: '08:00', close: '18:00', closed: false },
  Wed: { open: '08:00', close: '18:00', closed: false },
  Thu: { open: '08:00', close: '18:00', closed: false },
  Fri: { open: '08:00', close: '18:00', closed: false },
  Sat: { open: '08:00', close: '18:00', closed: false },
  Sun: { open: '08:00', close: '18:00', closed: true },
};

const slideVariants = {
  enter: (dir: WizardDirection) => ({
    x: dir === 'forward' ? '100%' : '-100%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: WizardDirection) => ({
    x: dir === 'forward' ? '-100%' : '100%',
    opacity: 0,
  }),
};

const transition = { type: 'tween' as const, duration: 0.22, ease: 'easeInOut' as const };

export default function BusinessEditWizard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useSupabaseSession();

  const { data: business, isLoading: businessLoading, error: businessError } = useBusinessProfile(id);
  const { data: membership, isLoading: membershipLoading } = useBusinessMembership(id);
  const {
    uploadLogo: doUploadLogo,
    removeLogo: doRemoveLogo,
    uploadCover: doUploadCover,
    removeCover: doRemoveCover,
  } = useBusinessImageUpload(id);

  const [step, setStep] = useState<BusinessWizardStep>(1);
  const [direction, setDirection] = useState<WizardDirection>('forward');
  const [saving, setSaving] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    businessName: '',
    businessCategory: '',
    businessBio: '',
    businessWebsite: '',
    businessContactEmail: '',
    businessFoundedYear: '',
    businessBookingUrl: '',
    businessInstagram: '',
    businessTwitter: '',
    businessFacebook: '',
    businessYoutube: '',
  });

  const [address, setAddress] = useState<AddressValue | null>(null);
  const [countrySelection, setCountrySelection] = useState<string | null>(null);
  const [phone, setPhone] = useState<PhoneValue | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [openingHours, setOpeningHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    { ...DEFAULT_OPENING_HOURS }
  );

  // Deferred photo state
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [localLogoPreview, setLocalLogoPreview] = useState<string | null>(null);
  const [localCoverPreview, setLocalCoverPreview] = useState<string | null>(null);
  const [pendingRemoveLogo, setPendingRemoveLogo] = useState(false);
  const [pendingRemoveCover, setPendingRemoveCover] = useState(false);

  // Initial values snapshot for dirty detection
  const [initialValues, setInitialValues] = useState<{
    formData: typeof formData;
    address: AddressValue | null;
    countrySelection: string | null;
    phone: PhoneValue | null;
    openingHours: typeof openingHours;
  } | null>(null);

  // Guard against re-initialising form on background refetches
  const hasInitialized = useRef(false);

  // Populate form when business data loads
  useEffect(() => {
    if (!business) return;
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const newFormData = {
      businessName: business.name || '',
      businessCategory: business.category || '',
      businessBio: business.description || '',
      businessWebsite: business.website || '',
      businessContactEmail: business.email || '',
      businessFoundedYear: business.founded_year ? String(business.founded_year) : '',
      businessBookingUrl: business.booking_url || '',
      businessInstagram: business.social_links?.instagram || '',
      businessTwitter: business.social_links?.twitter || '',
      businessFacebook: business.social_links?.facebook || '',
      businessYoutube: business.social_links?.youtube || '',
    };
    setFormData(newFormData);

    let newAddress: AddressValue | null = null;
    if (business.address_label || business.location) {
      newAddress = {
        label: business.address_label || business.location || '',
        addressLine1: business.address_line1 || undefined,
        addressLine2: business.address_line2 || undefined,
        city: business.city || undefined,
        region: business.region || undefined,
        postcode: business.postcode || undefined,
        country: business.country || undefined,
        countryCode: business.country || undefined,
        lat: business.lat || undefined,
        lng: business.lng || undefined,
        mapboxPlaceId: business.mapbox_place_id || undefined,
        precision: business.location_precision || 'city',
      };
      setAddress(newAddress);
    }

    let newCountrySelection: string | null = null;
    if (business.country) {
      const countryNameMap: Record<string, string> = {
        'United Kingdom': 'England',
        'UK': 'England',
        'GB': 'England',
        'Ireland': 'Ireland',
        'IE': 'Ireland',
        'United States': 'United States',
        'US': 'United States',
        'USA': 'United States',
        'Canada': 'Canada',
        'CA': 'Canada',
        'Australia': 'Australia',
        'AU': 'Australia',
      };
      newCountrySelection = countryNameMap[business.country] || business.country;
    }
    setCountrySelection(newCountrySelection);

    let newPhone: PhoneValue | null = null;
    if (business.phone) {
      newPhone = {
        dialCode: '',
        localNumber: business.phone.replace(/^\+\d+\s*/, ''),
        fullNumber: business.phone,
      };
      setPhone(newPhone);
    }

    const newOpeningHours = business.opening_hours
      ? { ...business.opening_hours }
      : { ...DEFAULT_OPENING_HOURS };
    setOpeningHours(newOpeningHours);

    setInitialValues({
      formData: newFormData,
      address: newAddress,
      countrySelection: newCountrySelection,
      phone: newPhone,
      openingHours: newOpeningHours,
    });
  }, [business]);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  // Permission check
  const canEdit = membership?.canManage;
  useEffect(() => {
    if (!membershipLoading && membership && !canEdit) {
      toast.error("You don't have permission to edit this business");
      navigate(`/business/${id}`);
    }
  }, [membershipLoading, membership, canEdit, id, navigate]);

  const isClubLinked = !!business?.club_id;

  // Dirty detection
  const isDirty = useMemo(() => {
    if (!initialValues) return false;
    const formChanged = JSON.stringify(formData) !== JSON.stringify(initialValues.formData);
    const addressChanged = JSON.stringify(address) !== JSON.stringify(initialValues.address);
    const countryChanged = countrySelection !== initialValues.countrySelection;
    const phoneChanged = JSON.stringify(phone) !== JSON.stringify(initialValues.phone);
    const photosChanged = !!pendingLogoFile || !!pendingCoverFile || pendingRemoveLogo || pendingRemoveCover;
    const hoursChanged = JSON.stringify(openingHours) !== JSON.stringify(initialValues.openingHours);
    return formChanged || addressChanged || countryChanged || phoneChanged || photosChanged || hoursChanged;
  }, [formData, address, countrySelection, phone, openingHours, initialValues, pendingLogoFile, pendingCoverFile, pendingRemoveLogo, pendingRemoveCover]);

  // Validation per step
  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        return formData.businessName.trim().length > 0 || isClubLinked;
      case 2:
        return address !== null || isClubLinked;
      case 3:
        return true;
      default:
        return false;
    }
  }, [step, formData, address, isClubLinked]);

  const onFieldChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const nextStep = useCallback(() => {
    if (step < TOTAL_STEPS) {
      setDirection('forward');
      setStep((s) => (s + 1) as BusinessWizardStep);
    }
  }, [step]);

  const prevStep = useCallback(() => {
    if (step > 1) {
      setDirection('back');
      setStep((s) => (s - 1) as BusinessWizardStep);
    }
  }, [step]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      navigate(`/business/${id}`);
    }
  }, [isDirty, navigate, id]);

  const confirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    if (localLogoPreview) URL.revokeObjectURL(localLogoPreview);
    if (localCoverPreview) URL.revokeObjectURL(localCoverPreview);
    navigate(`/business/${id}`);
  }, [navigate, id, localLogoPreview, localCoverPreview]);

  const handleBack = useCallback(() => {
    if (step === 1) handleClose();
    else prevStep();
  }, [step, handleClose, prevStep]);

  const handleSubmit = useCallback(async () => {
    if (!user?.id || !id) return;
    setSaving(true);

    try {
      // Deferred photo uploads
      if (pendingRemoveLogo) await doRemoveLogo();
      else if (pendingLogoFile) await doUploadLogo(pendingLogoFile);

      if (pendingRemoveCover) await doRemoveCover();
      else if (pendingCoverFile) await doUploadCover(pendingCoverFile);

      const socialLinks = {
        instagram: formData.businessInstagram || null,
        twitter: formData.businessTwitter || null,
        facebook: formData.businessFacebook || null,
        youtube: formData.businessYoutube || null,
      };
      const hasSocialLinks = Object.values(socialLinks).some(Boolean);

      const updatePayload: Record<string, unknown> = {
        name: formData.businessName,
        category: formData.businessCategory || null,
        website: formData.businessWebsite || null,
        email: formData.businessContactEmail || null,
        phone: phone?.fullNumber || null,
        description: formData.businessBio || null,
        founded_year: formData.businessFoundedYear ? parseInt(formData.businessFoundedYear, 10) : null,
        booking_url: formData.businessBookingUrl || null,
        opening_hours: openingHours,
        social_links: hasSocialLinks ? socialLinks : null,
        updated_at: new Date().toISOString(),
      };

      // Only update location fields for non-club-linked businesses
      if (!isClubLinked && address) {
        Object.assign(updatePayload, {
          location: address.label,
          address_label: address.label,
          address_line1: address.addressLine1 || null,
          address_line2: address.addressLine2 || null,
          city: address.city || null,
          region: address.region || null,
          postcode: address.postcode || null,
          country: address.country || null,
          lat: address.lat || null,
          lng: address.lng || null,
          mapbox_place_id: address.mapboxPlaceId || null,
          location_precision: address.precision || null,
          location_updated_at: new Date().toISOString(),
        });
      }

      if (!id) throw new Error('Business ID is missing');

      const { error: updateError } = await supabase
        .from('business_accounts')
        .update(updatePayload)
        .eq('id', id);

      if (updateError) throw updateError;

      await queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
      await queryClient.invalidateQueries({ queryKey: ['business-profile'] });

      // Cleanup deferred state
      if (localLogoPreview) URL.revokeObjectURL(localLogoPreview);
      if (localCoverPreview) URL.revokeObjectURL(localCoverPreview);

      toast.success('Changes saved');
      navigate(`/business/${id}`);
    } catch (error) {
      AppLog.error('[BusinessEditWizard]', 'Error updating business profile:', error);
      toast.error('Unable to save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [
    user?.id, id, formData, address, phone, openingHours, isClubLinked,
    pendingLogoFile, pendingCoverFile, pendingRemoveLogo, pendingRemoveCover,
    doUploadLogo, doRemoveLogo, doUploadCover, doRemoveCover,
    localLogoPreview, localCoverPreview, queryClient, navigate,
  ]);

  // Loading state
  if (authLoading || businessLoading || membershipLoading) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#F7931E', borderTopColor: 'transparent' }} />
      </div>,
      document.body
    );
  }

  // Error / not found state
  if (businessError || !business) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-[16px] font-bold text-foreground mb-2">Business not found</h1>
          <p className="text-[13px] text-muted-foreground mb-6">
            This business may have been removed or is no longer available.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="text-[14px] font-semibold"
            style={{ color: '#F7931E' }}
          >
            Go back
          </button>
        </div>
      </div>,
      document.body
    );
  }

  // Permission denied state
  if (!membershipLoading && membership && !canEdit) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-[16px] font-bold text-foreground mb-2">Access denied</h1>
          <p className="text-[13px] text-muted-foreground mb-6">
            You don't have permission to edit this business profile.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="text-[14px] font-semibold"
            style={{ color: '#F7931E' }}
          >
            Go back
          </button>
        </div>
      </div>,
      document.body
    );
  }

  const stepConfig = BUSINESS_STEP_CONFIG[step];

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] flex flex-col bg-background">
        <ProfileWizardHeader
          title={stepConfig.title}
          currentStep={step}
          totalSteps={TOTAL_STEPS}
          onBack={handleBack}
          onClose={handleClose}
        />
        <ProfileWizardProgress currentStep={step} totalSteps={TOTAL_STEPS} />

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="pt-4"
            >
              {step === 1 && (
                <BusinessEditStep1Info
                  formData={formData}
                  onFieldChange={onFieldChange}
                  isClubLinked={isClubLinked}
                />
              )}
              {step === 2 && (
                <BusinessEditStep2Location
                  formData={formData}
                  onFieldChange={onFieldChange}
                  address={address}
                  setAddress={setAddress}
                  countrySelection={countrySelection}
                  setCountrySelection={setCountrySelection}
                  phone={phone}
                  setPhone={setPhone}
                  openingHours={openingHours}
                  setOpeningHours={setOpeningHours}
                  isClubLinked={isClubLinked}
                  businessLocation={business.location}
                  addressError={addressError}
                  setAddressError={setAddressError}
                />
              )}
              {step === 3 && (
                <BusinessEditStep3Branding
                  businessName={formData.businessName}
                  currentLogoUrl={business.logo_url}
                  currentCoverUrl={business.cover_image_url}
                  pendingLogoFile={pendingLogoFile}
                  setPendingLogoFile={setPendingLogoFile}
                  pendingCoverFile={pendingCoverFile}
                  setPendingCoverFile={setPendingCoverFile}
                  localLogoPreview={localLogoPreview}
                  setLocalLogoPreview={setLocalLogoPreview}
                  localCoverPreview={localCoverPreview}
                  setLocalCoverPreview={setLocalCoverPreview}
                  pendingRemoveLogo={pendingRemoveLogo}
                  setPendingRemoveLogo={setPendingRemoveLogo}
                  pendingRemoveCover={pendingRemoveCover}
                  setPendingRemoveCover={setPendingRemoveCover}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <ProfileWizardNavigation
          currentStep={step}
          totalSteps={TOTAL_STEPS}
          canProceed={canProceed}
          isSubmitting={saving}
          onBack={handleBack}
          onNext={nextStep}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
        />
      </div>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. They will be lost if you leave now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmClose}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>,
    document.body
  );
}
