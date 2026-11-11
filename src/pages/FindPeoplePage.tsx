/**
 * WF1 — Find people (/find-people), signed off against wf1-find-people.html.
 *
 * Replaces /golferstofollow (which redirects here, keeping any query string).
 * Suggestions come from the get_people_suggestions / get_suggested_businesses
 * RPCs via usePeopleSuggestions; grouping, reason lines and figures are pure
 * in features/find-people/findPeopleRules.ts. Typing in the search field swaps
 * the groups for results from the app's existing global search
 * (useGlobalSearchV2, scopes 'people' and 'clubs'). Follow/unfollow go through
 * the canonical useToggleFollow mutation for both personal and business
 * actors; rows stay in place after following until the next load.
 * G2E: global islands own history back; PageTitle's actual h1 anchors the
 * name. IslandDock owns chip visibility only; both copies use onTab so URL
 * selection cannot drift. Search and useHideBottomNav remain page-owned.
 */
import { useContext, useMemo, useRef, useState } from 'react';
import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
import { ProOrVerifiedMark } from '@/features/pro-verification/ProOrVerifiedMark';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { ROW_FONT } from '@/features/social-lists-v2/rowParts';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { InviteSheetContext } from '@/components/invite/InviteSheetProvider';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { toast } from '@/lib/toast';
import { CHROME_CLEARANCE } from '@/lib/chromeClearance';
import { getProfilePathById } from '@/lib/profileRoutes';
import { useGlobalSearchV2 } from '@/features/search-v2/hooks/useGlobalSearchV2';
import { businessCategoryLabel } from '@/features/find-people/railRules';
import { navClub, navPerson } from '@/features/search-v2/lib/searchNavigation';
import {
  businessInitials,
  businessReason,
  golferFigures,
  golferReason,
  groupsForTab,
  type BusinessSuggestion,
  type Copy,
  type FindPeopleTab,
  type PeopleGroup,
  type PersonSuggestion,
} from '@/features/find-people/findPeopleRules';
import { useBusinessSuggestions, usePeopleSuggestions } from '@/features/find-people/usePeopleSuggestions';
import { ActiveAvatarDoor, ActiveRing } from '@/features/find-people/ActiveRing';
import { activityLine, type RecentActivity } from '@/features/find-people/activeRingRules';
import { useRecentActivity } from '@/features/find-people/useRecentActivity';
import { PageTitle } from '@/features/chrome-v2/PageTitle';
import { IslandDock } from '@/features/chrome-v2/IslandDock';
import { useIslandBackName } from '@/features/chrome-v2/useIslandBackName';

const HAIRLINE = 'rgba(255,255,255,0.06)';
const CHIP_BORDER = 'rgba(255,255,255,0.14)';

