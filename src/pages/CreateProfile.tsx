import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { supabase } from "@/integrations/supabase/client";
import { ProfileType, BusinessCategory } from '@/types/profile';
import { ProfileTypeToggle } from '@/components/profile/ProfileTypeToggle';
import { PersonalFieldsForm } from '@/components/profile/PersonalFieldsForm';
import { BusinessFieldsForm } from '@/components/profile/BusinessFieldsForm';

const CreateProfile = () => {
  const [searchParams] = useSearchParams();
  const initialProfileType = (searchParams.get('profileType') as ProfileType) || 'personal';
  
  const [step, setStep] = useState(1);
  const [profileType, setProfileType] = useState<ProfileType>(initialProfileType);
  
  // Shared fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  
  // Personal fields
  const [homeClub, setHomeClub] = useState('');
  const [handicap, setHandicap] = useState('');
  
  // Business fields
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory | ''>('');
  const [businessLocation, setBusinessLocation] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');
  const [businessContactEmail, setBusinessContactEmail] = useState('');
  const [businessContactPhone, setBusinessContactPhone] = useState('');
  const [businessBio, setBusinessBio] = useState('');

  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Set username from auth metadata on component mount
  useEffect(() => {
    if (user?.user_metadata?.username) {
      setUsername(user.user_metadata.username);
    }
  }, [user]);

  const handleUsernameChange = (value: string) => {
    const cleanedValue = value.replace(/\s+/g, '').replace('@', '').toLowerCase();
    setUsername(cleanedValue);
  };

  const handlePersonalFieldChange = (field: string, value: string) => {
    if (field === 'homeClub') setHomeClub(value);
    if (field === 'handicap') setHandicap(value);
  };

  const handleBusinessFieldChange = (field: string, value: string) => {
    switch (field) {
      case 'businessName': setBusinessName(value); break;
      case 'businessCategory': setBusinessCategory(value as BusinessCategory); break;
      case 'businessLocation': setBusinessLocation(value); break;
      case 'businessWebsite': setBusinessWebsite(value); break;
      case 'businessContactEmail': setBusinessContactEmail(value); break;
      case 'businessContactPhone': setBusinessContactPhone(value); break;
      case 'businessBio': setBusinessBio(value); break;
    }
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!user) {
      alert("You must be logged in to create a profile.");
      setSubmitting(false);
      return;
    }

    const isBusiness = profileType === 'business';

    const profileData: any = {
      id: user.id,
      profile_type: profileType,
      display_name: isBusiness ? businessName : displayName,
      username: username.replace(/\s+/g, '').replace('@', '').toLowerCase(),
      bio: bio || null,
      
      // Personal fields (null for business)
      home_club: isBusiness ? null : (homeClub || null),
      eg_handicap_index: isBusiness ? null : (handicap ? parseFloat(handicap) : null),
      
      // Business fields (null for personal)
      business_name: isBusiness ? businessName : null,
      business_category: isBusiness ? (businessCategory || null) : null,
      business_website: isBusiness ? (businessWebsite || null) : null,
      business_location: isBusiness ? (businessLocation || null) : null,
      business_contact_email: isBusiness ? (businessContactEmail || null) : null,
      business_contact_phone: isBusiness ? (businessContactPhone || null) : null,
      business_bio: isBusiness ? (businessBio || null) : null,
    };

    const { error } = await supabase.from("user_profiles").upsert(profileData);

    setSubmitting(false);

    if (error) {
      console.error('Error creating profile:', error);
      alert("Error saving profile.");
      return;
    }

    navigate("/profile");
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-display text-xl font-semibold mb-2">What type of profile are you creating?</h2>
              <p className="text-muted-foreground">
                Choose how you want to be represented on Clbhouz.
              </p>
            </div>
            
            <div className="flex justify-center">
              <ProfileTypeToggle value={profileType} onChange={setProfileType} />
            </div>

            <div className="text-center text-sm text-muted-foreground">
              {profileType === 'personal' ? (
                <p>Create your personal golf profile to connect with other golfers and track your journey.</p>
              ) : (
                <p>Create a business profile for your golf club, brand, academy, or golf-related business.</p>
              )}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Basic Information</h2>
            
            <div className="space-y-4">
              {profileType === 'personal' && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="username"
                    className="pl-8"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be your unique handle on Clbhouz.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={profileType === 'personal' ? "Tell others about yourself..." : "A quick intro about your business..."}
                  rows={3}
                />
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold">
              {profileType === 'personal' ? 'Golf Information' : 'Business Details'}
            </h2>
            
            {profileType === 'personal' ? (
              <PersonalFieldsForm
                homeClub={homeClub}
                handicap={handicap}
                onChange={handlePersonalFieldChange}
              />
            ) : (
              <BusinessFieldsForm
                businessName={businessName}
                businessCategory={businessCategory}
                businessLocation={businessLocation}
                businessWebsite={businessWebsite}
                businessContactEmail={businessContactEmail}
                businessContactPhone={businessContactPhone}
                businessBio={businessBio}
                onChange={handleBusinessFieldChange}
              />
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Profile Type';
      case 2: return 'Basic Information';
      case 3: return profileType === 'personal' ? 'Golf Information' : 'Business Details';
      default: return 'Create Profile';
    }
  };

  const isLastStep = step === 3;
  
  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: {
        const hasName = profileType === 'personal' ? displayName.trim() !== '' : true;
        const hasUsername = username.trim() !== '';
        return hasName && hasUsername;
      }
      case 3: {
        if (profileType === 'business') {
          return businessName.trim() !== '' && businessCategory !== '';
        }
        return true;
      }
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative z-50 bg-white border-b border-border">
        <div className="px-4 md:container md:mx-auto md:px-0">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </Link>
            <img
              src="/lovable-uploads/b3fc8551-2b91-49af-b2ef-1dd493276207.png"
              alt="clbhouz Logo"
              className="w-auto"
              style={{
                display: "block",
                maxHeight: "56px",
                maxWidth: 160,
                objectFit: "contain"
              }}
            />
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="px-4 md:container md:mx-auto md:px-0 py-6 max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {step} of 3</span>
            <span className="text-sm font-medium">{getStepTitle()}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderStep()}
          
          {/* Navigation buttons */}
          <div className="flex justify-between pt-6">
            {step > 1 && (
              <Button
                type="button"
                variant="gradient"
                onClick={handleBack}
                disabled={submitting}
              >
                Back
              </Button>
            )}
            
            {isLastStep ? (
              <Button 
                type="submit" 
                variant="gradient-primary"
                disabled={submitting || !canProceed()}
                className="ml-auto"
              >
                {submitting ? 'Creating Profile...' : 'Create Profile'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="gradient-primary"
                onClick={handleNext}
                disabled={!canProceed()}
                className="ml-auto"
              >
                Next
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateProfile;
