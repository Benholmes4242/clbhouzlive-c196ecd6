import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type DiscoverGolferRow = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  candidate_state: 'monitor' | 'notable_candidate' | 'high_confidence_candidate';
  profile_completeness_score: number;
  has_external_links: boolean;
  mentions_30d: number;
  unique_mentioners_30d: number;
  course_tags_30d: number;
  top100_course_tags_30d: number;
  followers_count: number;
  engagement_score_30d: number;
  last_computed_at: string;
};

export type DiscoverFilters = {
  state: 'notable_candidate' | 'high_confidence_candidate' | 'all';
  hasLinks?: boolean;
  minMentions?: number;
  minTop100Tags?: number;
  search?: string;
  sort?: 'confidence' | 'recent' | 'mentions' | 'top100' | 'followers';
};

function applyClientFilters(rows: DiscoverGolferRow[], f: DiscoverFilters): DiscoverGolferRow[] {
  let out = rows;

  if (f.state && f.state !== 'all') {
    out = out.filter(r => r.candidate_state === f.state);
  }
  if (f.hasLinks === true) {
    out = out.filter(r => r.has_external_links);
  }
  if (f.minMentions) {
    out = out.filter(r => r.mentions_30d >= f.minMentions!);
  }
  if (f.minTop100Tags) {
    out = out.filter(r => r.top100_course_tags_30d >= f.minTop100Tags!);
  }

  if (f.search?.trim()) {
    const s = f.search.trim().toLowerCase();
    out = out.filter(r =>
      (r.display_name ?? '').toLowerCase().includes(s) ||
      (r.username ?? '').toLowerCase().includes(s)
    );
  }

  // Sort
  switch (f.sort) {
    case 'mentions':
      out = [...out].sort((a, b) => b.mentions_30d - a.mentions_30d);
      break;
    case 'top100':
      out = [...out].sort((a, b) => b.top100_course_tags_30d - a.top100_course_tags_30d);
      break;
    case 'followers':
      out = [...out].sort((a, b) => b.followers_count - a.followers_count);
      break;
    case 'recent':
      out = [...out].sort((a, b) => (b.last_computed_at > a.last_computed_at ? 1 : -1));
      break;
    default:
      // confidence = engagement_score + top100 weight + unique mentioners weight
      out = [...out].sort((a, b) => {
        const ca = a.engagement_score_30d + a.top100_course_tags_30d * 5 + a.unique_mentioners_30d * 3;
        const cb = b.engagement_score_30d + b.top100_course_tags_30d * 5 + b.unique_mentioners_30d * 3;
        return cb - ca;
      });
  }

  return out;
}

export function getReasonChips(r: DiscoverGolferRow): Array<{ label: string; kind: 'neutral' | 'strong' }> {
  const chips: Array<{ label: string; kind: 'neutral' | 'strong' }> = [];

  if (r.top100_course_tags_30d >= 3) {
    chips.push({ label: 'Top 100 activity', kind: 'strong' });
  } else if (r.top100_course_tags_30d >= 1) {
    chips.push({ label: 'Top 100 activity', kind: 'neutral' });
  }

  if (r.unique_mentioners_30d >= 5) {
    chips.push({ label: 'Mentioned by others', kind: 'strong' });
  } else if (r.mentions_30d >= 3) {
    chips.push({ label: 'Mentions rising', kind: 'neutral' });
  }

  if (r.has_external_links) {
    chips.push({ label: 'External links', kind: 'neutral' });
  }

  if (r.followers_count >= 50) {
    chips.push({ label: `${r.followers_count} followers`, kind: r.followers_count >= 200 ? 'strong' : 'neutral' });
  }

  if (r.profile_completeness_score >= 80) {
    chips.push({ label: 'Complete profile', kind: 'neutral' });
  }

  // Keep it to 3 max so it stays clean
  return chips.slice(0, 3);
}

