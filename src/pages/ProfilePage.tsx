
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
      <div className="flex flex-col items-center gap-2 pt-8">
        <div className="relative">
          <img
            src={photoPreview || profile.profile_photo_url || '/placeholder.svg'}
            alt="Profile"
            className="w-24 h-24 rounded-full border-4 border-green-600 object-cover"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="absolute bottom-0 right-0 w-8 h-8 opacity-0"
            style={{ cursor: 'pointer' }}
            disabled={uploading}
          />
        </div>
        <div className="text-sm mt-2 text-muted-foreground">Add a golf selfie or round photo</div>
      </div>
      
      {/* Home Golf Club */}
      <div className="mt-6 flex flex-col items-center">
        <div className="flex items-center gap-2">
          <Label className="text-md">Home Club:</Label>
          {editingClub ? (
            <>
              <Input
                value={clubInput}
                onChange={e => setClubInput(e.target.value)}
                className="max-w-xs"
              />
              <Button size="sm" onClick={saveHomeClub}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingClub(false)}>Cancel</Button>
            </>
          ) : (
            <>
              <span className="font-semibold px-2">{profile.home_club || "Not set"}</span>
              <Button variant="ghost" size="sm" onClick={() => setEditingClub(true)}>Edit</Button>
            </>
          )}
        </div>
      </div>

      {/* EG App Integration */}
      <div className="mt-8 px-2">
        <h2 className="text-lg font-semibold mb-2">EG (England Golf) App</h2>
        <div className="bg-muted rounded-lg px-4 py-3 text-sm text-muted-foreground">
          <span>Connect your England Golf app to display your Handicap Index and recent rounds here.</span>
        </div>
        {profile.eg_app_connected && (
          <div>
            <div className="mt-2">Handicap Index: <span className="font-bold">{profile.eg_handicap_index}</span></div>
            {/* Display recent rounds if available */}
            <div className="mt-1 text-muted-foreground">
              Recent Rounds: {(profile.eg_recent_rounds && Array.isArray(profile.eg_recent_rounds)) ? 
                profile.eg_recent_rounds.slice(0,3).map((r,i) => <div key={i}>{JSON.stringify(r)}</div>) : "N/A"}
            </div>
          </div>
        )}
      </div>

      {/* What's in the Bag */}
      {user && <BagManager userId={user.id} />}

      {/* Top 100 Courses Tracker */}
      <div className="mt-10 px-2">
        <h2 className="text-lg font-semibold mb-3">Top 100 Courses Tracker</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {courseCategories.map(cat => {
            const played = trackerStats[cat.key] || 0;
            const total = totalStats[cat.key] || 100;
            const percentage = Math.round((played / total) * 100);
            return (
              <div key={cat.key} className="bg-muted/70 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{cat.label}</span>
                  <span className="text-xs font-semibold">{played} / {total}</span>
                </div>
                <Progress value={percentage} className="mt-2" />
                <div className="mt-2 text-xs text-muted-foreground">{percentage}% completed</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
