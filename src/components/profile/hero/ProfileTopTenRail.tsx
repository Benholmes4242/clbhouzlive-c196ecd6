/**
 * ProfileTopTenRail - BRIEF_PROFILE_TOP_TEN_REBUILD (mock: top-ten-final.html).
 *
 * A member's top ten drawn as a RANKING, not a shelf: a kicker and one sentence, number
 * one as a 186px photograph, two and three side by side at 104px, a reaction
 * strip beneath the number-one card (scoped to the position-1 course, because
 * useTopTenReactions is keyed by course), then positions four to ten as rows
 * carrying our clbhouz rank beside the member's own score.
 *
 * The empty, partial and full states are ONE component. Everything that is
 * an invitation - the ten slots, slot rows under a partial list, the lede,
 * the add button, suggestion chips and the share card - is owner only; a
 * visitor sees only the entries that exist, and nothing when there are none.
 *
 * Deep-link contract kept: ?tab=courses&course=<id>&top_ten_comment=<id>
 * auto-opens the comments sheet for the deep-linked course on mount.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { useUserTopTenCourses, type TopTenCourse } from '@/hooks/useUserTopTenCourses';
import { useTopTenReactions, REACTION_CONFIG, type ReactionType } from '@/hooks/useTopTenReactions';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { useBlockedUserIds } from '@/hooks/useBlockedUserIds';
import { commentsKeys, viewerId as commentsViewerKey } from '@/lib/queryKeys';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTopTenVisibility } from '@/components/profile/hooks/useTopTenVisibility';
import { toast } from '@/lib/toast';
import { MessageCircle } from 'lucide-react';
import { numberWord } from '@/lib/text/numbers';
// Used by the owner progress invitation (unchanged), not by any header copy.
const Word = (n: number) => numberWord(n);
import { useCourseListRanks, formatListRank, type ListRank } from '@/lib/courses/listRank';

const GLASS = 'rgba(10,14,10,0.55)';
const SCRIM = 'linear-gradient(0deg, rgba(10,14,10,0.78), rgba(10,14,10,0) 58%)';
const PHOTO_INK = '#FFFFFF';
const PILL_KICKER = 'rgba(255,255,255,0.7)';
const CAPTION_SUB = 'rgba(255,255,255,0.74)';
const SLOT_DASH = 'rgba(248,250,252,0.26)';
const SLOT_NEXT = 'rgba(248,250,252,0.55)';
const ROW_SLOT_DASH = 'rgba(248,250,252,0.22)';
const PRESSED_BORDER = 'rgba(247,147,30,0.55)';
const SHARE_BG = 'linear-gradient(170deg, #101417, #0A0A0C 60%)';
const CAPTURE_OPTS = { backgroundColor: '#000', scale: 2, logging: false, useCORS: true };

/**
 * THE SCORE TONE IS GREEN AT 9.0+, INK OTHERWISE. Deliberately NOT
 * courseSubScoreTone: that helper returns MUTE below 9, which suits a course
 * card where the sub-score is secondary. Here the rating IS the row, so the
 * else-branch is INK. Threshold and green are identical to the helper's.
 */
const scoreTone = (score: number) => (score >= 9 ? A.GREEN : A.INK);


const regionOf = (c: { sub_country?: string | null; region?: string | null; country?: string | null }) =>
  c.sub_country || c.region || c.country || null;
/** Region plus the course's resolved Top 100 placement (useCourseListRanks). Never the legacy rank columns. */
const regionLine = (c: { sub_country?: string | null; region?: string | null; country?: string | null }, rank: ListRank | undefined) =>
  [regionOf(c), formatListRank(rank ?? null)].filter(Boolean).join(' · ');

type SuggestCourse = {
  id: string; name: string; country: string | null; sub_country: string | null;
  region: string | null; thumbnail_image?: string | null;
};

export interface TopTenShareIdentity {
  displayName: string;
  avatarUrl?: string | null;
  handicapIndex?: number | null;
  rounds?: number | null;
  rated?: number | null;
}

