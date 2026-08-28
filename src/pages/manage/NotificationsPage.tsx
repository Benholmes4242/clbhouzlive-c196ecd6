import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Switch } from '@/components/ui/switch';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { A } from '@/features/courses/components/holes/analytical/tokens';


// Canonical categories. `types` are the notification_preferences.muted_types
// strings — every DB `type` we emit for that category, so a single toggle
// covers all the aliases the sender may use.
const CATEGORIES: { key: string; label: string; sub: string; types: string[] }[] = [
  /* 'reaction' is the Discover round/review reaction type. KNOWN COUPLING
     (BRIEF_DISCOVER_LOOSE_ENDS §S3.3): tg_notify_content_reaction emits ONE type
     for rounds, reviews and ratings, so muting Likes mutes review likes too.
     Separating them needs distinct types at the trigger, not here. */
  { key: 'likes',        label: 'Likes',
    sub: 'When someone likes your posts or rounds',
    types: ['like', 'like_post', 'reaction'] },
  { key: 'comments',     label: 'Comments and replies',
    sub: 'Comments on your posts and replies to you',
    types: ['comment', 'comment_post', 'comment_reply', 'top_ten_comment', 'top_ten_reply'] },
  { key: 'mentions',     label: 'Mentions and tags',
    sub: 'When someone mentions or tags you',
    types: ['mention', 'mention_post', 'comment_mention', 'tag'] },
  { key: 'followers',    label: 'New followers',
    sub: 'When someone starts following you',
    types: ['follow'] },
  { key: 'friends',      label: 'Friend requests',
    sub: 'Requests and accepts',
    types: ['friend_request', 'friend_accept', 'friend_accepted'] },
  { key: 'messages',     label: 'Messages',
    sub: 'Direct and group messages',
    types: ['message', 'message_received', 'dm'] },
  { key: 'games',        label: 'Games',
    sub: 'Invites, changes and cancellations',
    types: ['game_invite', 'game_request', 'game_updated', 'game_cancelled', 'game_request_accepted', 'game_request_declined'] },
  { key: 'courses',      label: 'Course activity',
    sub: 'Friend reviews and responses to your reviews',
    types: ['friend_course_review', 'course_review', 'course_review_received', 'review_response', 'review_response_posted', 'friend_review'] },
  { key: 'gamification', label: 'Streaks and achievements',
    sub: 'Badges, streaks, crowns, rivals and rate-a-course prompts',
    types: ['badge_earned', 'legend_earned', 'legend_lost', 'rival_played', 'streak_at_risk', 'streak_broken', 'streak_freeze_applied', 'crown_taken', 'crown_lost', 'rate_course_prompt'] },
  { key: 'analytics',    label: 'Course analytics',
    sub: "When your rounds update a course's analytics",
    types: ['course_analytics_updated'] },
  { key: 'tour',         label: 'Tour roundups',
    sub: 'Sunday final rounds and Thursday picks',
    types: ['tour_roundup', 'tour_preview'] },

];

// Matches the personal SettingsToggleRow grammar used in the Privacy section:
// checked fill is near-white ink, unchecked is a raised track with a hairline.
const SETTINGS_SWITCH_CLASS = cn(
  'relative before:absolute before:content-[""] before:-inset-y-2.5 before:-inset-x-1',
  'data-[state=checked]:bg-[#F8FAFC] data-[state=unchecked]:bg-[rgba(255,255,255,0.14)]',
  'data-[state=unchecked]:border data-[state=unchecked]:border-[rgba(255,255,255,0.18)]',
);

