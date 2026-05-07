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
import WhsConnectScreen from '@/components/profile/handicap/whs/WhsConnectScreen';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AccountType = 'individual' | 'club' | 'brand' | 'creator';
type Gender = 'male' | 'female' | 'prefer_not_to_say';
type OnboardingStep = 'account-type' | 'demographics' | 'college' | 'england-golf';

const ONBOARDING_COUNTRIES = [
  'England',
  'Scotland',
  'Wales',
  'Northern Ireland',
  'Ireland',
  'United States',
  'Canada',
  'Australia',
  'New Zealand',
  '──────────',
  'Argentina',
  'Austria',
  'Belgium',
  'Brazil',
  'Chile',
  'China',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hong Kong',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Italy',
  'Japan',
  'Latvia',
  'Lithuania',
  'Luxembourg',
  'Malaysia',
  'Malta',
  'Mexico',
  'Netherlands',
  'Norway',
  'Philippines',
  'Poland',
  'Portugal',
  'Romania',
  'Saudi Arabia',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'South Africa',
  'South Korea',
  'Spain',
  'Sweden',
  'Switzerland',
  'Taiwan',
  'Thailand',
  'Turkey',
  'United Arab Emirates',
  'Vietnam',
  'Other',
] as const;

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
  const [gender, setGender] = useState<Gender | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useSupabaseSession();
  const navigate = useNavigate();

  useHideBottomNav();
  useHideHeader();

  const handleAccountTypeContinue = () => {
    if (!selectedType) return;
    setStep('demographics');
  };

  const handleDemographicsContinue = () => {
    if (!gender || !country) return;
    if (selectedType === 'individual') {
      setStep('college');
    } else {
      setStep('england-golf');
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

      if (gender) updateData.gender = gender;
      if (country) updateData.country = country;

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
        toast.success('Profile created');
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
    if (step === 'demographics') {
      setStep('account-type');
    } else if (step === 'college') {
      setStep('demographics');
    } else if (step === 'england-golf') {
      setStep(selectedType === 'individual' ? 'college' : 'demographics');
    }
  };

  // Demographics step (all account types)
  if (step === 'demographics') {
    return (
      <PageRoot className="min-h-screen bg-background flex flex-col">
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

        <main className="flex-1 px-4 md:container md:mx-auto py-8 max-w-lg">
          <div className="space-y-6">
            <button
              onClick={handleBack}
              disabled={submitting}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Tell us a bit about yourself
              </h1>
              <p className="text-muted-foreground">
                We use this for fair peer comparisons and country leaderboards. You can change it later in Settings.
              </p>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Gender *</Label>
              <RadioGroup
                value={gender ?? ''}
                onValueChange={(v) => setGender(v as Gender)}
                className="grid grid-cols-1 gap-2"
              >
                {[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    htmlFor={`gender-${opt.value}`}
                    className={`flex items-center gap-3 p-3 rounded-sq-md border-2 cursor-pointer transition-colors ${
                      gender === opt.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/30'
                    }`}
                  >
                    <RadioGroupItem id={`gender-${opt.value}`} value={opt.value} />
                    <span className="text-sm text-foreground">{opt.label}</span>
                  </label>
                ))}
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Selecting "Prefer not to say" will exclude you from the peer comparison feature.
              </p>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Country *</Label>
              <Select value={country ?? ''} onValueChange={(v) => setCountry(v || null)}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {ONBOARDING_COUNTRIES.map((c) =>
                    c === '──────────' ? (
                      <div
                        key="sep"
                        className="my-1 h-px bg-border mx-2"
                        aria-hidden="true"
                      />
                    ) : (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleDemographicsContinue}
                disabled={!gender || !country || submitting}
                className="w-full"
                variant="gradient-primary"
                size="lg"
              >
                Continue
              </Button>
            </div>
          </div>
        </main>
      </PageRoot>
    );
  }


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
                onClick={() => setStep('england-golf')}
                disabled={submitting}
                className="w-full"
                variant="gradient-primary"
                size="lg"
              >
                {selectedCollege ? 'Continue' : 'Skip for now'}
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

  // England Golf connection step (all account types)
  if (step === 'england-golf') {
    return (
      <PageRoot className="min-h-screen bg-background flex flex-col">
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

        <main className="flex-1 px-4 md:container md:mx-auto py-4 max-w-lg">
          <button
            onClick={handleBack}
            disabled={submitting}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <WhsConnectScreen
            onConnected={() => handleFinalSubmit()}
            onSkip={() => handleFinalSubmit()}
          />
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
