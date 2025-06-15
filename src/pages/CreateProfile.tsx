import React, { useState } from 'react';
import { ArrowLeft, Camera, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // Needed for saving to DB

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!user) {
      alert("You must be logged in to create a profile.");
      setSubmitting(false);
      return;
    }
    // Minimal: insert profile into user_profiles table
    const { error } = await supabase.from("user_profiles").upsert({
      id: user.id,
      home_club: formData.favoriteClub,
      // add other profile fields as needed
      // e.g.: bio: formData.bio, username: formData.username, etc.
    });

    setSubmitting(false);

    if (error) {
      alert("Error saving profile.");
      return;
    }

    navigate("/profile"); // Redirect to main profile page after creation
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
            <h1 className="text-lg font-semibold">Create Profile</h1>
            <div className="w-16" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 bg-muted border-2 border-dashed border-amber-700 rounded-full flex items-center justify-center">
                <Camera className="h-8 w-8 text-amber-700" />
              </div>
              <Button
                type="button"
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Add profile photo</p>
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
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, State"
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
              
              <div>
                <Label htmlFor="yearsPlaying">Years Playing</Label>
                <Input
                  id="yearsPlaying"
                  name="yearsPlaying"
                  value={formData.yearsPlaying}
                  onChange={handleInputChange}
                  placeholder="e.g., 5"
                  type="number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="favoriteClub">Favorite Golf Club/Course</Label>
              <Input
                id="favoriteClub"
                name="favoriteClub"
                value={formData.favoriteClub}
                onChange={handleInputChange}
                placeholder="Where do you love to play?"
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