/** /golferstofollow → /find-people, keeping any query string. */
export function GolfersToFollowRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/find-people${search}`} replace />;
}

export default function FindPeoplePage() {
  const { t } = useTranslation('common');
  const title = t('findPeople.title', { defaultValue: 'Explore the community' });
  const titleRef = useRef<HTMLHeadingElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  useIslandBackName(title, titleRef);
  /* FIX §3 — a full-screen page: the floating nav
     hides while it is open and returns on leave. */
  useHideBottomNav();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: FindPeopleTab =
    tabParam === 'golfers' || tabParam === 'businesses' ? tabParam : 'suggested';

  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;

  const peopleQ = usePeopleSuggestions(60, !searching);
  const bizQ = useBusinessSuggestions(30, !searching);
  const peopleSearch = useGlobalSearchV2({ query, scope: 'people', enabled: searching });
  const clubSearch = useGlobalSearchV2({ query, scope: 'clubs', enabled: searching });

  // Ids followed during this visit — rows stay in place until the next load.
  const [followed, setFollowed] = useState<ReadonlySet<string>>(new Set());
  const markFollowed = (id: string, on: boolean) =>
    setFollowed((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const groups = useMemo(
    () => groupsForTab(tab, peopleQ.data ?? [], bizQ.data ?? []),
    [tab, peopleQ.data, bizQ.data],
  );
  /** ACTIVE RING — one batched read for every rendered row, display order;
   *  search results are out of scope. */
  const activityIds = useMemo(() => {
    if (searching) return [];
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const g of groups) {
      for (const id of [...g.businesses.map((b) => b.business_id), ...g.people.map((p) => p.user_id)]) {
        if (!seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
    }
    return ids;
  }, [groups, searching]);
  const activity = useRecentActivity(activityIds);

  // WF2: the label rule moved to railRules.businessCategoryLabel so the page
  // and the feed rail share it — same copy as before.
  const categoryOf = businessCategoryLabel;

  const onTab = (next: FindPeopleTab) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'suggested') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  const copy = (c: Copy) => t(c.key, { ...c.vars, defaultValue: c.def });

  const loading = searching
    ? peopleSearch.isLoading || clubSearch.isLoading
    : peopleQ.isLoading || bizQ.isLoading;

  const tabs = (docked = false) => (['suggested', 'golfers', 'businesses'] as FindPeopleTab[]).map((id) => {
    const on = tab === id;
    return <button key={id} type="button" role="tab" aria-selected={on} onClick={() => onTab(id)}
      style={docked ? { flex: 'none', height: 34, padding: '0 13px', borderRadius: 13, border: '1px solid var(--island-back-edge)', color: on ? 'var(--island-back-ink)' : A.MUTE, fontSize: 12.5, fontWeight: 600, fontFamily: ROW_FONT, cursor: 'pointer' } : { height: 32, padding: '0 13px', borderRadius: 999, border: `1px solid ${on ? A.INK : CHIP_BORDER}`, background: on ? A.INK : 'transparent', color: on ? A.CANVAS : 'rgba(248,250,252,0.62)', fontSize: 13.5, fontWeight: 600, fontFamily: ROW_FONT, cursor: 'pointer' }}>
      {t(`findPeople.chip.${id}`, { defaultValue: id === 'suggested' ? 'Suggested' : id === 'golfers' ? 'Golfers' : 'Businesses' })}
    </button>;
  });

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: A.CANVAS,
        color: A.INK,
        fontFamily: ROW_FONT,
        paddingBottom: 120,
        paddingTop: CHROME_CLEARANCE,
      }}
    >
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <PageTitle ref={titleRef} title={title} />

        {/* Search — 14px below the header, 44px, white caret. */}
        <div
          style={{
            height: 44,
            borderRadius: 14,
            background: '#1E1E23',
            border: '1px solid rgba(255,255,255,0.08)',
            margin: '14px 16px 0',
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            gap: 10,
            color: A.DIM,
          }}
        >
          <Search size={17} strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('findPeople.searchPlaceholder', { defaultValue: 'Search golfers and businesses' })}
            aria-label={t('findPeople.searchPlaceholder', { defaultValue: 'Search golfers and businesses' })}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: A.INK,
              caretColor: '#FFFFFF',
              fontFamily: ROW_FONT,
            }}
          />
        </div>

        {/* Chips — 12px below the search field; ?tab= keeps the choice. */}
        <div ref={tabsRef} data-find-tabs role="tablist" style={{ display: 'flex', gap: 8, padding: '12px 16px 4px' }}>
          {tabs()}
        </div>
        <IslandDock anchorRef={tabsRef}>{() => <div data-find-dock-tabs role="tablist" style={{ display: 'flex', gap: 8, maxWidth: 488, margin: '0 auto', overflowX: 'auto', scrollbarWidth: 'none', willChange: 'transform' }}>{tabs(true)}</div>}</IslandDock>

        {loading ? (
          <div style={{ padding: '24px 16px', color: A.DIM, fontSize: 13 }}>
            {t('findPeople.loading', { defaultValue: 'Loading…' })}
          </div>
        ) : searching ? (
          <SearchResults
            people={peopleSearch.data.people}
            clubs={clubSearch.data.clubs}
            followed={followed}
            markFollowed={markFollowed}
          />
        ) : groups.length === 0 ? (
          <div style={{ padding: '28px 16px', color: 'rgba(248,250,252,0.62)', fontSize: 14 }}>
            {t('findPeople.empty', { defaultValue: 'No suggestions yet. Search above, or invite friends.' })}
          </div>
        ) : (
          <>
            {groups.map((g) => (
              <GroupSection
                key={g.id}
                group={g}
                tab={tab}
                copy={copy}
                categoryOf={categoryOf}
                followed={followed}
                markFollowed={markFollowed}
                onTab={onTab}
                activity={activity}
              />
            ))}
            {/* FIX §6 — a thin Businesses tab says more are coming, never an
                empty page. */}
            {tab === 'businesses' && groups.reduce((n, g) => n + g.businesses.length, 0) < 3 ? (
              <div style={{ padding: '18px 16px 0', fontSize: 13, color: 'rgba(248,250,252,0.62)' }}>
                {t('findPeople.bizJoining', { defaultValue: 'More clubs and businesses are joining clbhouz.' })}
              </div>
            ) : null}
          </>
        )}
      </div>

      <InviteFooter />
    </div>
  );
}

/* ── group section ──────────────────────────────────────────────────── */

function GroupSection({
  group,
  tab,
  copy,
  categoryOf,
  followed,
  markFollowed,
  onTab,
  activity,
}: {
  group: PeopleGroup;
  tab: FindPeopleTab;
  copy: (c: Copy) => string;
  categoryOf: (b: BusinessSuggestion) => string;
  followed: ReadonlySet<string>;
  markFollowed: (id: string, on: boolean) => void;
  onTab: (tab: FindPeopleTab) => void;
  activity: Map<string, RecentActivity>;
}) {
  const { t } = useTranslation('common');
  const total = group.people.length + group.businesses.length;
  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: A.DIM,
          margin: '20px 16px 4px',
        }}
      >
        <span data-testid="group-label">{copy(group.label)}</span>
        {group.followAll ? (
          <FollowAllButton group={group} followed={followed} markFollowed={markFollowed} />
        ) : group.seeAll ? (
          /* FIX §5 — a capped Suggested group links to its full tab. */
          <button
            type="button"
            onClick={() => onTab(group.seeAll!.tab)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 0,
              textTransform: 'none',
              color: A.INK,
              fontFamily: ROW_FONT,
              cursor: 'pointer',
            }}
          >
            {t('findPeople.seeAll', { count: group.seeAll.total, defaultValue: `See all ${group.seeAll.total}` })}
          </button>
        ) : (
          <span>{group.count ?? total}</span>
        )}
      </div>
      <div>
        {/* Businesses first within a mixed group (the your_club business leads
            From {club}); golfers follow. */}
        {group.businesses.map((b, i) => (
          <BusinessRow
            key={b.business_id}
            biz={b}
            tab={tab}
            categoryLabel={categoryOf(b)}
            showDivider={i > 0}
            followed={followed.has(`b:${b.business_id}`)}
            markFollowed={markFollowed}
            t={t}
            activity={activity.get(b.business_id)}
          />
        ))}
        {group.people.map((p, i) => (
          <GolferRow
            key={p.user_id}
            golfer={p}
            showDivider={i > 0 || group.businesses.length > 0}
            followed={followed.has(`p:${p.user_id}`)}
            markFollowed={markFollowed}
            t={t}
            activity={activity.get(p.user_id)}
          />
        ))}
      </div>
    </section>
  );
}

/* ── rows ───────────────────────────────────────────────────────────── */

const rowStyle = (divider: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '11px 16px',
  borderTop: divider ? `1px solid ${HAIRLINE}` : undefined,
  cursor: 'pointer',
  fontFamily: ROW_FONT,
  background: 'none',
  width: '100%',
  border: 'none',
  borderTopWidth: divider ? 1 : 0,
  borderTopStyle: divider ? 'solid' : undefined,
  borderTopColor: divider ? HAIRLINE : undefined,
  textAlign: 'left',
});

function GolferRow({
  golfer,
  showDivider,
  followed,
  markFollowed,
  t,
  activity,
}: {
  golfer: PersonSuggestion;
  showDivider: boolean;
  followed: boolean;
  markFollowed: (id: string, on: boolean) => void;
  t: (k: string, o?: Record<string, unknown>) => string;
  activity: RecentActivity | undefined;
}) {
  const navigate = useNavigate();
  const reason = golferReason(golfer);
  const figures = golferFigures(golfer);
  const name = golfer.display_name ?? golfer.username ?? '';
  const when = whenText(activity, t);
  return (
    <RowShell
      open={() => navigate(getProfilePathById(golfer.user_id, undefined, golfer.username))}
      divider={showDivider}
    >
      <ActiveAvatarDoor
        postId={activity?.post_id ?? null}
        label={t('findPeople.active.open', { name, defaultValue: `Open ${name}'s latest post` })}
        onOpen={(id) => navigate(`/post/${id}`)}
      >
        <ActiveRing active={!!activity} surface="canvas">
          <SquircleAvatar
            src={golfer.profile_photo_url ?? undefined}
            alt={name}
            userId={golfer.user_id}
            size={44}
            hairlineRing={!activity}
            hideRing={!!activity}
          />
        </ActiveRing>
      </ActiveAvatarDoor>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 15,
            fontWeight: 600,
            color: A.INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          <ProOrVerifiedMark userId={golfer.user_id} verified={golfer.is_verified} />
        </div>
        <ReasonLine
          when={when}
          reason={reason ? t(reason.key, { ...reason.vars, defaultValue: reason.def }) : null}
        />
        {figures ? (
          <div
            style={{
              fontSize: 12,
              color: A.DIM,
              marginTop: 2,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {figures}
          </div>
        ) : null}
      </div>
      <FollowPill
        targetActorType="personal"
        targetActorId={golfer.user_id}
        followed={followed}
        markFollowed={markFollowed}
      />
    </RowShell>
  );
}

