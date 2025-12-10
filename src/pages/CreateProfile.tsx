import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { supabase } from "@/integrations/supabase/client";

/**
 * CreateProfile - Personal-only onboarding flow
 * 
 * All new users sign up as personal (golfer) accounts.
 * Business profiles are created later through Edit Profile modal.
 */
const CreateProfile = () => {
  const [step, setStep] = useState(1);
  
  // Personal profile fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [homeClub, setHomeClub] = useState('');
  const [handicap, setHandicap] = useState('');

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

    const profileData = {
      id: user.id,
      profile_type: 'personal' as const,
      display_name: displayName,
      username: username.replace(/\s+/g, '').replace('@', '').toLowerCase(),
      bio: bio || null,
      home_club: homeClub || null,
      eg_handicap_index: handicap ? parseFloat(handicap) : null,
      has_completed_onboarding: true,
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
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="font-display text-xl font-semibold mb-2">Create Your Golf Profile</h2>
              <p className="text-muted-foreground">
                Tell us about yourself to get started on Clbhouz.
              </p>
            </div>
            
            <div className="space-y-4">
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
                  placeholder="Tell others about yourself..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Golf Information</h2>
            <p className="text-muted-foreground text-sm">
              Optional details to connect with other golfers.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="homeClub">Home Club</Label>
                <Input
                  id="homeClub"
                  value={homeClub}
                  onChange={(e) => setHomeClub(e.target.value)}
                  placeholder="Your home golf club"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="handicap">Handicap Index</Label>
                <Input
                  id="handicap"
                  type="number"
                  step="0.1"
                  value={handicap}
                  onChange={(e) => setHandicap(e.target.value)}
                  placeholder="e.g., 12.5"
                />
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Basic Information';
      case 2: return 'Golf Information';
      default: return 'Create Profile';
    }
  };

  const isLastStep = step === 2;
  
  const canProceed = () => {
    switch (step) {
      case 1: {
        const hasName = displayName.trim() !== '';
        const hasUsername = username.trim() !== '';
        return hasName && hasUsername;
      }
      case 2: return true; // Golf info is optional
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
            <span className="text-sm text-muted-foreground">Step {step} of 2</span>
            <span className="text-sm font-medium">{getStepTitle()}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(step / 2) * 100}%` }}
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
