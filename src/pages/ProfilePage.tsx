import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import BagManager from '@/components/BagManager';

type Profile = {
  id: string;
  profile_photo_url: string | null;
  home_club: string | null;
  eg_app_connected: boolean | null;
  eg_handicap_index: number | null;
  eg_recent_rounds: any | null;
};

const courseCategories = [
  { key: 'GB&I', label: 'Top 100 GB & Ireland' },
  { key: 'Europe', label: 'Top 100 Europe' },
  { key: 'USA', label: 'Top 100 USA' },
  { key: 'Global', label: 'Top 100 Global' },
];

import ProfileHeader from "@/components/profile/ProfileHeader";
import HomeClubSection from "@/components/profile/HomeClubSection";
import EGAppIntegration from "@/components/profile/EGAppIntegration";
import CourseTracker from "@/components/profile/CourseTracker";

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingClub, setEditingClub] = useState(false);
  const [clubInput, setClubInput] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [trackerStats, setTrackerStats] = useState<{ [cat: string]: number }>({});
  const [totalStats, setTotalStats] = useState<{ [cat: string]: number }>({});
  const navigate = useNavigate();

  // Init: fetch user session+profile
  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        navigate('/auth');
        return;
      }
      setUser(data.user);
      fetchProfile(data.user.id);
      fetchTrackerStats(data.user.id);
    });
  }, []);

  // Fetch profile info
  const fetchProfile = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase.from('user_profiles').select('*').eq('id', id).maybeSingle();
    if (!error && data) {
      setProfile(data);
      setClubInput(data.home_club ?? '');
    }
    setLoading(false);
  };

  // Fetch tracker stats
  const fetchTrackerStats = async (userId: string) => {
    let stats: { [cat: string]: number } = {};
    let totals: { [cat: string]: number } = {};
    const { data, error } = await supabase.from('user_course_tracker').select('course_id, checked');
    if (data) {
      ['GB&I', 'Europe', 'USA', 'Global'].forEach((cat) => {
        stats[cat] = data.filter(row => !!row.checked).length;
        totals[cat] = 100;
      });
    }
    setTrackerStats(stats);
    setTotalStats(totals);
  };

  // Upload photo
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) {
      alert('Upload failed!');
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const avatarUrl = urlData?.publicUrl ?? '';
    await supabase.from('user_profiles').update({ profile_photo_url: avatarUrl, updated_at: new Date().toISOString() }).eq('id', user.id);
    setPhotoPreview(avatarUrl);
    setProfile(p => p ? { ...p, profile_photo_url: avatarUrl } : p);
    setUploading(false);
  };

  // Home club editing logic
  const saveHomeClub = async () => {
    if (!user) return;
    await supabase.from('user_profiles').update({ home_club: clubInput, updated_at: new Date().toISOString() }).eq('id', user.id);
    setProfile(p => p ? { ...p, home_club: clubInput } : p);
    setEditingClub(false);
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-muted-foreground text-base">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 max-w-2xl mx-auto px-4">
      {/* Profile Header */}
      <ProfileHeader
        photoPreview={photoPreview}
        profilePhotoUrl={profile.profile_photo_url}
        uploading={uploading}
        handlePhotoUpload={handlePhotoUpload}
      />

      {/* Home Golf Club */}
      <HomeClubSection
        editingClub={editingClub}
        clubInput={clubInput}
        homeClub={profile.home_club}
        onEditClick={() => setEditingClub(true)}
        onCancel={() => setEditingClub(false)}
        onInput={e => setClubInput(e.target.value)}
        onSave={saveHomeClub}
        setClubInput={setClubInput}
      />

      {/* EG App Integration */}
      <EGAppIntegration
        egAppConnected={profile.eg_app_connected}
        handicapIndex={profile.eg_handicap_index}
        recentRounds={profile.eg_recent_rounds}
      />

      {/* What's in the Bag */}
      {user && <BagManager userId={user.id} />}

      {/* Top 100 Courses Tracker */}
      <CourseTracker trackerStats={trackerStats} totalStats={totalStats} />
    </div>
  );
};

export default ProfilePage;