interface Props {
  userId: string;
  isOwnProfile: boolean;
  onManage?: () => void;
  /** Every add affordance opens the same sheet Manage opens, on its Add tab. */
  onAddCourse?: () => void;
  initialCourseId?: string | null;
  initialCommentId?: string | null;
  initialParentCommentId?: string | null;
  /** Raw user_profiles.top_ten_visibility from the profile row already in memory
   *  (ProfilePageV2 holds it). Never fetched here — BRIEF_..._ROUNDTRIP §1/§4. */
  topTenVisibility?: string | null;
  /** Owner-only share card identity, from figures the profile page already holds. */
  shareIdentity?: TopTenShareIdentity;
  /** Profile owner's first name (falling back to display name) for the visitor sentence. */
  ownerName?: string | null;
}


export const ProfileTopTenRail: React.FC<Props> = ({
  userId,
  isOwnProfile,
  onManage,
  onAddCourse,
  initialCourseId = null,
  initialCommentId = null,
  topTenVisibility,
  shareIdentity,
  ownerName,
}) => {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { topTen: rawTopTen, isLoading } = useUserTopTenCourses(userId);
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const [commentsCourseId, setCommentsCourseId] = React.useState<string | null>(initialCourseId);
  const [sharing, setSharing] = React.useState(false);
  const shareRef = React.useRef<HTMLDivElement>(null);

  const { user } = useSupabaseSession();
  const viewerId = user?.id;
  const { canView, visibility, isLoading: visibilityLoading } =
    useTopTenVisibility(userId, viewerId, topTenVisibility);


  const topTen = React.useMemo(
    () => [...rawTopTen].sort((a, b) => a.position - b.position),
    [rawTopTen],
  );

  const didAutoOpen = React.useRef(false);
  React.useEffect(() => {
    if (didAutoOpen.current) return;
    if (!initialCommentId || !initialCourseId) return;
    didAutoOpen.current = true;
    setCommentsCourseId(initialCourseId);
    setCommentsOpen(true);
  }, [initialCommentId, initialCourseId]);

  const courseIds = React.useMemo(() => topTen.map((c) => c.course_id).sort(), [topTen]);

  const { data: ratingsMap = {} } = useQuery({
    queryKey: ['user-course-ratings-breakdown', userId, courseIds],
    enabled: !!userId && courseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_ratings')
        .select('course_id, rating')
        .eq('user_id', userId)
        .in('course_id', courseIds);
      if (error) throw error;
      return (data || []).reduce((acc: Record<string, number>, r) => {
        acc[r.course_id] = r.rating;
        return acc;
      }, {});
    },
    staleTime: 60_000,
  });

  const showSuggestions = isOwnProfile && !isLoading && topTen.length < 3;
  /*
   * Zero-state suggestions: the courses at the top of the viewer's most relevant
   * Top 100 list (gb-i preferred, global fallback), from the membership authority,
   * skipping anything already in the ten or excluded.
   */
  const { data: suggestions = [] } = useQuery({
    queryKey: ['top-ten-suggestions', userId, courseIds],
    enabled: showSuggestions && !!userId,
    queryFn: async () => {
      const { data: lists, error: listErr } = await supabase
        .from('top100_lists')
        .select('id, slug')
        .in('slug', ['gb-i', 'global'])
        .eq('is_active', true);
      if (listErr) throw listErr;
      const list = (lists || []).find((l) => l.slug === 'gb-i') ?? (lists || []).find((l) => l.slug === 'global');
      if (!list) return [] as SuggestCourse[];
      const [{ data: rows, error }, { data: excl }] = await Promise.all([
        supabase
          .from('course_top100_memberships')
          .select('rank, golf_courses!inner(id, name, country, sub_country, region, thumbnail_image)')
          .eq('list_id', list.id)
          .order('rank', { ascending: true })
          .limit(20),
        supabase.from('user_top10_exclusions').select('course_id').eq('user_id', userId),
      ]);
      if (error) throw error;
      const skip = new Set([...courseIds, ...(excl || []).map((e) => e.course_id)]);
      return ((rows || []) as any[])
        .map((r) => r.golf_courses as SuggestCourse)
        .filter((c) => c && !skip.has(c.id))
        .slice(0, 3);
    },
    staleTime: 5 * 60_000,
  });

  const { data: rankMap } = useCourseListRanks([...courseIds, ...suggestions.map((s) => s.id)]);
  const rankOf = (id: string): ListRank => rankMap?.get(id) ?? null;

  // Community rating per course: course_rating_stats, one read for all ids.
  const { data: communityMap = {} } = useQuery({
    queryKey: ['top-ten-community-ratings', courseIds],
    enabled: courseIds.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_rating_stats')
        .select('course_id, average_rating')
        .in('course_id', courseIds);
      if (error) throw error;
      return (data || []).reduce<Record<string, number>>((acc, r: any) => {
        if (r.course_id && r.average_rating != null) acc[r.course_id] = Number(r.average_rating);
        return acc;
      }, {});
    },
  });

  const firstCourseId = topTen[0]?.course_id ?? '';
  const stripOn = topTen.length >= 3;
  const { counts, myReaction, toggleReaction } = useTopTenReactions(stripOn ? userId : '', firstCourseId);
  /*
   * NEAR COUNT, ON PURPOSE. One head count against comments_v2 instead of the
   * full thread loader (which refetches on every mount). Replies are included.
   * Hidden comments (from the cache the sheet already filled — no new query) and
   * blocked authors (shared blocked-ids cache) are excluded using the sheet's own
   * columns: user_id, and actor_id for non-business actors.
   * DELIBERATELY NOT DONE: a reply whose PARENT is hidden or blocked still counts,
   * because a flat count cannot see a reply's parent. The strip can read one or
   * two higher than the sheet for such a viewer, and that is accepted — the
   * strip is a doorway label, not a promise about the thread. Do not "fix" this.
   */
  const blockedIds = useBlockedUserIds(viewerId ?? null);
  const hiddenIds = qc.getQueryData<Set<string>>(commentsKeys.hidden(commentsViewerKey(viewerId)));
  const hiddenList = hiddenIds ? [...hiddenIds] : [];
  const blockedList = [...blockedIds];
  const { data: visibleCount = 0, isFetched: threadFetched } = useQuery({
    queryKey: ['top-ten-comment-near-count', userId, firstCourseId, hiddenList.sort().join(','), blockedList.sort().join(',')],
    enabled: stripOn && !!firstCourseId,
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase
        .from('comments_v2')
        .select('id', { count: 'exact', head: true })
        .eq('target_type', 'top_ten')
        .eq('target_id', userId)
        .eq('target_secondary_id', firstCourseId);
      if (hiddenList.length) q = q.not('id', 'in', `(${hiddenList.join(',')})`);
      if (blockedList.length) {
        const ids = blockedList.join(',');
        q = q
          .not('user_id', 'in', `(${ids})`)
          .or(`actor_type.eq.business,actor_id.is.null,actor_id.not.in.(${ids})`);
      }
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (isLoading) return null;
  if (visibilityLoading && !isOwnProfile) return null;
  if (!isOwnProfile && !canView) return null;
  if (!isOwnProfile && topTen.length === 0) return null;

  const n = topTen.length;
  const ratingOf = (c: TopTenCourse) => c.rating ?? ratingsMap[c.course_id] ?? null;
  const pillKicker = isOwnProfile ? t('topTen.you', 'You') : t('topTen.them', 'Them');

  const open = (c: TopTenCourse) => {
    analyticsEvents.track('profile_top10_card_tap', { course_id: c.course_id, position: c.position });
    navigate(`/courses/${c.course_id}`);
  };

  const audienceMarker =
    isOwnProfile && visibility !== 'public'
      ? visibility === 'private' ? 'Only me' : visibility === 'friends' ? 'Friends only' : 'Followers & friends'
      : null;

  // Header: a kicker and ONE plain descriptive sentence. No title, no computed verdict.
  const line = isOwnProfile
    ? t('topTen.lineOwn', 'Your top ten rated golf courses.')
    : ownerName?.trim()
      ? t('topTen.lineOther', { name: ownerName.trim(), defaultValue: "{{name}}'s top ten rated golf courses." })
      : t('topTen.lineOtherFallback', 'Their top ten rated golf courses.');
  const header = (
    <div style={{ fontFamily: SANS }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.MUTE }}>{t('topTen.kicker', 'Top 10')}</span>
        {isOwnProfile && onManage && n > 0 && (
          <button type="button" onClick={onManage} style={{ background: 'transparent', border: 'none', padding: 0, flexShrink: 0, fontFamily: SANS, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: A.INK, cursor: 'pointer' }}>
            {t('topTen.manage', 'Manage')}
          </button>
        )}
      </div>
      <div style={{ marginTop: 5, fontSize: 12.5, fontWeight: 600, color: A.BODY, lineHeight: 1.45 }}>{line}</div>
      {audienceMarker && (
        <div style={{ marginTop: 4, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: A.MUTE }}>{audienceMarker}</div>
      )}
    </div>
  );

  const pill = (c: TopTenCourse) => {
    const r = ratingOf(c);
    if (r == null) return null;
    return (
      <span style={{ position: 'absolute', bottom: 8, right: 8, display: 'inline-flex', alignItems: 'baseline', gap: 4, background: GLASS, borderRadius: 999, padding: '3px 9px' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: r >= 9 ? A.GREEN : PHOTO_INK, ...FIGS }}>{r.toFixed(1)}</span>
        <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: PILL_KICKER }}>{pillKicker}</span>
      </span>
    );
  };

  const btnReset: React.CSSProperties = { background: 'transparent', border: 'none', padding: 0, textAlign: 'left', fontFamily: SANS, cursor: 'pointer', display: 'block', width: '100%' };

  // ── Full / partial list (3+) ──────────────────────────────────────────
  const renderList = () => {
    const [one, two, three, ...rest] = topTen;
    const missing = isOwnProfile ? Array.from({ length: 10 - n }, (_, i) => n + i + 1) : [];
    return (
      <>
        <button type="button" data-top-ten-course-id={one.course_id} onClick={() => open(one)} style={{ ...btnReset, marginTop: 14 }}>
          <CourseImageFallback courseId={one.course_id} courseName={one.name} imageUrl={one.thumbnail_image} style={{ height: 186, borderRadius: 14 }}>
            <div style={{ position: 'absolute', inset: 0, background: SCRIM }} />
            <span style={{ position: 'absolute', top: 10, left: 12, fontSize: 52, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 0.85, color: PHOTO_INK, textShadow: '0 2px 20px rgba(0,0,0,0.5)', ...FIGS }}>
              {one.position}
            </span>
            {pill(one)}
            <div style={{ position: 'absolute', left: 12, right: 104, bottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em', color: PHOTO_INK, lineHeight: 1.2 }}>{one.name}</div>
              {regionLine(one, rankOf(one.course_id)) && <div style={{ marginTop: 3, fontSize: 11, fontWeight: 600, color: CAPTION_SUB, ...FIGS }}>{regionLine(one, rankOf(one.course_id))}</div>}
            </div>
          </CourseImageFallback>
        </button>

        {/* Reaction strip — belongs to the number-one pick, sits directly under it. */}
        <div style={{ marginTop: 9, padding: '9px 11px', background: 'rgba(255,255,255,0.045)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: A.DIM, whiteSpace: 'nowrap' }}>{isOwnProfile ? t('topTen.onYourNumberOne', 'Your number one') : t('topTen.onTheirNumberOne', 'Their number one')}</span>
          {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((k) => {
            const pressed = myReaction === k;
            const pressable = !isOwnProfile && !!viewerId;
            return (
              <button
                key={k}
                type="button"
                aria-label={REACTION_CONFIG[k].label}
                aria-pressed={pressable ? pressed : undefined}
                disabled={!pressable}
                onClick={pressable ? () => toggleReaction(k) : undefined}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999, border: `1px solid ${pressed ? PRESSED_BORDER : A.HAIRLINE}`, background: 'transparent', fontFamily: SANS, cursor: pressable ? 'pointer' : 'default', opacity: 1 }}
              >
                <span style={{ fontSize: 12 }}>{REACTION_CONFIG[k].emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: pressed ? A.AMBER : A.MUTE, ...FIGS }}>{counts[k] ?? 0}</span>
              </button>
            );
          })}
          <button
            type="button"
            aria-label={t('topTen.commentsLabel', 'Comments')}
            onClick={() => { setCommentsCourseId(firstCourseId); setCommentsOpen(true); }}
            style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', padding: 0, fontFamily: SANS, color: A.MUTE, cursor: 'pointer' }}
          >
            {/* Same icon as FeedCard / FeedActionRail. A zero still renders — it is the way in. */}
            <MessageCircle size={17} stroke="currentColor" strokeWidth={2} fill="none" />
            <span style={{ fontSize: 12, fontWeight: 700, color: A.MUTE, ...FIGS }}>{threadFetched ? visibleCount : 0}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 9 }}>
          {[two, three].map((c) => (
            <button key={c.id} type="button" data-top-ten-course-id={c.course_id} onClick={() => open(c)} style={btnReset}>
              <CourseImageFallback courseId={c.course_id} courseName={c.name} imageUrl={c.thumbnail_image} style={{ height: 104, borderRadius: 14 }}>
                <div style={{ position: 'absolute', inset: 0, background: SCRIM }} />
                <span style={{ position: 'absolute', top: 8, left: 8, background: GLASS, borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: PHOTO_INK, ...FIGS }}>{c.position}</span>
                {pill(c)}
              </CourseImageFallback>
              {/* ONE HEIGHT for the text under both two-up photographs: two lines of the 12/1.25 name (2 x 15) plus the 2px gap plus the 10.5/1.35 region line (14.17), rounded up to 47. A one-line name — or a course with no region and no placement, where the region div does not render at all — simply leaves the gap, and the pair never goes ragged. Top-aligned on purpose: floating the region line to the bottom instead opens a hole under the short name. */}
              <div style={{ marginTop: 7, height: 47, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: A.INK, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.name}</div>
                {regionLine(c, rankOf(c.course_id)) && <div style={{ marginTop: 2, fontSize: 10.5, fontWeight: 600, color: A.BODY, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...FIGS }}>{regionLine(c, rankOf(c.course_id))}</div>}
              </div>
            </button>
          ))}
        </div>

        {(rest.length > 0 || missing.length > 0) && (
          <div style={{ marginTop: 16 }}>
            {rest.map((c, i) => {
              const r = ratingOf(c);
              const g = communityMap[c.course_id] ?? null;
              return (
                <button key={c.id} type="button" data-top-ten-course-id={c.course_id} onClick={() => open(c)}
                  style={{ ...btnReset, display: 'flex', alignItems: 'center', gap: 11, padding: '8px 0', borderTop: i > 0 ? `1px solid ${A.SOFT}` : 'none' }}>
                  <span style={{ width: 18, textAlign: 'right', fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em', color: A.DIM, flexShrink: 0, ...FIGS }}>{c.position}</span>
                  <CourseImageFallback courseId={c.course_id} courseName={c.name} imageUrl={c.thumbnail_image} style={{ width: 44, height: 34, borderRadius: 8, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: A.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    {regionLine(c, rankOf(c.course_id)) && <span style={{ display: 'block', marginTop: 2, fontSize: 10.5, fontWeight: 600, color: A.DIM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...FIGS }}>{regionLine(c, rankOf(c.course_id))}</span>}
                  </span>
                  <span style={{ width: 42, textAlign: 'center', flexShrink: 0 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.02em', color: g != null ? A.MUTE : A.DIM, ...FIGS }}>{g != null ? g.toFixed(1) : '–'}</span>
                    <span style={{ display: 'block', marginTop: 2, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: A.DIM }}>{t('topTen.golfers', 'Golfers')}</span>
                  </span>
                  <span style={{ width: 42, textAlign: 'center', flexShrink: 0 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.02em', color: r != null ? scoreTone(r) : A.DIM, ...FIGS }}>{r != null ? r.toFixed(1) : '–'}</span>
                    <span style={{ display: 'block', marginTop: 2, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: A.DIM }}>{pillKicker}</span>
                  </span>
                </button>
              );
            })}
            {missing.map((p, i) => (
              <div key={`slot-${p}`} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 0', borderTop: rest.length > 0 || i > 0 ? `1px solid ${A.SOFT}` : 'none' }}>
                <span style={{ width: 18, flexShrink: 0 }} />
                <span style={{ width: 44, height: 34, borderRadius: 8, border: `1px dashed ${ROW_SLOT_DASH}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: A.DIM, flexShrink: 0, ...FIGS }}>{p}</span>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  // ── Owner empty / 1–2 entries ─────────────────────────────────────────
  const renderInvitation = () => {
    const next = n + 1;
    return (
      <>
        <div style={{ marginTop: 16, fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: A.INK, lineHeight: 1.2, whiteSpace: 'pre-line' }}>
          {n === 0 ? t('topTen.empty.lede', 'Ten courses.\nIn order. Your call.') : t('topTen.progress.lede', { count: n, word: Word(n), left: Word(10 - n), defaultValue: '{{word}} down. {{left}} to go.' })}
        </div>
        <div style={{ marginTop: 7, fontSize: 12.5, fontWeight: 600, color: A.BODY, lineHeight: 1.5 }}>
          {n === 0
            ? t('topTen.empty.body', "It fills itself from the courses you rate, and you don't need a single round on clbhouz to start. Pick the best you have ever played, anywhere, any time.")
            : t('topTen.progress.body', { name: topTen[0].name, defaultValue: '{{name}} is your number one. Add another and they sort themselves by what you score them.' })}
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 5 }}>
          {Array.from({ length: 10 }, (_, i) => {
            const c = topTen[i];
            if (c) {
              return <CourseImageFallback key={i} courseId={c.course_id} courseName={c.name} imageUrl={c.thumbnail_image} style={{ flex: 1, height: 38, borderRadius: 7 }} />;
            }
            const isNext = i === n;
            return (
              <div key={i} style={{ flex: 1, height: 38, borderRadius: 7, border: `1px dashed ${isNext ? SLOT_NEXT : SLOT_DASH}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: isNext ? A.INK : A.DIM, ...FIGS }}>
                {i + 1}
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => onAddCourse?.()}
          style={{ marginTop: 16, width: '100%', borderRadius: 14, padding: '13px 0', background: A.INK, color: A.CANVAS, border: 'none', fontFamily: SANS, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          {n === 0 ? t('topTen.empty.cta', 'Start with your number one') : t('topTen.progress.cta', { next, defaultValue: 'Add your number {{next}}' })}
        </button>
        {suggestions.length > 0 && (
          <>
            <div style={{ marginTop: 20, fontSize: 9, fontWeight: 700, letterSpacing: '0.19em', textTransform: 'uppercase', color: A.DIM }}>
              {t('topTen.empty.suggest', 'Played any of these?')}
            </div>
            <div style={{ marginTop: 9, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {suggestions.map((s) => (
                <button key={s.id} type="button"
                  onClick={() => onAddCourse?.()}
                  style={{ ...btnReset, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${A.HAIRLINE}`, borderRadius: 12, padding: '9px 11px' }}>
                  <CourseImageFallback courseId={s.id} courseName={s.name} imageUrl={s.thumbnail_image ?? null} style={{ width: 34, height: 26, borderRadius: 6, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: A.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    <span style={{ display: 'block', marginTop: 2, fontSize: 10.5, fontWeight: 600, color: A.DIM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...FIGS }}>{regionLine(s, rankOf(s.id))}</span>
                  </span>
                  <span style={{ fontSize: 17, fontWeight: 700, color: A.MUTE }}>+</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => onAddCourse?.()}
              style={{ marginTop: 11, background: 'transparent', border: 'none', padding: 0, fontFamily: SANS, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase', color: A.MUTE, cursor: 'pointer' }}>
              {t('topTen.empty.searchAll', 'Search all courses')} ›
            </button>
          </>
        )}
      </>
    );
  };

  // ── Share card ────────────────────────────────────────────────────────
  const handleShare = async () => {
    const el = shareRef.current;
    if (!el || sharing) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(el, CAPTURE_OPTS);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('capture failed');
      const file = new File([blob], 'my-top-10.png', { type: 'image/png' });
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: t('topTen.share.cardTitle', 'My top 10') });
          return;
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-top-10.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error("Couldn't create your card");
    } finally {
      setSharing(false);
    }
  };

  const shareSub = [
    shareIdentity?.rounds != null ? t('topTen.share.rounds', { count: shareIdentity.rounds, defaultValue: '{{count}} rounds' }) : null,
    shareIdentity?.rated != null ? t('topTen.share.rated', { count: shareIdentity.rated, defaultValue: '{{count}} rated' }) : null,
  ].filter(Boolean).join(' · ');

  const shareRow = isOwnProfile && n >= 3 && (
    <>
      <div style={{ marginTop: 18, border: `1px solid ${A.HAIRLINE}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: A.INK }}>{t('topTen.share.title', 'Share your ten')}</div>
          <div style={{ marginTop: 3, fontSize: 11, fontWeight: 600, color: A.DIM, lineHeight: 1.4 }}>{t('topTen.share.body', 'A card for Instagram, WhatsApp or the group chat.')}</div>
        </div>
        <button type="button" onClick={handleShare} disabled={sharing}
          style={{ background: A.INK, color: A.CANVAS, border: 'none', borderRadius: 12, padding: '9px 14px', fontFamily: SANS, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0, opacity: sharing ? 0.6 : 1 }}>
          {t('topTen.share.cta', 'Create')}
        </button>
      </div>
      {/* Off-screen, type-only card captured by html2canvas. No course photos. */}
      <div aria-hidden style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }}>
        <div ref={shareRef} style={{ width: 330, background: SHARE_BG, border: `1px solid ${A.HAIRLINE}`, borderRadius: 18, padding: '22px 20px', fontFamily: SANS, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {shareIdentity?.avatarUrl ? (
              <img src={shareIdentity.avatarUrl} crossOrigin="anonymous" alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: A.TRACK }} />
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: A.INK }}>{shareIdentity?.displayName ?? ''}</span>
            {shareIdentity?.handicapIndex != null && (
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.DIM, ...FIGS }}>
                {t('topTen.share.hcp', { value: shareIdentity.handicapIndex.toFixed(1), defaultValue: '{{value}} hcp' })}
              </span>
            )}
          </div>
          <div style={{ marginTop: 16, fontSize: 23, fontWeight: 700, letterSpacing: '-0.025em', color: A.INK }}>{t('topTen.share.cardTitle', 'My top 10')}</div>
          {shareSub && <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.DIM, ...FIGS }}>{shareSub}</div>}
          <div style={{ marginTop: 16 }}>
            {topTen.map((c, i) => {
              const r = ratingOf(c);
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderTop: i > 0 ? `1px solid ${A.SOFT}` : 'none', fontSize: 12 }}>
                  <span style={{ width: 15, fontWeight: 700, color: A.DIM, ...FIGS }}>{c.position}</span>
                  <span style={{ flex: 1, minWidth: 0, fontWeight: 600, color: A.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ fontWeight: 700, color: A.MUTE, ...FIGS }}>{r != null ? r.toFixed(1) : ''}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 18, paddingTop: 12, borderTop: `1px solid ${A.HAIRLINE}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em', color: A.INK }}>clbhouz</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: A.DIM }}>{t('topTen.share.tagline', 'stay in play.')}</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <section style={{ marginTop: 16, marginBottom: 8, padding: '0 16px 4px', fontFamily: SANS }}>
      {header}
      {n >= 3 ? <>{renderList()}{shareRow}</> : isOwnProfile ? renderInvitation() : null}

      {commentsCourseId && (
        <CommentsSheetV2
          isOpen={commentsOpen}
          onClose={() => setCommentsOpen(false)}
          targetType="top_ten"
          targetId={userId}
          targetSecondaryId={commentsCourseId}
          initialCommentId={commentsCourseId === initialCourseId ? initialCommentId : null}
        />
      )}
    </section>
  );
};

export default ProfileTopTenRail;
