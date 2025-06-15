import React, { useRef, useState } from 'react';
import { ArrowLeft, Camera, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
  
  // New: Profile photo state and ref
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setProfilePhotoFile(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
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

    // Upload the profile photo if one was selected
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

    // Insert or update the user_profiles row (save photo url if exists)
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
              src="/lovable-uploads/51e72efc-b6f0-4596-a139-348c49c1168e.png"
              alt="Members Logo"
              className="w-auto"
              style={{
                display: "block",
                maxHeight: "56px",
                maxWidth: 160,
                objectFit: "contain"
              }}
            />
            <div className="w-16" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center space-y-4">
            <div
              className="relative cursor-pointer group"
              onClick={handlePhotoClick}
              aria-label="Add profile photo"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") handlePhotoClick();
              }}
            >
              <div className="w-24 h-24 bg-muted border-2 border-dashed border-amber-700 rounded-full flex items-center justify-center overflow-hidden">
                {profilePhotoPreview ? (
                  <img
                    src={profilePhotoPreview}
                    alt="Profile preview"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-amber-700" />
                )}
              </div>
              <Button
                type="button"
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 flex items-center justify-center"
                tabIndex={-1}
                onClick={e => {
                  e.stopPropagation();
                  handlePhotoClick();
                }}
                variant="secondary"
              >
                <Upload className="h-4 w-4" />
              </Button>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoChange}
                disabled={submitting || uploadingPhoto}
                tabIndex={-1}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {profilePhotoPreview ? "Change photo" : "Add profile photo"}
            </p>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Choose a username"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself and your golf journey..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="location">City or Country</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City or Country"
              />
            </div>
          </div>

          {/* Golf Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Golf Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="handicap">Handicap</Label>
                <Input
                  id="handicap"
                  name="handicap"
                  value={formData.handicap}
                  onChange={handleInputChange}
                  placeholder="e.g., 15"
                  type="number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="favoriteClub">Home Club/Course</Label>
              <Input
                id="favoriteClub"
                name="favoriteClub"
                value={formData.favoriteClub}
                onChange={handleInputChange}
                placeholder="Your home club or course"
              />
            </div>
          </div>

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