export function useAdminDiscoverNotableGolfers(filters: DiscoverFilters) {
  return useQuery({
    queryKey: ['admin-discover-golfers', filters],
    queryFn: async () => {
      // Fetch signals for notable/high confidence candidates
      const { data: signals, error: signalsError } = await supabase
        .from('golfer_eligibility_signals')
        .select('*')
        .in('candidate_state', ['notable_candidate', 'high_confidence_candidate'])
        .order('engagement_score_30d', { ascending: false });

      if (signalsError) throw signalsError;
      if (!signals || signals.length === 0) return [];

      // Get dismissed user IDs
      const { data: dismissed } = await supabase
        .from('golfer_candidate_overrides')
        .select('user_id')
        .eq('action', 'dismiss');

      const dismissedIds = new Set(dismissed?.map(d => d.user_id) || []);

      // Get already invited user IDs
      const { data: invited } = await supabase
        .from('golfer_verification_invites')
        .select('user_id')
        .eq('status', 'active');

      const invitedIds = new Set(invited?.map(i => i.user_id) || []);

      // Get pending verification requests
      const { data: pending } = await supabase
        .from('golfer_verification_requests')
        .select('user_id')
        .in('status', ['pending', 'invited']);

      const pendingIds = new Set(pending?.map(p => p.user_id) || []);

      // Filter out dismissed, invited, and pending
      const filteredSignals = signals.filter(s =>
        !dismissedIds.has(s.user_id) &&
        !invitedIds.has(s.user_id) &&
        !pendingIds.has(s.user_id)
      );

      // Fetch profiles
      const userIds = filteredSignals.map(s => s.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, is_verified_golfer')
        .in('id', userIds)
        .eq('is_verified_golfer', false);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const rows: DiscoverGolferRow[] = filteredSignals
        .filter(s => profileMap.has(s.user_id))
        .map(s => {
          const profile = profileMap.get(s.user_id)!;
          return {
            user_id: s.user_id,
            display_name: profile.display_name,
            username: profile.username,
            profile_photo_url: profile.profile_photo_url,
            candidate_state: s.candidate_state as DiscoverGolferRow['candidate_state'],
            profile_completeness_score: s.profile_completeness_score,
            has_external_links: s.has_external_links,
            mentions_30d: s.mentions_30d,
            unique_mentioners_30d: s.unique_mentioners_30d,
            course_tags_30d: s.course_tags_30d,
            top100_course_tags_30d: s.top100_course_tags_30d,
            followers_count: s.followers_count,
            engagement_score_30d: s.engagement_score_30d,
            last_computed_at: s.last_computed_at,
          };
        });

      // Apply local filtering/sorting
      return applyClientFilters(rows, filters);
    },
    staleTime: 30_000,
  });
}

export function useAdminInviteGolferVerification() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc('invite_golfer_from_discover', {
        p_user_id: userId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Invite sent.');
      qc.invalidateQueries({ queryKey: ['admin-discover-golfers'] });
      qc.invalidateQueries({ queryKey: ['admin-golfer-verification-requests'] });
    },
    onError: (e: Error) => toast.error(e.message ?? 'Failed to invite golfer'),
  });
}

export function useAdminDismissGolferCandidate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('dismiss_golfer_candidate', {
        p_user_id: userId,
        p_reason: reason || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Dismissed.');
      qc.invalidateQueries({ queryKey: ['admin-discover-golfers'] });
    },
    onError: (e: Error) => toast.error(e.message ?? 'Failed to dismiss'),
  });
}

export function useAdminDiscoverRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const ch = supabase
      .channel('admin-discover-golfers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'golfer_eligibility_signals' }, () => {
        qc.invalidateQueries({ queryKey: ['admin-discover-golfers'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'golfer_candidate_overrides' }, () => {
        qc.invalidateQueries({ queryKey: ['admin-discover-golfers'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'golfer_verification_invites' }, () => {
        qc.invalidateQueries({ queryKey: ['admin-discover-golfers'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);
}
