import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ProfileFormData } from '@/components/profile/profile-wizard/types';
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
import { parseHcpFormString } from '@/lib/formatHcp';

const INVALIDATE_KEYS = [
  'profile', 'user-profile', 'home-clubs-map',
  'user-home-clubs', 'golfers-filtered', 'search-golfers',
];

export function useProfileSave(userId: string) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const save = async (
    form: ProfileFormData,
    opts: { isOnboarding?: boolean } = {}
  ): Promise<boolean | 'username_taken'> => {
    const { isOnboarding = false } = opts;
    setIsSaving(true);
    try {
      // 1. Upload profile photo if changed
      let profilePhotoUrl = form.profilePhotoUrl;
      if (form.profilePhotoBlob) {
        const file = new File(
          [form.profilePhotoBlob],
          `profile-${Date.now()}.jpg`,
          { type: 'image/jpeg' }
        );
        const result = await uploadToR2Only(file, 'clbhouz-profile-images');
        if (!result.success || !result.publicUrl) {
          throw new Error('Profile photo upload failed');
        }
        profilePhotoUrl = result.publicUrl;
      }

      // 2. Upload header photo if changed
      let headerPhotoUrl = form.headerPhotoUrl;
      if (form.headerPhotoBlob) {
        const file = new File(
          [form.headerPhotoBlob],
          `header-${Date.now()}.jpg`,
          { type: 'image/jpeg' }
        );
        const result = await uploadToR2Only(file, 'clbhouz-profile-banners');
        if (!result.success || !result.publicUrl) {
          throw new Error('Header photo upload failed');
        }
        headerPhotoUrl = result.publicUrl;
      }

      // 3. Update user_profiles — fully typed, no `any`
      const updatePayload: Record<string, any> = {
        display_name: form.displayName.trim(),
        first_name: form.firstName.trim() || null,
        last_name: form.lastName.trim() || null,
        bio: form.bio.trim(),
        is_public: form.isPublic,
        profile_photo_url: profilePhotoUrl,
        header_photo_url: headerPhotoUrl,
        home_club: form.homeClubName,
        primary_club_id: form.primaryClubId,
        // Write to manual_handicap_index ONLY. eg_handicap_index is owned
        // exclusively by the WHS connect/sync edge functions.
        manual_handicap_index: parseHcpFormString(form.handicapIndex),
        home_club_visibility: form.homeClubVisibility,
        additional_clubs_visibility: form.additionalClubsVisibility,
        websites: form.websites.map(w => w.url).filter(Boolean),
        instagram_handle: form.instagramHandle.replace('@', '').trim(),
        twitter_handle: form.twitterHandle.replace('@', '').trim(),
        tiktok_handle: form.tiktokHandle.replace('@', '').trim(),
        youtube_handle: form.youtubeHandle.replace('@', '').trim(),
        country: form.country.trim(),
        city: form.city.trim(),
        gender: form.gender || null,
        champions_visibility: form.championsVisibility || 'everyone',
        handicap_page_visibility: form.handicapPageVisibility || 'everyone',
        has_completed_onboarding: true,
        updated_at: new Date().toISOString(),
      };

      // Only onboarding writes the username + username_is_custom flag.
      // For returning users the field is read-only in the UI; never trust it.
      if (isOnboarding) {
        updatePayload.username = form.username.trim();
        updatePayload.username_is_custom = true;
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(updatePayload as any)
        .eq('id', userId);

      if (profileError) {
        const msg = (profileError.message || '').toLowerCase();
        const isUniqueViolation =
          (profileError as any).code === '23505' ||
          msg.includes('uq_user_profiles_username_ci') ||
          (msg.includes('duplicate') && msg.includes('username'));
        if (isUniqueViolation) {
          return 'username_taken';
        }
        throw profileError;
      }


      // 4. Sync home club to user_home_clubs
      if (form.primaryClubId) {
        await supabase
          .from('user_home_clubs')
          .upsert(
            { user_profile_id: userId, club_id: form.primaryClubId },
            { onConflict: 'user_profile_id' }
          );
      } else {
        await supabase
          .from('user_home_clubs')
          .delete()
          .eq('user_profile_id', userId);
      }


      // 6. Invalidate all relevant query keys — await to prevent stale data
      await Promise.all(
        INVALIDATE_KEYS.map(key =>
          queryClient.invalidateQueries({ queryKey: [key] })
        )
      );
      // FIX I5: Invalidate onboarding cache so AuthWrapper doesn't re-route
      queryClient.invalidateQueries({ queryKey: ['onboarding-status', userId] });

      return true;
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not save profile. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { save, isSaving };
}