/** ACTIVE RING — rows are a div role="button" (a button cannot hold the
 *  ringed avatar button or the Follow pill). */
function RowShell({ open, divider, children }: { open: () => void; divider: boolean; children: React.ReactNode }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      style={rowStyle(divider)}
    >
      {children}
    </div>
  );
}

function whenText(
  activity: RecentActivity | undefined,
  t: (k: string, o?: Record<string, unknown>) => string,
): string | null {
  if (!activity) return null;
  const line = activityLine(activity, new Date());
  return t(line.key, { ...line.vars, defaultValue: line.def });
}

const REASON_STYLE: React.CSSProperties = {
  fontSize: 13,
  color: 'rgba(248,250,252,0.62)',
  marginTop: 2,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

/** "{when} · {reason}" when active (when in amber 600); unchanged otherwise. */
function ReasonLine({ when, reason }: { when: string | null; reason: string | null }) {
  if (!when) return reason ? <div style={REASON_STYLE}>{reason}</div> : null;
  return (
    <div data-testid="row-reason" style={REASON_STYLE}>
      <span style={{ color: '#F7931E', fontWeight: 600 }}>{when}</span>
      {reason ? ` · ${reason}` : null}
    </div>
  );
}

function BusinessRow({
  biz,
  tab,
  categoryLabel,
  showDivider,
  followed,
  markFollowed,
  t,
  activity,
}: {
  biz: BusinessSuggestion;
  tab: FindPeopleTab;
  categoryLabel: string;
  showDivider: boolean;
  followed: boolean;
  markFollowed: (id: string, on: boolean) => void;
  t: (k: string, o?: Record<string, unknown>) => string;
  activity: RecentActivity | undefined;
}) {
  const navigate = useNavigate();
  const reason = businessReason(biz, tab, categoryLabel);
  const followers = biz.followers ?? 0;
  const when = whenText(activity, t);
  return (
    <RowShell open={() => navigate(`/business/${biz.slug ?? biz.business_id}`)} divider={showDivider}>
      <ActiveAvatarDoor
        postId={activity?.post_id ?? null}
        label={t('findPeople.active.open', { name: biz.name, defaultValue: `Open ${biz.name}'s latest post` })}
        onOpen={(id) => navigate(`/post/${id}`)}
      >
        <ActiveRing active={!!activity} surface="canvas">
          {biz.logo_url ? (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '34%',
                overflow: 'hidden',
                background: '#F8FAFC',
                flexShrink: 0,
              }}
            >
              <img src={biz.logo_url} alt={biz.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '34%',
                background: '#F8FAFC',
                color: A.CANVAS,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {businessInitials(biz.name)}
            </div>
          )}
        </ActiveRing>
      </ActiveAvatarDoor>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 15,
            fontWeight: 600,
            color: A.INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{biz.name}</span>
          {biz.is_verified ? <VerifiedBadge size="sm" /> : null}
        </div>
        <ReasonLine
          when={when}
          reason={reason ? t(reason.key, { ...reason.vars, defaultValue: reason.def }) : null}
        />
        <div style={{ fontSize: 12, color: A.DIM, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
          {t('findPeople.followers', {
            count: followers,
            defaultValue: `${followers.toLocaleString('en-GB')} ${followers === 1 ? 'follower' : 'followers'}`,
          })}
        </div>
      </div>
      <FollowPill
        targetActorType="business"
        targetActorId={biz.business_id}
        followed={followed}
        markFollowed={markFollowed}
      />
    </RowShell>
  );
}

/* ── follow pills ───────────────────────────────────────────────────── */

/** 32px outline pill; Following dims to mute with a 0.1-alpha border. */
function FollowPill({
  targetActorType,
  targetActorId,
  followed,
  markFollowed,
}: {
  targetActorType: 'personal' | 'business';
  targetActorId: string;
  followed: boolean;
  markFollowed: (id: string, on: boolean) => void;
}) {
  const { t } = useTranslation('common');
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const toggle = useToggleFollow();
  const [pending, setPending] = useState(false);
  const key = `${targetActorType === 'personal' ? 'p' : 'b'}:${targetActorId}`;

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) {
      toast.error('Please sign in');
      return;
    }
    const prev = followed;
    markFollowed(key, !prev);
    setPending(true);
    try {
      await toggle.mutateAsync({
        targetActorType,
        targetActorId,
        targetUserId: targetActorType === 'personal' ? targetActorId : undefined,
        viewerActorType: activeActor?.type ?? 'personal',
        viewerActorId: activeActor?.id ?? user.id,
        viewerUserId: user.id,
        isFollowing: prev,
      });
    } catch {
      markFollowed(key, prev);
      toast.error(prev ? 'Could not unfollow' : 'Could not follow');
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      style={{
        flex: 'none',
        height: 32,
        padding: '0 14px',
        borderRadius: 999,
        border: followed ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.22)',
        background: 'transparent',
        color: followed ? 'rgba(248,250,252,0.62)' : A.INK,
        fontSize: 13.5,
        fontWeight: 600,
        fontFamily: ROW_FONT,
        cursor: pending ? 'default' : 'pointer',
        opacity: pending ? 0.7 : 1,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {followed
        ? t('findPeople.following', { defaultValue: 'Following' })
        : t('findPeople.follow', { defaultValue: 'Follow' })}
    </button>
  );
}

/** "Follow all {n}" on the From-{club} group — follows every row in turn,
 *  then reads "Following all". */
function FollowAllButton({
  group,
  followed,
  markFollowed,
}: {
  group: PeopleGroup;
  followed: ReadonlySet<string>;
  markFollowed: (id: string, on: boolean) => void;
}) {
  const { t } = useTranslation('common');
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const toggle = useToggleFollow();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const total = group.people.length + group.businesses.length;
  const allFollowed =
    done ||
    (total > 0 &&
      group.people.every((p) => followed.has(`p:${p.user_id}`)) &&
      group.businesses.every((b) => followed.has(`b:${b.business_id}`)));

  const run = async () => {
    if (!user?.id || busy || allFollowed) return;
    setBusy(true);
    const viewerActorType = activeActor?.type ?? 'personal';
    const viewerActorId = activeActor?.id ?? user.id;
    for (const b of group.businesses) {
      if (followed.has(`b:${b.business_id}`)) continue;
      try {
        await toggle.mutateAsync({
          targetActorType: 'business',
          targetActorId: b.business_id,
          targetUserId: undefined,
          viewerActorType,
          viewerActorId,
          viewerUserId: user.id,
          isFollowing: false,
        });
        markFollowed(b.business_id, true);
      } catch {
        /* one failure never stops the rest of the group */
      }
    }
    for (const p of group.people) {
      if (followed.has(`p:${p.user_id}`)) continue;
      try {
        await toggle.mutateAsync({
          targetActorType: 'personal',
          targetActorId: p.user_id,
          targetUserId: p.user_id,
          viewerActorType,
          viewerActorId,
          viewerUserId: user.id,
          isFollowing: false,
        });
        markFollowed(p.user_id, true);
      } catch {
        /* one failure never stops the rest of the group */
      }
    }
    setBusy(false);
    setDone(true);
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy || allFollowed}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: 0,
        textTransform: 'none',
        color: allFollowed ? 'rgba(248,250,252,0.62)' : A.INK,
        fontFamily: ROW_FONT,
        cursor: busy || allFollowed ? 'default' : 'pointer',
      }}
    >
      {allFollowed
        ? t('findPeople.followingAll', { defaultValue: 'Following all' })
        : t('findPeople.followAll', { count: total, defaultValue: `Follow all ${total}` })}
    </button>
  );
}

