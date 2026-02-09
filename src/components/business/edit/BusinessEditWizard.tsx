/**
 * BusinessEditWizard — 3-step wizard for editing a business profile
 * Mirrors BusinessProfileWizard (create) and PersonalProfileWizard patterns.
 * All changes deferred to Save on Step 3.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessImageUpload } from '@/hooks/useBusinessImageUpload';
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

import { ProfileWizardHeader } from '@/components/profile/profile-wizard/ProfileWizardHeader';
import { ProfileWizardProgress } from '@/components/profile/profile-wizard/ProfileWizardProgress';
import { ProfileWizardNavigation } from '@/components/profile/profile-wizard/ProfileWizardNavigation';
import { BUSINESS_STEP_CONFIG, BusinessWizardStep } from '@/components/profile/profile-wizard/types';

import { AddressValue } from '@/components/business/AddressAutocomplete';
import { PhoneValue } from '@/components/business/PhoneInputWithDialCode';

import { BusinessEditStep1Info } from './BusinessEditStep1Info';
import { BusinessEditStep2Location } from './BusinessEditStep2Location';
import { BusinessEditStep3Branding } from './BusinessEditStep3Branding';

const TOTAL_STEPS = 3;

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
  const [saving, setSaving] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    businessName: '',
    businessCategory: '',
    businessBio: '',
    businessWebsite: '',
    businessContactEmail: '',
  });

  const [address, setAddress] = useState<AddressValue | null>(null);
  const [countrySelection, setCountrySelection] = useState<string | null>(null);
  const [phone, setPhone] = useState<PhoneValue | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

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
  } | null>(null);

  // Populate form when business data loads
  useEffect(() => {
    if (business) {
      const newFormData = {
        businessName: business.name || '',
        businessCategory: business.category || '',
        businessBio: business.description || '',
        businessWebsite: business.website || '',
        businessContactEmail: business.email || '',
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
          dialCode: '+44',
          localNumber: business.phone.replace(/^\+\d+\s*/, ''),
          fullNumber: business.phone,
        };
        setPhone(newPhone);
      }

      setInitialValues({
        formData: newFormData,
        address: newAddress,
        countrySelection: newCountrySelection,
        phone: newPhone,
      });
    }
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
    return formChanged || addressChanged || countryChanged || phoneChanged || photosChanged;
  }, [formData, address, countrySelection, phone, initialValues, pendingLogoFile, pendingCoverFile, pendingRemoveLogo, pendingRemoveCover]);

  // Validation per step
  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        return formData.businessName.trim().length > 0 || isClubLinked;
      case 2:
        const hasAddress = address !== null || isClubLinked;
        const hasContact = formData.businessWebsite.trim().length > 0 || formData.businessContactEmail.trim().length > 0;
        return hasAddress && hasContact;
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
    if (step < TOTAL_STEPS) setStep((s) => (s + 1) as BusinessWizardStep);
  }, [step]);

  const prevStep = useCallback(() => {
    if (step > 1) setStep((s) => (s - 1) as BusinessWizardStep);
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
    // Cleanup previews
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

      const updatePayload: Record<string, any> = {
        name: formData.businessName,
        category: formData.businessCategory || null,
        website: formData.businessWebsite || null,
        email: formData.businessContactEmail || null,
        phone: phone?.fullNumber || null,
        description: formData.businessBio || null,
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
      console.error('Error updating business profile:', error);
      toast.error('Unable to save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [
    user?.id, id, formData, address, phone, isClubLinked,
    pendingLogoFile, pendingCoverFile, pendingRemoveLogo, pendingRemoveCover,
    doUploadLogo, doRemoveLogo, doUploadCover, doRemoveCover,
    localLogoPreview, localCoverPreview, queryClient, navigate,
  ]);

  // Loading / error states
  if (authLoading || businessLoading || membershipLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (businessError || !business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">Business not found</h1>
          <p className="text-muted-foreground mb-6">
            This business may have been removed or is no longer available.
          </p>
          <Button onClick={() => navigate(-1)}>Go back</Button>
        </div>
      </div>
    );
  }

  const stepConfig = BUSINESS_STEP_CONFIG[step];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[9999] bg-background flex flex-col overflow-hidden pt-safe pb-safe"
        style={{ touchAction: 'pan-y pinch-zoom', overscrollBehavior: 'contain' }}
      >
        {/* Header */}
        <div className="flex-shrink-0">
          <ProfileWizardHeader
            title={stepConfig.title}
            currentStep={step}
            totalSteps={TOTAL_STEPS}
            onBack={handleBack}
            onClose={handleClose}
          />
        </div>

        {/* Progress bar */}
        <ProfileWizardProgress currentStep={step} totalSteps={TOTAL_STEPS} />

        {/* Step content */}
        <main className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
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
        </main>

        {/* Navigation */}
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
      </motion.div>

      {/* Discard changes dialog */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent className="z-[10000] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes aren't saved. Are you sure you want to leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep editing</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmClose} className="rounded-xl">
              Discard
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
