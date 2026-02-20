import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { Button } from '@/components/ui/button';
import { User, Building2, Megaphone, Sparkles, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PageRoot } from '@/components/layout/PageRoot';
import CollegeSearchDropdown from '@/components/profile/CollegeSearchDropdown';
import { CollegeMediaResult } from '@/hooks/useCollegeMediaSearch';

type AccountType = 'individual' | 'club' | 'brand' | 'creator';
type OnboardingStep = 'account-type' | 'college';

interface AccountOption {
  type: AccountType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const ACCOUNT_OPTIONS: AccountOption[] = [
  {
    type: 'individual',
    label: 'Golfer',
    description: 'For everyday golfers using Clbhouz.',
    icon: <User className="w-6 h-6" />,
  },
  {
    type: 'club',
    label: 'Golf Club',
    description: 'For golf clubs and courses.',
    icon: <Building2 className="w-6 h-6" />,
  },
  {
    type: 'brand',
    label: 'Brand',
    description: 'For golf brands and businesses.',
    icon: <Megaphone className="w-6 h-6" />,
  },
  {
    type: 'creator',
    label: 'Creator / Pro',
    description: 'For content creators and golf professionals.',
    icon: <Sparkles className="w-6 h-6" />,
  },
];

const AccountTypeOnboarding: React.FC = () => {
  const [step, setStep] = useState<OnboardingStep>('account-type');
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<CollegeMediaResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useSupabaseSession();
  const navigate = useNavigate();

  useHideBottomNav();
  useHideHeader();

  const handleAccountTypeContinue = () => {
    if (!selectedType) return;
    
    // For individual accounts, show college step
    if (selectedType === 'individual') {
      setStep('college');
    } else {
      // For other account types, complete onboarding directly
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedType || !user) return;

    setSubmitting(true);
    try {
      const updateData: any = {
        user_type: selectedType,
        has_completed_onboarding: true,
      };

      // Add college if selected (only for individual accounts)
      if (selectedType === 'individual' && selectedCollege) {
        updateData.college_normalized = selectedCollege.normalized_name;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Auto-follow the attended college
      if (selectedType === 'individual' && selectedCollege) {
        await supabase
          .from('user_followed_colleges')
          .upsert(
            { user_id: user.id, normalized_name: selectedCollege.normalized_name },
            { onConflict: 'user_id,normalized_name' }
          );
      }

      // Show appropriate success message
      if (selectedType === 'individual' && selectedCollege) {
        toast.success('College badge added');
      } else {
        toast.success('Profile set up successfully!');
      }
      
      // Navigate to profile page
      navigate('/profile', { replace: true });
    } catch (error) {
      console.error('Error saving account type:', error);
      toast.error('Failed to save account type. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'college') {
      setStep('account-type');
    }
  };

  // College selection step (for individual accounts)
  if (step === 'college') {
    return (
      <PageRoot className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 md:container md:mx-auto">
            <div className="flex items-center justify-center h-16">
              <img
                src="/lovable-uploads/b3fc8551-2b91-49af-b2ef-1dd493276207.png"
                alt="clbhouz Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 md:container md:mx-auto py-8 max-w-lg">
          <div className="space-y-6">
            {/* Back button */}
            <button
              onClick={handleBack}
              disabled={submitting}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Did you play college golf?
              </h1>
              <p className="text-muted-foreground">
                Add your college to connect with alumni and show your affiliation.
              </p>
            </div>

            {/* College search dropdown */}
            <div className="pt-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                College <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <CollegeSearchDropdown
                value={selectedCollege}
                onChange={setSelectedCollege}
                placeholder="Start typing your college…"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-6 space-y-3">
              <Button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="w-full"
                variant="gradient-primary"
                size="lg"
              >
                {submitting ? 'Setting up...' : selectedCollege ? 'Continue' : 'Skip for now'}
              </Button>
              
              {!selectedCollege && (
                <p className="text-xs text-muted-foreground text-center">
                  You can add this later in Edit Profile.
                </p>
              )}
            </div>
          </div>
        </main>
      </PageRoot>
    );
  }

  // Account type selection step
  return (
    <PageRoot className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 md:container md:mx-auto">
          <div className="flex items-center justify-center h-16">
            <img
              src="/lovable-uploads/b3fc8551-2b91-49af-b2ef-1dd493276207.png"
              alt="clbhouz Logo"
              className="h-10 w-auto object-contain"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 md:container md:mx-auto py-8 max-w-lg">
        <div className="space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              What type of account are you creating?
            </h1>
            <p className="text-muted-foreground">
              This helps us set up the right profile for you.
            </p>
          </div>

          {/* Account type cards */}
          <div className="space-y-3 pt-4">
            {ACCOUNT_OPTIONS.map((option) => (
              <button
                key={option.type}
                onClick={() => setSelectedType(option.type)}
                disabled={submitting}
                className={`
                  w-full p-4 rounded-sq-lg border-2 transition-all duration-200
                  flex items-start gap-4 text-left
                  ${selectedType === option.type
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <div className={`
                  p-3 rounded-sq-md transition-colors
                  ${selectedType === option.type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{option.label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                </div>
                {/* Selection indicator */}
                <div className={`
                  w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 transition-all
                  ${selectedType === option.type
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/30'
                  }
                `}>
                  {selectedType === option.type && (
                    <svg className="w-full h-full text-primary-foreground" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Continue button */}
          <div className="pt-4">
            <Button
              onClick={handleAccountTypeContinue}
              disabled={!selectedType || submitting}
              className="w-full"
              variant="gradient-primary"
              size="lg"
            >
              {submitting ? 'Setting up...' : 'Continue'}
            </Button>
          </div>
        </div>
      </main>
    </PageRoot>
  );
};

export default AccountTypeOnboarding;
