import { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useProfileData } from '@/hooks/useProfileData';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileForm } from '@/hooks/useProfileForm';
import { useProfileSave } from '@/hooks/useProfileSave';
import { supabase } from '@/integrations/supabase/client';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { WizardHeader } from './WizardHeader';
import { WizardProgress } from './WizardProgress';
import { WizardNavigation } from './WizardNavigation';
import { WizardSuccessScreen } from './WizardSuccessScreen';
import { PhotosIdentityStep } from './steps/PhotosIdentityStep';
import { GolfInfoStep } from './steps/GolfInfoStep';
import { AboutStep } from './steps/AboutStep';
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
import type { WizardStep, WizardDirection } from './types';

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

export function PersonalProfileWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const { profile, loading } = useProfileData();

  const [step, setStep] = useState<WizardStep>(1);
  const [direction, setDirection] = useState<WizardDirection>('forward');
  const [showDiscard, setShowDiscard] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    form, setField, isDirty, errors, isValid,
    addWebsite, removeWebsite, updateWebsite,
    addClub, removeClub,
  } = useProfileForm(profile, loading);

  const { save, isSaving } = useProfileSave(user?.id ?? '');

  const usernameIsLocked = !!(profile as any)?.has_completed_onboarding || !!(profile as any)?.username;
  
  // Fix 2: Detect new user at mount time (before wizard changes onboarding status)
  const isNewUser = useRef(!(profile as any)?.has_completed_onboarding);

  const goNext = useCallback(() => {
    if (step < 3) {
      setDirection('forward');
      setStep((s) => (s + 1) as WizardStep);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 1) {
      setDirection('back');
      setStep((s) => (s - 1) as WizardStep);
    }
  }, [step]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowDiscard(true);
    } else {
      navigate(-1);
    }
  }, [isDirty, navigate]);

  // Fix 3: Skip button handler
  const handleSkip = useCallback(async () => {
    if (!user?.id) return;
    await supabase
      .from('user_profiles')
      .update({ has_completed_onboarding: true })
      .eq('id', user.id);
    // FIX I5: Invalidate onboarding cache so AuthWrapper doesn't re-route
    queryClient.invalidateQueries({ queryKey: ['onboarding-status', user.id] });
    navigate('/', { replace: true });
  }, [user, navigate, queryClient]);

  const handleSave = useCallback(async () => {
    if (step < 3) {
      analyticsEvents.track('onboarding_step_completed', {
        step,
        has_photo: !!(form.profilePhotoBlob || form.profilePhotoUrl),
        has_home_club: !!form.homeClubName,
        has_display_name: !!form.displayName,
      });
      goNext();
      return;
    }
    const ok = await save(form);
    if (ok) {
      analyticsEvents.track('onboarding_completed', {
        has_photo: !!(form.profilePhotoBlob || form.profilePhotoUrl),
        has_home_club: !!form.homeClubName,
        has_bio: !!form.bio,
        has_handicap: form.handicapIndex != null,
      });
      setShowSuccess(true);
    }
  }, [step, form, save, goNext]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] flex flex-col bg-background">
        <WizardHeader
          step={step}
          isFirstStep={step === 1}
          onBack={goBack}
          onClose={handleClose}
          onSkip={isNewUser.current ? handleSkip : undefined}
        />
        <WizardProgress step={step} />

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
                <PhotosIdentityStep
                  form={form}
                  usernameIsLocked={usernameIsLocked}
                  displayNameError={errors.displayName}
                  onFieldChange={setField}
                />
              )}
              {step === 2 && (
                <GolfInfoStep
                  form={form}
                  onFieldChange={setField}
                  onAddClub={addClub}
                  onRemoveClub={removeClub}
                />
              )}
              {step === 3 && (
                <AboutStep
                  form={form}
                  errors={errors}
                  onFieldChange={setField}
                  onAddWebsite={addWebsite}
                  onRemoveWebsite={removeWebsite}
                  onUpdateWebsite={updateWebsite}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <WizardNavigation
          step={step}
          isSaving={isSaving}
          isValid={isValid}
          isDirty={isDirty}
          onNext={handleSave}
          onBack={goBack}
        />
      </div>

      <AlertDialog open={showDiscard} onOpenChange={setShowDiscard}>
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
              onClick={() => navigate(-1)}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showSuccess && (
        <WizardSuccessScreen username={(profile as any)?.username ?? ''} isNewUser={isNewUser.current} />
      )}
    </>,
    document.body
  );
}

export default PersonalProfileWizard;