export default function NotificationsPage() {
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const pushNotifications = usePushNotifications();

  const [mutedTypes, setMutedTypes] = useState<string[]>([]);
  const [mutedUserIds, setMutedUserIds] = useState<string[]>([]);
  const [mutedBusinessIds, setMutedBusinessIds] = useState<string[]>([]);
  /* Resolved names/avatars for the muted list. An id that resolves to NOTHING
     (deleted member, removed business) still gets a row — a mute nobody can
     lift is worse than an unnamed row. */
  const [mutedMeta, setMutedMeta] = useState<Record<string, { name: string; photo: string | null }>>({});
  const [unmuting, setUnmuting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);


  const isPushEnabled = pushNotifications.state === 'enabled';
  const isPushUnavailable = pushNotifications.state === 'unavailable' && !pushNotifications.isLoading;
  const isPushLoading = pushNotifications.isLoading || pushNotifications.state === 'unknown';

  const handleTogglePush = () => {
    if (isPushUnavailable || isPushLoading) return;
    if (isPushEnabled) pushNotifications.disable();
    else pushNotifications.enable();
  };

  // Read the REAL preference store — the notification_preferences table used
  // by both the activity feed filter and the push sender.
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('notification_preferences')
      .select('muted_types, muted_user_ids, muted_business_ids')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        setMutedTypes((data?.muted_types as string[]) ?? []);
        setMutedUserIds((data?.muted_user_ids as string[]) ?? []);
        setMutedBusinessIds((data?.muted_business_ids as string[]) ?? []);
      });
  }, [userId]);

  // Resolve the muted ids to names/avatars. Two lookups, two tables; anything
  // unresolved simply has no entry here and renders as an unnamed row.
  useEffect(() => {
    if (mutedUserIds.length === 0 && mutedBusinessIds.length === 0) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, { name: string; photo: string | null }> = {};
      if (mutedUserIds.length > 0) {
        const { data } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .in('id', mutedUserIds);
        for (const p of data ?? []) {
          next[p.id] = {
            name: p.display_name || p.username || '',
            photo: p.profile_photo_url ?? null,
          };
        }
      }
      if (mutedBusinessIds.length > 0) {
        const { data } = await supabase
          .from('business_accounts')
          .select('id, name, slug, logo_url')
          .in('id', mutedBusinessIds);
        for (const b of data ?? []) {
          next[b.id] = { name: b.name || b.slug || '', photo: b.logo_url ?? null };
        }
      }
      if (!cancelled) setMutedMeta((prev) => ({ ...prev, ...next }));
    })();
    return () => {
      cancelled = true;
    };
  }, [mutedUserIds, mutedBusinessIds]);

  /* One list, two arrays. The row remembers which array it came from so Unmute
     writes back to the right column. */
  const mutedRows = useMemo(
    () => [
      ...mutedUserIds.map((id) => ({ id, kind: 'person' as const })),
      ...mutedBusinessIds.map((id) => ({ id, kind: 'business' as const })),
    ],
    [mutedUserIds, mutedBusinessIds],
  );

  const handleUnmute = async (id: string, kind: 'person' | 'business') => {
    if (!userId) return;
    const column = kind === 'business' ? 'muted_business_ids' : 'muted_user_ids';
    const prev = kind === 'business' ? mutedBusinessIds : mutedUserIds;
    const next = prev.filter((x) => x !== id);
    const setter = kind === 'business' ? setMutedBusinessIds : setMutedUserIds;
    setter(next);
    setUnmuting(id);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({ user_id: userId, [column]: next }, { onConflict: 'user_id' });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-v2'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    } catch {
      setter(prev);
      toast.error('Could not unmute.');
    } finally {
      setUnmuting(null);
    }
  };

  // A category is ON when NONE of its types appear in muted_types. Partial
  // overlap (a single type muted via the per-notification sheet) renders as
  // OFF; turning it ON clears the entire category — the correct reconciliation.
  const categoryStates = useMemo(() => {
    const set = new Set(mutedTypes);
    return Object.fromEntries(
      CATEGORIES.map((c) => [c.key, !c.types.some((t) => set.has(t))]),
    ) as Record<string, boolean>;
  }, [mutedTypes]);

  const updatePref = async (categoryKey: string, nextOn: boolean) => {
    if (!userId) return;
    const cat = CATEGORIES.find((c) => c.key === categoryKey);
    if (!cat) return;

    const previous = mutedTypes;
    const currentSet = new Set(previous);
    if (nextOn) {
      for (const t of cat.types) currentSet.delete(t);
    } else {
      for (const t of cat.types) currentSet.add(t);
    }
    const next = Array.from(currentSet);
    setMutedTypes(next);
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({ user_id: userId, muted_types: next }, { onConflict: 'user_id' });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    } catch {
      setMutedTypes(previous);
      toast.error('Could not save notification preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  const pushSubline = isPushUnavailable
    ? 'Push needs the latest clbhouz app. Update from the App Store, then come back here.'
    : 'Allow clbhouz to send push alerts';
  const pushSwitchChecked = isPushUnavailable ? false : isPushEnabled;
  const pushSwitchDisabled = isPushUnavailable || isPushLoading;

  return (
    <ManagePageShell title="Notifications">
      <div className="px-4 pt-4 space-y-6">
        {/* Push (global) */}
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
        >
          <div className="min-w-0 pr-3">
            <p className="text-[15px] font-medium text-foreground">Push notifications</p>
            <p className="text-[13px]" style={{ color: A.MUTE }}>{pushSubline}</p>
          </div>
          <Switch
            checked={pushSwitchChecked}
            disabled={pushSwitchDisabled}
            onCheckedChange={handleTogglePush}
            className={SETTINGS_SWITCH_CLASS}
          />
        </div>

        {/* Categories */}
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[1.5px] px-1 mb-2"
            style={{ color: A.MUTE }}
          >
            What you get notified about
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
          >
            {CATEGORIES.map((c, idx) => (
              <div
                key={c.key}
                className="flex items-center justify-between px-4 py-3 min-h-[52px]"
                style={{ borderTop: idx === 0 ? 'none' : `0.5px solid ${A.BORDER}` }}
              >
                <div className="min-w-0 pr-3">
                  <p className="text-[15px] text-foreground">{c.label}</p>
                  <p className="text-[13px]" style={{ color: A.MUTE }}>{c.sub}</p>
                </div>
                <Switch
                  checked={categoryStates[c.key]}
                  disabled={isSaving}
                  onCheckedChange={(val) => updatePref(c.key, val)}
                  className={SETTINGS_SWITCH_CLASS}
                />
              </div>
            ))}
          </div>
          <p className="text-[12px] px-1 mt-2" style={{ color: A.MUTE }}>
            Turning a type off stops both push alerts and in-app notifications for it.
          </p>
        </div>

        {/* MUTED ACCOUNTS — people and businesses in one list, each with the way
            back out. The old surface rendered a bare count, so a mute could be
            made but never lifted. */}
        {mutedRows.length > 0 && (
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[1.5px] px-1 mb-2"
              style={{ color: A.MUTE }}
            >
              Muted accounts
            </p>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
            >
              {mutedRows.map((r, idx) => {
                const meta = mutedMeta[r.id];
                return (
                  <div
                    key={`${r.kind}:${r.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 min-h-[56px]"
                    style={{ borderTop: idx === 0 ? 'none' : `0.5px solid ${A.BORDER}` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <SquircleAvatar
                        size={34}
                        src={meta?.photo ?? null}
                        alt={meta?.name || 'Muted account'}
                        userId={r.id}
                        hairlineRing
                      />
                      <div className="min-w-0">
                        <p className="text-[15px] text-foreground truncate">
                          {meta?.name || 'Unavailable account'}
                        </p>
                        <p className="text-[12px]" style={{ color: A.MUTE }}>
                          {r.kind === 'business' ? 'Business' : 'Member'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnmute(r.id, r.kind)}
                      disabled={unmuting === r.id}
                      className="text-[13px] font-semibold rounded-full px-3 py-1.5 shrink-0"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${A.BORDER}`,
                        color: '#F8FAFC',
                        opacity: unmuting === r.id ? 0.5 : 1,
                      }}
                    >
                      Unmute
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ManagePageShell>
  );
}
