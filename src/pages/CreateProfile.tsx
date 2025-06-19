
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { supabase } from "@/integrations/supabase/client";
import ProfilePhotoUploader from "@/components/profile/ProfilePhotoUploader";
import BasicInfoForm from "@/components/profile/BasicInfoForm";
import GolfInfoForm from "@/components/profile/GolfInfoForm";

const CreateProfile = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    handicap: '',
    favoriteClub: '',
    yearsPlaying: ''
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

  const handlePhotoChange = (file: File | null) => {
    setProfilePhotoFile(file);
    setProfilePhotoPreview(file ? URL.createObjectURL(file) : null);
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

    const { error } = await supabase.from("user_profiles").upsert({
      id: user.id,
      home_club: formData.favoriteClub,
      profile_photo_url: uploadedPhotoUrl,
      // optionally add other profile fields
    });

    setSubmitting(false);

    if (error) {
      alert("Error saving profile.");
      return;
    }

    navigate("/profile");
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
              src="/lovable-uploads/43a9bf96-e341-493d-8d66-06e6c095abba.png"
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <ProfilePhotoUploader
            profilePhotoPreview={profilePhotoPreview}
            uploadingPhoto={uploadingPhoto}
            submitting={submitting}
            onPhotoChange={handlePhotoChange}
          />
          {/* Basic Information */}
          <BasicInfoForm formData={formData} onChange={handleInputChange} />
          {/* Golf Information */}
          <GolfInfoForm
            formData={{
              handicap: formData.handicap,
              favoriteClub: formData.favoriteClub,
              yearsPlaying: formData.yearsPlaying
            }}
            onChange={handleInputChange}
          />
          {/* Submit Button */}
          <div className="pt-6">
            <Button type="submit" className="w-full">
              Create Profile
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateProfile;