/* ── search results ─────────────────────────────────────────────────── */

/** Typing replaces the groups with results from the app's existing people
 *  and business search (useGlobalSearchV2, scopes 'people' and 'clubs'),
 *  in the same row design. */
function SearchResults({
  people,
  clubs,
  followed,
  markFollowed,
}: {
  people: import('@/features/search-v2/lib/searchNavigation').PersonHit[];
  clubs: import('@/features/search-v2/lib/searchNavigation').ClubHit[];
  followed: ReadonlySet<string>;
  markFollowed: (id: string, on: boolean) => void;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  if (people.length === 0 && clubs.length === 0) {
    return (
      <div style={{ padding: '28px 16px', color: 'rgba(248,250,252,0.62)', fontSize: 14 }}>
        {t('findPeople.noResults', { defaultValue: 'No matches.' })}
      </div>
    );
  }
  return (
    <div style={{ marginTop: 8 }}>
      {people.map((p, i) => (
        <button key={p.id} type="button" onClick={() => navPerson(navigate, p)} style={rowStyle(i > 0)}>
          <SquircleAvatar
            src={p.profile_photo_url ?? undefined}
            alt={p.display_name ?? p.username ?? ''}
            userId={p.id}
            size={44}
            hairlineRing
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: A.INK,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <InlineProMemberName userId={p.id}>{p.display_name ?? p.username ?? ''}</InlineProMemberName>
            </div>
            {p.username ? (
              <div style={{ fontSize: 13, color: 'rgba(248,250,252,0.62)', marginTop: 2 }}>@{p.username}</div>
            ) : null}
          </div>
          <FollowPill targetActorType="personal" targetActorId={p.id} followed={followed.has(`p:${p.id}`)} markFollowed={markFollowed} />
        </button>
      ))}
      {clubs.map((c, i) => (
        <button key={c.id} type="button" onClick={() => navClub(navigate, c)} style={rowStyle(i > 0 || people.length > 0)}>
          {c.logo_url ? (
            <div style={{ width: 44, height: 44, borderRadius: '34%', overflow: 'hidden', background: '#F8FAFC', flexShrink: 0 }}>
              <img src={c.logo_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '34%',
                background: '#F8FAFC',
                color: A.CANVAS,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {businessInitials(c.name)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: A.INK,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {c.name}
            </div>
            {[c.city, c.country].filter(Boolean).length > 0 ? (
              <div style={{ fontSize: 13, color: 'rgba(248,250,252,0.62)', marginTop: 2 }}>
                {[c.city, c.country].filter(Boolean).join(' · ')}
              </div>
            ) : null}
          </div>
          <FollowPill targetActorType="business" targetActorId={c.id} followed={followed.has(`b:${c.id}`)} markFollowed={markFollowed} />
        </button>
      ))}
    </div>
  );
}

/* ── invite footer ──────────────────────────────────────────────────── */

/** Pinned to the bottom above the safe area: hairline, canvas ground. */
function InviteFooter() {
  const { t } = useTranslation('common');
  const invite = useContext(InviteSheetContext);
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        background: A.CANVAS,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
        textAlign: 'center',
        zIndex: 20,
      }}
    >
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(248,250,252,0.62)' }}>
          {t('findPeople.inviteLine', { defaultValue: "Invite friends who aren't on clbhouz" })}
        </p>
        <button
          type="button"
          onClick={() => invite?.openInviteSheet('find_people')}
          style={{
            width: '100%',
            height: 44,
            marginTop: 10,
            borderRadius: 999,
            border: 'none',
            background: A.INK,
            color: A.CANVAS,
            fontSize: 15,
            fontWeight: 600,
            fontFamily: ROW_FONT,
            cursor: 'pointer',
          }}
        >
          {t('findPeople.inviteAction', { defaultValue: 'Invite friends' })}
        </button>
      </div>
    </div>
  );
}
