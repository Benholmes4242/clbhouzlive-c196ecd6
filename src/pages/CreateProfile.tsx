
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { supabase } from "@/integrations/supabase/client";
import ProfilePhotoUploader from "@/components/profile/ProfilePhotoUploader";
import BasicInfoForm from "@/components/profile/BasicInfoForm";
import GolfInfoForm from "@/components/profile/GolfInfoForm";
import UserTypeSelector from "@/components/profile/UserTypeSelector";
import BusinessInfoForm from "@/components/profile/BusinessInfoForm";
import SocialLinksForm from "@/components/profile/SocialLinksForm";

const CreateProfile = () => {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<'individual' | 'business'>('individual');
  const [formData, setFormData] = useState({
    // Individual fields
    name: '',
    username: '',
    bio: '',
    location: '',
    handicap: '',
    favoriteClub: '',
    yearsPlaying: '',
    // Business fields
    businessName: '',
    businessType: '',
    contactPersonName: '',
    phone: '',
    websiteUrl: ''
  });
  
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    twitter: '',
    facebook: '',
    website: ''
  });

  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Profile photo state
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: value }));
  };

  const handlePhotoChange = (file: File | null) => {
    setProfilePhotoFile(file);
    setProfilePhotoPreview(file ? URL.createObjectURL(file) : null);
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

    let uploadedPhotoUrl: string | null = null;
    if (profilePhotoFile) {
      setUploadingPhoto(true);
      const ext = profilePhotoFile.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, profilePhotoFile, { upsert: true });
      if (uploadError) {
        alert("Failed to upload profile photo.");
        setUploadingPhoto(false);
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      uploadedPhotoUrl = urlData?.publicUrl ?? null;
      setUploadingPhoto(false);
    }

    // Prepare profile data based on user type
    const profileData: any = {
      id: user.id,
      user_type: userType === 'individual' ? 'individual' : 'club',
      profile_photo_url: uploadedPhotoUrl,
      bio: formData.bio,
      location: formData.location,
    };

    if (userType === 'individual') {
      profileData.display_name = formData.name;
      profileData.username = formData.username;
      profileData.home_club = formData.favoriteClub;
    } else {
      profileData.business_name = formData.businessName;
      profileData.business_type = formData.businessType;
      profileData.contact_person_name = formData.contactPersonName;
      profileData.phone = formData.phone;
      profileData.website_url = formData.websiteUrl;
      profileData.social_links = socialLinks;
    }

    const { error } = await supabase.from("user_profiles").upsert(profileData);

    setSubmitting(false);

    if (error) {
      alert("Error saving profile.");
      return;
    }

    navigate("/profile");
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <UserTypeSelector
            userType={userType}
            onUserTypeChange={setUserType}
          />
        );
      case 2:
        return (
          <ProfilePhotoUploader
            profilePhotoPreview={profilePhotoPreview}
            uploadingPhoto={uploadingPhoto}
            submitting={submitting}
            onPhotoChange={handlePhotoChange}
          />
        );
      case 3:
        return userType === 'individual' ? (
          <BasicInfoForm formData={formData} onChange={handleInputChange} />
        ) : (
          <BusinessInfoForm
            formData={formData}
            onChange={handleInputChange}
            onSelectChange={handleSelectChange}
          />
        );
      case 4:
        return userType === 'individual' ? (
          <GolfInfoForm
            formData={{
              handicap: formData.handicap,
              favoriteClub: formData.favoriteClub,
              yearsPlaying: formData.yearsPlaying
            }}
            onChange={handleInputChange}
          />
        ) : (
          <SocialLinksForm
            socialLinks={socialLinks}
            onChange={handleSocialLinkChange}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Account Type';
      case 2: return 'Profile Photo';
      case 3: return userType === 'individual' ? 'Basic Information' : 'Business Information';
      case 4: return userType === 'individual' ? 'Golf Information' : 'Social Links';
      default: return 'Create Profile';
    }
  };

  const isLastStep = step === 4;
  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return true;
      case 3:
        if (userType === 'individual') {
          return formData.name.trim() !== '';
        } else {
          return formData.businessName.trim() !== '' && 
                 formData.businessType !== '' && 
                 formData.contactPersonName.trim() !== '';
        }
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4">
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
            <div className="w-16" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {step} of 4</span>
            <span className="text-sm font-medium">{getStepTitle()}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(step / 4) * 100}%` }}
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
                variant="outline"
                onClick={handleBack}
                disabled={submitting}
              >
                Back
              </Button>
            )}
            
            {isLastStep ? (
              <Button 
                type="submit" 
                disabled={submitting || !canProceed()}
                className="ml-auto"
              >
                {submitting ? 'Creating Profile...' : 'Create Profile'}
              </Button>
            ) : (
              <Button
                type="button"
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
