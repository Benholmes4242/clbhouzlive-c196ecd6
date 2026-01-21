/**
 * Profile Wizard Types
 * Shared types for personal and business profile wizards
 */

export type PersonalWizardStep = 1 | 2 | 3;
export type BusinessWizardStep = 1 | 2 | 3;

export interface ProfileWizardHeaderProps {
  title: string;
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onClose: () => void;
}

export interface ProfileWizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitLabel?: string;
}

export interface ProfileWizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

// Personal profile step configs
export const PERSONAL_STEP_CONFIG = {
  1: {
    title: 'Your Profile',
    subtitle: 'Add your photo and name',
  },
  2: {
    title: 'Golf Info',
    subtitle: 'Your home club and handicap',
  },
  3: {
    title: 'About You',
    subtitle: 'Bio and privacy settings',
  },
} as const;

// Business profile step configs
export const BUSINESS_STEP_CONFIG = {
  1: {
    title: 'Business Info',
    subtitle: 'Category and details',
  },
  2: {
    title: 'Location & Contact',
    subtitle: 'Where to find you',
  },
  3: {
    title: 'Branding',
    subtitle: 'Logo and cover photo',
  },
} as const;
