import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { ProfileFormData } from '@/components/profile/profile-wizard/types';
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
import { parseHcpFormString } from '@/lib/formatHcp';
import { whsKeys } from '@/lib/whs/hooks';

const INVALIDATE_KEYS = [
  'profile', 'profile-clubs', 'user-profile', 'home-clubs-map',
  'user-home-clubs', 'golfers-filtered', 'search-golfers',
];

export function useProfileSave(userId: string) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const save = async (
    form: ProfileFormData,
    opts: { isOnboarding?: boolean; hasWhsConnection?: boolean } = {}
  ): Promise<boolean | 'username_taken'> => {
    const { isOnboarding = false, hasWhsConnection = false } = opts;
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
        display_name: form.displayName.trim() || null,
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
        show_additional_home_clubs: form.additionalClubsVisibility !== 'private',
        websites: form.websites.map(w => w.url).filter(Boolean),
        instagram_handle: form.instagramHandle.replace('@', '').trim(),
        twitter_handle: form.twitterHandle.replace('@', '').trim(),
        tiktok_handle: form.tiktokHandle.replace('@', '').trim(),
        youtube_handle: form.youtubeHandle.replace('@', '').trim(),
        country: form.country.trim(),
        city: form.city.trim(),
        gender: form.gender || null,
        
        has_completed_onboarding: true,
        updated_at: new Date().toISOString(),
      };

      // Drop nulls so we never blow away trigger-seeded display_name / names with blanks.
      if (updatePayload.display_name == null) delete updatePayload.display_name;
      if (updatePayload.first_name == null) delete updatePayload.first_name;
      if (updatePayload.last_name == null) delete updatePayload.last_name;

      // Only onboarding writes the username + username_is_custom flag, AND only
      // when the user actually entered one. Otherwise we keep the auto-seeded
      // username from the handle_new_user trigger so a Skip/Save with empty
      // username doesn't violate the NOT NULL constraint.
      if (isOnboarding && form.username.trim()) {
        updatePayload.username = form.username.trim();
        updatePayload.username_is_custom = true;
      }

      // Capture prior gender so a changed gender value can trigger the same
      // WHS percentile invalidation GenderPromptSheet performs
      // (src/components/profile/GenderPromptSheet.tsx:121).
      const { data: priorProfile } = await supabase
        .from('user_profiles')
        .select('gender')
        .eq('id', userId)
        .single();

      const { data: updated, error: profileError } = await supabase
        .from('user_profiles')
        .update(updatePayload as any)
        .eq('id', userId)
        .select('id')
        .single();

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
      if (!updated) {
        throw new Error('Profile update did not match any row');
      }


      // 4. Sync home clubs (primary + additional) to user_home_clubs.
      //    Replace-all strategy: delete existing rows, then insert the new set.
      //    user_home_clubs.club_id is UUID referencing golf_clubs.
      const { error: clubsDelErr } = await supabase
        .from('user_home_clubs')
        .delete()
        .eq('user_profile_id', userId);
      if (clubsDelErr) {
        toast.error('Clubs could not be saved: ' + (clubsDelErr.message || 'delete failed'));
        return false;
      }

      // user_home_clubs holds ADDITIONAL clubs only. The primary club's source
      // of truth is user_profiles.primary_club_id (written above); never mirror
      // it as a user_home_clubs row.
      const clubRows: Array<{ user_profile_id: string; club_id: string }> = [];
      for (const c of form.additionalClubs) {
        if (c.clubId && c.clubId !== form.primaryClubId) {
          clubRows.push({ user_profile_id: userId, club_id: c.clubId });
        }
      }
      if (clubRows.length > 0) {
        // Dedupe defensively - unique index is (user_profile_id, club_id).
        const seen = new Set<string>();
        const unique = clubRows.filter(r => {
          const k = `${r.user_profile_id}:${r.club_id}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        const { error: clubsErr } = await supabase.from('user_home_clubs').insert(unique);
        if (clubsErr) {
          toast.error('Clubs could not be saved: ' + (clubsErr.message || 'insert failed'));
          return false;
        }
      }


      // 6. Invalidate all relevant query keys - await to prevent stale data.
      //    refetchType: 'all' forces inactive caches (e.g. profile-clubs on a
      //    non-mounted profile page) to refetch, not just be marked stale.
      await Promise.all(
        INVALIDATE_KEYS.map(key =>
          queryClient.invalidateQueries({ queryKey: [key], refetchType: 'all' })
        )
      );
      // FIX I5: Invalidate onboarding cache so AuthWrapper doesn't re-route
      queryClient.invalidateQueries({ queryKey: ['onboarding-status', userId] });

      // When gender changes, the WHS percentile benchmark (men's vs women's
      // pro distribution) must recompute. Invalidation matches
      // GenderPromptSheet at src/components/profile/GenderPromptSheet.tsx:121.
      const priorGender = priorProfile?.gender ?? null;
      const nextGender = form.gender || null;
      if (priorGender !== nextGender) {
        await queryClient.invalidateQueries({
          queryKey: whsKeys.percentile(userId),
          refetchType: 'all',
        });
      }

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
