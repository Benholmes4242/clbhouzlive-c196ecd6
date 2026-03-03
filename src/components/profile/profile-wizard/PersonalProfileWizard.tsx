/**
 * PersonalProfileWizard - 3-step wizard for personal profile editing
 * Follows Post/Review wizard pattern with full-screen immersive experience
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
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
import { VisibilityValue } from '@/components/profile/edit-v2/VisibilityDropdown';

// Wizard components
import { ProfileWizardHeader } from './ProfileWizardHeader';
import { ProfileWizardProgress } from './ProfileWizardProgress';
import { ProfileWizardNavigation } from './ProfileWizardNavigation';
import { PERSONAL_STEP_CONFIG, PersonalWizardStep } from './types';
import { PhotosIdentityStep, GolfInfoStep, AboutPrivacyStep } from './steps';

// Success screen
import { ProfileSuccessScreen } from './ProfileSuccessScreen';

const BIO_MAX_LENGTH = 300;
const TOTAL_STEPS = 3;

interface AdditionalClubChange {
  id: string;
  name: string;
  country: string | null;
}

interface FormData {
  displayName: string;
  username: string;
  homeClub: string;
  homeClubId: string | null;
  collegeNormalized: string | null;
  handicap: string;
  bio: string;
  websites: string[];
  isPublic: boolean;
  homeClubVisibility: VisibilityValue;
  additionalClubsVisibility: VisibilityValue;
  profilePhoto: File | null;
  headerPhoto: File | null;
  profilePhotoPreview: string | null;
  headerPhotoPreview: string | null;
  removeProfilePhoto: boolean;
  removeHeaderPhoto: boolean;
  // Deferred additional club changes
  addedClubs: AdditionalClubChange[];
  removedClubIds: string[];
}

const createInitialFormData = (profile: any): FormData => ({
  displayName: profile?.display_name || '',
  username: profile?.username || '',
  homeClub: profile?.home_club || '',
  homeClubId: profile?.primary_club_id || null,
  collegeNormalized: profile?.college_normalized || null,
  handicap: profile?.eg_handicap_index?.toString() || '',
  bio: profile?.bio || '',
  websites: profile?.websites || [],
  isPublic: profile?.is_public ?? true,
  homeClubVisibility: profile?.home_club_visibility || 'public',
  additionalClubsVisibility: profile?.additional_clubs_visibility || 'followers',
  profilePhoto: null,
  headerPhoto: null,
  profilePhotoPreview: null,
  headerPhotoPreview: null,
  removeProfilePhoto: false,
  removeHeaderPhoto: false,
  addedClubs: [],
  removedClubIds: [],
});

export function PersonalProfileWizard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<PersonalWizardStep>(1);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Determine back destination
  const getBackDestination = () => {
    const state = location.state as { from?: string } | null;
    if (state?.from) return state.from;
    return '/profile';
  };

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const [formData, setFormData] = useState<FormData>(createInitialFormData(null));
  const [initialFormData, setInitialFormData] = useState<FormData | null>(null);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      const initial = createInitialFormData(profile);
      setFormData(initial);
      setInitialFormData(initial);
    }
  }, [profile]);

  const isUsernameSet = profile?.username && profile.username.trim() !== '';

  // Check if form has unsaved changes
  const isDirty = useMemo(() => {
    if (!initialFormData) return false;
    if (formData.displayName !== initialFormData.displayName) return true;
    if (formData.username !== initialFormData.username) return true;
    if (formData.homeClub !== initialFormData.homeClub) return true;
    if (formData.homeClubId !== initialFormData.homeClubId) return true;
    if (formData.collegeNormalized !== initialFormData.collegeNormalized) return true;
    if (formData.handicap !== initialFormData.handicap) return true;
    if (formData.bio !== initialFormData.bio) return true;
    if (formData.isPublic !== initialFormData.isPublic) return true;
    if (formData.homeClubVisibility !== initialFormData.homeClubVisibility) return true;
    if (formData.additionalClubsVisibility !== initialFormData.additionalClubsVisibility) return true;
    if (JSON.stringify(formData.websites) !== JSON.stringify(initialFormData.websites)) return true;
    if (formData.profilePhoto !== null) return true;
    if (formData.headerPhoto !== null) return true;
    if (formData.removeProfilePhoto) return true;
    if (formData.removeHeaderPhoto) return true;
    if (formData.addedClubs.length > 0) return true;
    if (formData.removedClubIds.length > 0) return true;
    return false;
  }, [formData, initialFormData]);

  // Handle field changes
  const handleFieldChange = useCallback((field: string, value: any) => {
    if (field === 'bio' && typeof value === 'string' && value.length > BIO_MAX_LENGTH) {
      return;
    }
    if (field === 'username' && typeof value === 'string') {
      value = value.replace(/\s+/g, '').replace('@', '');  // Preserve case, remove spaces and @
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle visibility changes
  const handleVisibilityChange = useCallback((field: 'homeClubVisibility' | 'additionalClubsVisibility', value: VisibilityValue) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle photo changes
  const handlePhotoChange = useCallback((type: 'profilePhoto' | 'headerPhoto', file: File | null) => {
    const removeKey = type === 'profilePhoto' ? 'removeProfilePhoto' : 'removeHeaderPhoto';
    const previewKey = type === 'profilePhoto' ? 'profilePhotoPreview' : 'headerPhotoPreview';
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        [type]: file,
        [previewKey]: previewUrl,
        [removeKey]: false,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [type]: null,
        [previewKey]: null,
      }));
    }
  }, []);

  // Handle photo removal (sentinel)
  const handlePhotoRemove = useCallback((type: 'profilePhoto' | 'headerPhoto') => {
    const removeKey = type === 'profilePhoto' ? 'removeProfilePhoto' : 'removeHeaderPhoto';
    const previewKey = type === 'profilePhoto' ? 'profilePhotoPreview' : 'headerPhotoPreview';
    setFormData(prev => ({
      ...prev,
      [type]: null,
      [previewKey]: null,
      [removeKey]: true,
    }));
  }, []);

  // Handle deferred additional club add
  const handleAddClubDeferred = useCallback((club: { id: string; name: string; country: string | null }) => {
    setFormData(prev => ({
      ...prev,
      addedClubs: [...prev.addedClubs, club],
      // If it was previously marked for removal, un-remove it
      removedClubIds: prev.removedClubIds.filter(id => id !== club.id),
    }));
  }, []);

  // Handle deferred additional club remove
  const handleRemoveClubDeferred = useCallback((clubId: string) => {
    setFormData(prev => {
      // If it was added in this session, just remove from addedClubs
      const wasAddedThisSession = prev.addedClubs.some(c => c.id === clubId);
      if (wasAddedThisSession) {
        return {
          ...prev,
          addedClubs: prev.addedClubs.filter(c => c.id !== clubId),
        };
      }
      // Otherwise mark for removal
      return {
        ...prev,
        removedClubIds: [...prev.removedClubIds, clubId],
      };
    });
  }, []);

  // Normalize websites
  const normalizeWebsites = useCallback((websites: string[]): string[] => {
    return websites
      .map(url => {
        const trimmed = url.trim();
        if (!trimmed) return '';
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          return `https://${trimmed}`;
        }
        return trimmed;
      })
      .filter(url => url.length > 0);
  }, []);

  // Can proceed to next step
  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        return formData.displayName.trim().length > 0;
      case 2:
        return true; // Golf info is optional
      case 3:
        return true; // Bio and privacy are optional
      default:
        return false;
    }
  }, [step, formData.displayName]);

  // Navigation
  const nextStep = useCallback(() => {
    if (step < TOTAL_STEPS) {
      setStep((s) => (s + 1) as PersonalWizardStep);
    }
  }, [step]);

  const prevStep = useCallback(() => {
    if (step > 1) {
      setStep((s) => (s - 1) as PersonalWizardStep);
    }
  }, [step]);

  // Handle close with confirmation
  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      navigate(getBackDestination());
    }
  }, [isDirty, navigate, getBackDestination]);

  const confirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    navigate(getBackDestination());
  }, [navigate, getBackDestination]);

  // Handle back
  const handleBack = useCallback(() => {
    if (step === 1) {
      handleClose();
    } else {
      prevStep();
    }
  }, [step, handleClose, prevStep]);

  // Save handler
  const handleSubmit = useCallback(async () => {
    if (!user?.id) return;

    if (!formData.displayName.trim()) {
      toast.error('Please add a display name to continue');
      return;
    }

    setSaving(true);

    try {
      const updateData: any = {
        display_name: formData.displayName || null,
        home_club: formData.homeClub || null,
        primary_club_id: formData.homeClubId || null,
        college_normalized: formData.collegeNormalized || null,
        eg_handicap_index: formData.handicap ? parseFloat(formData.handicap) : null,
        bio: formData.bio || null,
        websites: normalizeWebsites(formData.websites),
        is_public: formData.isPublic,
        home_club_visibility: formData.homeClubVisibility,
        additional_clubs_visibility: formData.additionalClubsVisibility,
        updated_at: new Date().toISOString(),
        has_completed_onboarding: true,
      };

      if (!isUsernameSet && formData.username) {
        updateData.username = formData.username;
      }

      // Handle profile photo upload or removal
      if (formData.removeProfilePhoto) {
        updateData.profile_photo_url = null;
      } else if (formData.profilePhoto) {
        const fileExt = formData.profilePhoto.name.split('.').pop();
        const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;
        const uploadResult = await uploadToR2Only(formData.profilePhoto, 'clbhouz-profile-images', fileName);
        if (!uploadResult.success) throw new Error(uploadResult.error || 'Profile photo upload failed');
        updateData.profile_photo_url = uploadResult.publicUrl;
      }

      // Handle header photo upload or removal
      if (formData.removeHeaderPhoto) {
        updateData.header_photo_url = null;
      } else if (formData.headerPhoto) {
        const fileExt = formData.headerPhoto.name.split('.').pop();
        const fileName = `${user.id}/header-${Date.now()}.${fileExt}`;
        const uploadResult = await uploadToR2Only(formData.headerPhoto, 'clbhouz-profile-images', fileName);
        if (!uploadResult.success) throw new Error(uploadResult.error || 'Header photo upload failed');
        updateData.header_photo_url = uploadResult.publicUrl;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Auto-follow cleanup: remove old college follow if changed
      const previousCollege = initialFormData?.collegeNormalized;
      const newCollege = formData.collegeNormalized;

      if (previousCollege && previousCollege !== newCollege) {
        await supabase
          .from('user_followed_colleges')
          .delete()
          .eq('user_id', user.id)
          .eq('normalized_name', previousCollege);
      }

      // Auto-follow the attended college
      if (newCollege) {
        await supabase
          .from('user_followed_colleges')
          .upsert(
            { user_id: user.id, normalized_name: newCollege },
            { onConflict: 'user_id,normalized_name' }
          );
      }

      // Deferred additional club operations
      if (formData.removedClubIds.length > 0) {
        const { error: removeError } = await supabase
          .from('user_home_clubs')
          .delete()
          .eq('user_profile_id', user.id)
          .in('club_id', formData.removedClubIds);
        if (removeError) console.error('Error removing clubs:', removeError);
      }

      if (formData.addedClubs.length > 0) {
        const inserts = formData.addedClubs.map(club => ({
          user_profile_id: user.id,
          club_id: club.id,
        }));
        const { error: addError } = await supabase
          .from('user_home_clubs')
          .upsert(inserts as any, { onConflict: 'user_profile_id,club_id' });
        if (addError) console.error('Error adding clubs:', addError);
      }

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      await queryClient.invalidateQueries({ queryKey: ['home-clubs-map'] });
      await queryClient.invalidateQueries({ queryKey: ['user-home-clubs', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['golfers-filtered'] });
      await queryClient.invalidateQueries({ queryKey: ['search-golfers'] });

      setShowSuccess(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [user?.id, formData, isUsernameSet, normalizeWebsites, queryClient]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (formData.profilePhotoPreview) URL.revokeObjectURL(formData.profilePhotoPreview);
      if (formData.headerPhotoPreview) URL.revokeObjectURL(formData.headerPhotoPreview);
    };
  }, [formData.profilePhotoPreview, formData.headerPhotoPreview]);

  // Handle success actions
  const handleViewProfile = useCallback(() => {
    navigate('/profile');
  }, [navigate]);

  const handleDone = useCallback(() => {
    navigate('/profile');
  }, [navigate]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show success screen
  if (showSuccess) {
    return (
      <ProfileSuccessScreen
        title="Looking good"
        subtitle="Your profile is ready"
        onViewProfile={handleViewProfile}
        onDone={handleDone}
      />
    );
  }

  const stepConfig = PERSONAL_STEP_CONFIG[step];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[9999] bg-background flex flex-col overflow-hidden pt-safe pb-safe"
        style={{ 
          touchAction: 'pan-y pinch-zoom',
          overscrollBehavior: 'contain',
        }}
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
                <PhotosIdentityStep
                  profilePhotoUrl={formData.removeProfilePhoto ? null : profile?.profile_photo_url}
                  headerPhotoUrl={formData.removeHeaderPhoto ? null : profile?.header_photo_url}
                  profilePhotoPreview={formData.profilePhotoPreview}
                  headerPhotoPreview={formData.headerPhotoPreview}
                  onProfilePhotoChange={(file) => handlePhotoChange('profilePhoto', file)}
                  onHeaderPhotoChange={(file) => handlePhotoChange('headerPhoto', file)}
                  onProfilePhotoRemove={() => handlePhotoRemove('profilePhoto')}
                  onHeaderPhotoRemove={() => handlePhotoRemove('headerPhoto')}
                  displayName={formData.displayName}
                  username={formData.username}
                  isUsernameSet={isUsernameSet}
                  onChange={handleFieldChange}
                />
              )}
              {step === 2 && (
                <GolfInfoStep
                  homeClub={formData.homeClub}
                  homeClubId={formData.homeClubId}
                  collegeNormalized={formData.collegeNormalized}
                  handicap={formData.handicap}
                  userId={user?.id}
                  homeClubVisibility={formData.homeClubVisibility}
                  additionalClubsVisibility={formData.additionalClubsVisibility}
                  onChange={handleFieldChange}
                  onVisibilityChange={handleVisibilityChange}
                  addedClubs={formData.addedClubs}
                  removedClubIds={formData.removedClubIds}
                  onAddClub={handleAddClubDeferred}
                  onRemoveClub={handleRemoveClubDeferred}
                />
              )}
              {step === 3 && (
                <AboutPrivacyStep
                  bio={formData.bio}
                  websites={formData.websites}
                  isPublic={formData.isPublic}
                  onBioChange={(value) => handleFieldChange('bio', value)}
                  onWebsitesChange={(websites) => setFormData(prev => ({ ...prev, websites }))}
                  onIsPublicChange={(value) => handleFieldChange('isPublic', value)}
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
          submitLabel="Save Profile"
        />
      </motion.div>

      {/* Close confirmation dialog */}
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

export default PersonalProfileWizard;
