import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

import { AuthProgressBar, LoadingOverlay } from '@/components/auth-v2';
import OnboardingName from '@/components/onboarding-v2/OnboardingName';
import OnboardingCountry from '@/components/onboarding-v2/OnboardingCountry';
import OnboardingClub from '@/components/onboarding-v2/OnboardingClub';
import OnboardingHandicap from '@/components/onboarding-v2/OnboardingHandicap';
import OnboardingDOB from '@/components/onboarding-v2/OnboardingDOB';
import OnboardingPhoto from '@/components/onboarding-v2/OnboardingPhoto';
import OnboardingWelcome from '@/components/onboarding-v2/OnboardingWelcome';

export interface OnboardingData {
  firstName: string;
  lastName: string;
  countryCode: string;
  countryName: string;
  homeClubId: string | null;
  homeClubName: string | null;
  hasHomeClub: boolean;
  handicapIndex: number | null;
  dateOfBirth: Date | null;
  profilePhotoUrl: string | null;
}

const TOTAL_STEPS = 7;

const defaultData: OnboardingData = {
  firstName: '',
  lastName: '',
  countryCode: '',
  countryName: '',
  homeClubId: null,
  homeClubName: null,
  hasHomeClub: true,
  handicapIndex: null,
  dateOfBirth: null,
  profilePhotoUrl: null,
};

/**
 * OnboardingV2 - Premium step-by-step onboarding
 * 
 * B1 - Name
 * B2 - Country
 * B3 - Home Club
 * B4 - Handicap Index
 * B5 - Date of Birth
 * B6 - Profile Photo
 * B7 - Welcome
 */
const OnboardingV2: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSupabaseSession();
  
  useHideBottomNav();
  useHideHeader();

  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
    }
  }, [user, navigate]);

  // Update data helper
  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  // Save progress to database
  const saveProgress = async (updates: Partial<OnboardingData>) => {
    if (!user) return;

    try {
      const profileUpdates: {
        id: string;
        display_name?: string;
        location?: string;
        home_club_id?: string | null;
        home_club?: string | null;
        eg_handicap_index?: number | null;
        profile_photo_url?: string | null;
      } = {
        id: user.id,
      };

      if (updates.firstName !== undefined || updates.lastName !== undefined) {
        const firstName = updates.firstName ?? data.firstName;
        const lastName = updates.lastName ?? data.lastName;
        profileUpdates.display_name = `${firstName} ${lastName}`.trim();
      }

      if (updates.countryCode !== undefined) {
        profileUpdates.location = updates.countryName;
      }

      if (updates.homeClubId !== undefined) {
        profileUpdates.home_club_id = updates.homeClubId;
        profileUpdates.home_club = updates.homeClubName;
      }

      if (updates.handicapIndex !== undefined) {
        profileUpdates.eg_handicap_index = updates.handicapIndex;
      }

      if (updates.profilePhotoUrl !== undefined) {
        profileUpdates.profile_photo_url = updates.profilePhotoUrl;
      }

      await supabase.from('user_profiles').upsert(profileUpdates);
    } catch (err) {
      console.error('Error saving onboarding progress:', err);
    }
  };

  // Navigation
  const goNext = () => {
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await supabase.from('user_profiles').upsert({
        id: user.id,
        has_completed_onboarding: true,
      });
      
      // Support redirect param for deep linking
      const redirectPath = searchParams.get('redirect');
      navigate(redirectPath || '/', { replace: true });
    } catch (err) {
      console.error('Error completing onboarding:', err);
    } finally {
      setLoading(false);
    }
  };

  // Step variants for animation
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const renderStep = () => {
    const commonProps = {
      data,
      updateData,
      saveProgress,
      onNext: goNext,
      onBack: goBack,
    };

    switch (step) {
      case 1:
        return <OnboardingName {...commonProps} />;
      case 2:
        return <OnboardingCountry {...commonProps} />;
      case 3:
        return <OnboardingClub {...commonProps} />;
      case 4:
        return <OnboardingHandicap {...commonProps} />;
      case 5:
        return <OnboardingDOB {...commonProps} />;
      case 6:
        return <OnboardingPhoto {...commonProps} />;
      case 7:
        return (
          <OnboardingWelcome
            data={data}
            onComplete={completeOnboarding}
            onExplore={completeOnboarding}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <LoadingOverlay show={loading} message="Setting up your profile..." />

      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-4 pb-2">
        {/* Back button */}
        <div className="flex items-center justify-between mb-4">
          {step > 1 && step < 7 ? (
            <button
              onClick={goBack}
              className="p-2 -ml-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-10" />
          )}
          
          {/* Logo */}
          <img
            src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
            alt="clbhouz"
            className="h-8 w-auto"
          />
          
          <div className="w-10" />
        </div>

        {/* Progress bar */}
        {step < 7 && (
          <AuthProgressBar currentStep={step} totalSteps={TOTAL_STEPS - 1} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0 flex flex-col"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Safe area padding */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
};

export default OnboardingV2;
