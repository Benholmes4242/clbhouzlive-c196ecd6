import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import BagManager from '@/components/BagManager';
import Header from "@/components/Header";
import ProfileHeader from "@/components/profile/ProfileHeader";
import EGAppIntegration from "@/components/profile/EGAppIntegration";
import CourseTracker from "@/components/profile/CourseTracker";
import BottomNavigation from '@/components/BottomNavigation';
import ProfileEditDialog from '@/components/profile/ProfileEditDialog';

type Profile = {
  id: string;
  profile_photo_url: string | null;
  home_club: string | null;
  eg_app_connected: boolean | null;
  eg_handicap_index: number | null;
  eg_recent_rounds: any | null;
  bag_visible: boolean | null;
  tracker_visible: boolean | null;
  eg_visible: boolean | null;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

const ProfilePage = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [trackerStats, setTrackerStats] = useState<{ [cat: string]: number }>({});
  const [totalStats, setTotalStats] = useState<{ [cat: string]: number }>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
      if (data?.user) {
        fetchProfile(data.user.id);
        fetchTrackerStats(data.user.id);
      } else {
        setProfile(null);
        setTrackerStats({});
        setTotalStats({});
        setLoading(false);
      }
    });
  }, []);

  const fetchProfile = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase.from('user_profiles').select('*').eq('id', id).maybeSingle();
    if (!error && data) {
      setProfile(data as Profile);
    } else {
      setProfile(null);
    }
    setLoading(false);
  };

  const fetchTrackerStats = async (userId: string) => {
    let stats: { [cat: string]: number } = {};
    let totals: { [cat: string]: number } = {};
    
    const { data } = await supabase
      .from('user_courses')
      .select('course_id, played')
      .eq('user_id', userId)
      .eq('played', true);
    
    if (data) {
      // For now, we'll count all played courses for each category
      // In the future, you might want to categorize courses by region
      ['GB&I', 'Europe', 'USA', 'Global'].forEach((cat) => {
        stats[cat] = data.length; // This is simplified - you'd want to filter by region
        totals[cat] = 100;
      });
    }
    setTrackerStats(stats);
    setTotalStats(totals);
  };

  const handleTrackerVisibilityToggle = async (checked: boolean) => {
    if (!user) return;
    await supabase
      .from("user_profiles")
      .update({ tracker_visible: checked })
      .eq("id", user.id);
    setProfile(prev => prev ? { ...prev, tracker_visible: checked } : prev);
  };

  const handleEGVisibilityToggle = async (checked: boolean) => {
    if (!user) return;
    // Use a more flexible approach for the update to avoid TypeScript issues
    const updateData: any = { eg_visible: checked };
    await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("id", user.id);
    setProfile(prev => prev ? { ...prev, eg_visible: checked } : prev);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const tempPreviewUrl = URL.createObjectURL(file);
    setPhotoPreview(tempPreviewUrl);

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const filePath = `${user.id}/avatar-${timestamp}.${fileExt}`;

    let { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: false });
    if (error) {
      alert('Upload failed!');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    let avatarUrl = urlData?.publicUrl ?? '';
    setPhotoPreview(avatarUrl);
    await supabase.from('user_profiles').update({ profile_photo_url: avatarUrl, updated_at: new Date().toISOString() }).eq('id', user.id);
    setProfile((p) => p ? { ...p, profile_photo_url: avatarUrl } : p);
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-muted-foreground text-base">Loading profile...</span>
      </div>
    );
  }

  const canEditAvatar = !!user;

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />
      <div className="max-w-2xl mx-auto px-4">
        <ProfileHeader
          photoPreview={photoPreview}
          profilePhotoUrl={profile?.profile_photo_url ?? ""}
          uploading={uploading}
          handlePhotoUpload={handlePhotoUpload}
          canEdit={canEditAvatar}
        />
        
        {/* Profile Info Section */}
        <div className="flex flex-col items-center mt-6 space-y-3">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold">
              {profile?.display_name || profile?.username || user?.email || "Anonymous User"}
            </h1>
            <p className="text-muted-foreground">London, England, United Kingdom</p>
            <p className="text-sm">
              <span>Home Club:</span> {profile?.home_club || "Not set"}
            </p>
            <p className="text-sm">
              <span>Handicap:</span> {profile?.eg_handicap_index || "Not set"}
            </p>
          </div>
          
          {user && (
            <ProfileEditDialog
              profile={profile}
              userId={user.id}
              onProfileUpdate={() => fetchProfile(user.id)}
            />
          )}
        </div>

        <EGAppIntegration
          egAppConnected={profile?.eg_app_connected ?? false}
          handicapIndex={profile?.eg_handicap_index ?? null}
          recentRounds={profile?.eg_recent_rounds ?? null}
          userId={user?.id}
          isOwnProfile={!!user}
          egVisible={profile?.eg_visible ?? true}
          onVisibilityToggle={handleEGVisibilityToggle}
        />
        
        {user && (
          <BagManager 
            userId={user.id} 
            isOwnProfile={true}
            bagVisible={profile?.bag_visible ?? true}
          />
        )}
        
        <CourseTracker 
          trackerStats={trackerStats} 
          totalStats={totalStats}
          userId={user?.id}
          isOwnProfile={!!user}
          trackerVisible={profile?.tracker_visible ?? true}
          onVisibilityToggle={handleTrackerVisibilityToggle}
          onTrackerUpdate={() => fetchTrackerStats(user?.id || "")}
        />
      </div>
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
