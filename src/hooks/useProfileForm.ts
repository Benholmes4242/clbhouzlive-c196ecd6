import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ProfileFormData, ClubEntry } from '@/components/profile/profile-wizard/types';
import { nanoid } from 'nanoid';

function makeInitial(profile: any): ProfileFormData {
  const social = profile?.social_links ?? {};

  return {
    displayName: profile?.display_name ?? '',
    username: profile?.username ?? '',
    profilePhotoUrl: profile?.profile_photo_url ?? null,
    headerPhotoUrl: profile?.header_photo_url ?? null,
    profilePhotoBlob: null,
    headerPhotoBlob: null,
    homeClubName: profile?.home_club ?? '',
    primaryClubId: profile?.primary_club_id ?? null,
    additionalClubs: (profile?.additional_clubs ?? []).map((c: any) => ({
      id: nanoid(),
      name: c.name,
      clubId: c.club_id,
    })),
    collegeNormalized: profile?.college_normalized ?? null,
    collegeId: profile?.college_id ?? null,
    handicapIndex: profile?.eg_handicap_index?.toString() ?? '',
    homeClubVisibility: profile?.home_club_visibility ?? 'public',
    additionalClubsVisibility: profile?.additional_clubs_visibility ?? 'public',
    bio: profile?.bio ?? '',
    websites: (profile?.websites ?? []).map((url: string) => ({ id: nanoid(), url })),
    instagramHandle: profile?.instagram_handle ?? social?.instagram ?? '',
    twitterHandle: profile?.twitter_handle ?? social?.twitter ?? '',
    tiktokHandle: profile?.tiktok_handle ?? social?.tiktok ?? '',
    youtubeHandle: profile?.youtube_handle ?? social?.youtube ?? '',
    country: profile?.country ?? '',
    city: profile?.city ?? '',
    isPublic: profile?.is_public ?? true,
    gender: profile?.gender ?? '',
  };
}

export function useProfileForm(profile: any, loading?: boolean) {
  const [form, setForm] = useState<ProfileFormData>(() => makeInitial(null));
  const [initialData, setInitialData] = useState<ProfileFormData>(() => makeInitial(null));
  const hydrated = useRef(false);

  // Reset hydration guard when profile identity changes (e.g. navigating back to wizard)
  useEffect(() => {
    hydrated.current = false;
  }, [profile?.id]);

  useEffect(() => {
    if (!loading && profile && !hydrated.current) {
      hydrated.current = true;
      const data = makeInitial(profile);
      setForm(data);
      setInitialData(data);
    }
  }, [loading, profile]);

  const setField = useCallback(<K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const isDirty = useMemo(() => {
    return (
      form.displayName !== initialData.displayName ||
      form.bio !== initialData.bio ||
      form.profilePhotoBlob !== null ||
      form.headerPhotoBlob !== null ||
      form.homeClubName !== initialData.homeClubName ||
      form.primaryClubId !== initialData.primaryClubId ||
      form.handicapIndex !== initialData.handicapIndex ||
      form.collegeNormalized !== initialData.collegeNormalized ||
      form.isPublic !== initialData.isPublic ||
      form.country !== initialData.country ||
      form.city !== initialData.city ||
      form.instagramHandle !== initialData.instagramHandle ||
      form.twitterHandle !== initialData.twitterHandle ||
      form.tiktokHandle !== initialData.tiktokHandle ||
      form.youtubeHandle !== initialData.youtubeHandle ||
      JSON.stringify(form.websites) !== JSON.stringify(initialData.websites) ||
      JSON.stringify(form.additionalClubs) !== JSON.stringify(initialData.additionalClubs) ||
      form.homeClubVisibility !== initialData.homeClubVisibility ||
      form.additionalClubsVisibility !== initialData.additionalClubsVisibility ||
      form.gender !== initialData.gender
    );
  }, [form, initialData]);

  const errors = useMemo(() => {
    const e: Partial<Record<keyof ProfileFormData, string>> = {};
    if (!form.displayName.trim()) e.displayName = 'Display name is required';
    if (form.displayName.length > 50) e.displayName = 'Max 50 characters';
    if (form.bio.length > 300) e.bio = 'Max 300 characters';
    form.websites.forEach((w) => {
      if (w.url && !/^https?:\/\/.+/.test(w.url)) {
        e.websites = 'URLs must start with http:// or https://';
      }
    });
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const addWebsite = useCallback(() => {
    setForm(prev => ({
      ...prev,
      websites: [...prev.websites, { id: nanoid(), url: '' }],
    }));
  }, []);

  const removeWebsite = useCallback((id: string) => {
    setForm(prev => ({
      ...prev,
      websites: prev.websites.filter(w => w.id !== id),
    }));
  }, []);

  const updateWebsite = useCallback((id: string, url: string) => {
    setForm(prev => ({
      ...prev,
      websites: prev.websites.map(w => w.id === id ? { ...w, url } : w),
    }));
  }, []);

  const addClub = useCallback((club: Omit<ClubEntry, 'id'>) => {
    setForm(prev => ({
      ...prev,
      additionalClubs: [...prev.additionalClubs, { ...club, id: nanoid() }],
    }));
  }, []);

  const removeClub = useCallback((id: string) => {
    setForm(prev => ({
      ...prev,
      additionalClubs: prev.additionalClubs.filter(c => c.id !== id),
    }));
  }, []);

  return {
    form,
    setField,
    isDirty,
    errors,
    isValid,
    addWebsite,
    removeWebsite,
    updateWebsite,
    addClub,
    removeClub,
  };
}
