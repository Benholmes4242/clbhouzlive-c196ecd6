import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Compass } from 'lucide-react';
import { AuthPrimaryButton, AuthSecondaryButton } from '@/components/auth-v2';
import type { OnboardingData } from '@/pages/OnboardingV2';

interface OnboardingWelcomeProps {
  data: OnboardingData;
  onComplete: () => void;
  onExplore: () => void;
}

/**
 * B7 - Welcome / Final Step
 * Celebration screen with CTAs
 */
const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({
  data,
  onComplete,
  onExplore,
}) => {
  const firstName = data.firstName || 'Golfer';

  return (
    <div className="flex-1 flex flex-col px-6 pt-8">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Animated icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.2 
          }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center mb-8"
        >
          <Sparkles className="w-12 h-12 text-white" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-white mb-3"
        >
          Welcome to Clbhouz
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-white/60 text-lg mb-2"
        >
          Your profile is ready, {firstName}.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-white/40 text-sm"
        >
          Share your golf moments and connect with golfers worldwide.
        </motion.p>

        {/* Profile preview */}
        {data.profilePhotoUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 mx-auto">
              <img
                src={data.profilePhotoUrl}
                alt="Your profile"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-white font-medium mt-3">
              {data.firstName} {data.lastName}
            </p>
            {data.homeClubName && (
              <p className="text-white/50 text-sm">{data.homeClubName}</p>
            )}
          </motion.div>
        )}
      </div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="py-6 space-y-3"
      >
        <AuthPrimaryButton onClick={onComplete}>
          <Sparkles className="w-5 h-5" />
          Share your first moment
        </AuthPrimaryButton>
        
        <AuthSecondaryButton onClick={onExplore}>
          <Compass className="w-5 h-5" />
          Explore first
        </AuthSecondaryButton>
      </motion.div>
    </div>
  );
};

export default OnboardingWelcome;
