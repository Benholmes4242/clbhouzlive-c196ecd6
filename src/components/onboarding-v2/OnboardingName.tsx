import React from 'react';
import { AuthTextField, AuthPrimaryButton } from '@/components/auth-v2';
import type { OnboardingData } from '@/pages/OnboardingV2';

interface OnboardingNameProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  saveProgress: (updates: Partial<OnboardingData>) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

/**
 * B1 - Name Step
 * Collects first and last name
 */
const OnboardingName: React.FC<OnboardingNameProps> = ({
  data,
  updateData,
  saveProgress,
  onNext,
}) => {
  const canContinue = data.firstName.trim().length >= 2 && data.lastName.trim().length >= 2;

  const handleNext = async () => {
    await saveProgress({ firstName: data.firstName, lastName: data.lastName });
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col px-6 pt-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Let's set up your profile
        </h1>
        <p className="text-white/50">
          Tell us your name so other golfers can find you.
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-4 flex-1">
        <AuthTextField
          label="First name"
          placeholder="Enter your first name"
          value={data.firstName}
          onChange={(e) => updateData({ firstName: e.target.value })}
          autoFocus
        />

        <AuthTextField
          label="Last name"
          placeholder="Enter your last name"
          value={data.lastName}
          onChange={(e) => updateData({ lastName: e.target.value })}
        />
      </div>

      {/* CTA */}
      <div className="py-6">
        <AuthPrimaryButton
          onClick={handleNext}
          disabled={!canContinue}
        >
          Next
        </AuthPrimaryButton>
      </div>
    </div>
  );
};

export default OnboardingName;
