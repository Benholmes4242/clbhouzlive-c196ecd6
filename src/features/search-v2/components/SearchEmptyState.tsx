/**
 * SearchEmptyState — default (no-query) state of SearchOverlayV2.
 *
 * Sections, in order (RECENT is rendered separately by the caller):
 *   1) IN ACTION rail    — horizontal player cards
 *   2) PEOPLE TO FOLLOW  — reason lines + inline Follow button
 *   3) POPULAR ON CLBHOUZ — CourseRow reuse
 *
 * Data: one RPC (search_empty_state_v2) via useSearchEmptyStateV2,
 * cached for the session.
 */
import { useNavigate } from 'react-router-dom';
import { Check, Zap } from 'lucide-react';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { PlayerInitialAvatar } from '@/features/tourhub/_shared/PlayerInitialAvatar';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useFollowState } from '@/hooks/useFollowState';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { isAnyMajor } from '@/features/tourhub/utils/majorScope';
import CountryFlag from '@/components/ui/country-flag';
import { CourseRow } from './CourseRow';
import {
  useSearchEmptyStateV2,
  type EmptyStatePlayer,
  type EmptyStateSuggestion,
} from '../hooks/useSearchEmptyStateV2';
import { navCourse } from '../lib/searchNavigation';
import { KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { A, ROW_BASE, S } from '../lib/tokens';


interface Props {
  onSelect: () => void; // called before navigation (parent uses to close)
}

export function SearchEmptyState({ onSelect }: Props) {
  const { data, isLoading, isError, refetch } = useSearchEmptyStateV2(true);
  const navigate = useNavigate();

  const event = data?.event;
  const players = data?.players ?? [];
  const people = data?.suggested_people ?? [];
  const courses = data?.popular_courses ?? [];

  const liveEvent = event?.is_live ? event : null;
  const eyebrowLabel = liveEvent
    ? `IN ACTION AT ${liveEvent.name.toUpperCase()}`
    : 'TOUR PLAYERS';
  const isMajorEvent = liveEvent ? isAnyMajor(liveEvent.name) : false;
  const showPlayersRail = isLoading || players.length > 0;

  if (isError) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          padding: '32px 16px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 600, color: S.INK }}>
          Couldn't load suggestions
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="active:scale-[0.97]"
          style={{
            height: 32,
            padding: '0 16px',
            borderRadius: 999,
            background: S.INK,
            color: A.CANVAS,
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            transition: 'transform 100ms ease',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* ============ IN ACTION rail ============ */}
      {showPlayersRail && (
        <>
          <SectionEyebrow
            label={eyebrowLabel}
            gold={isMajorEvent}
            rightChip={liveEvent ? <LiveChip /> : null}
          />
          {isLoading && players.length === 0 ? (
            <PlayerRailSkeleton />
          ) : (
            <div
              className="flex scrollbar-hide"
              style={{
                gap: 14,
                overflowX: 'auto',
                padding: '4px 16px 12px',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {players.map((p) => (
                <PlayerCard
                  key={p.id}
                  player={p}
                  tourSlug={liveEvent?.tour_slug ?? event?.tour_slug ?? 'pga'}
                  onTap={() => {
                    onSelect();
                    navigate(`/tourhub/player/${p.id}`);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ============ PEOPLE TO FOLLOW ============ */}
      {(isLoading || people.length > 0) && (
        <>
          <SectionEyebrow label="People to follow" />
          {isLoading && people.length === 0 ? (
            <PeopleSkeleton />
          ) : (
            <div>
              {people.map((s) => (
                <SuggestionRow
                  key={s.id}
                  suggestion={s}
                  onSelect={() => {
                    onSelect();
                    navigate(`/profile/${s.username ?? s.id}`);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ============ POPULAR ON CLBHOUZ ============ */}
      {(isLoading || courses.length > 0) && (
        <>
          <SectionEyebrow label="Popular on clbhouz" />
          {isLoading && courses.length === 0 ? (
            <CoursesSkeleton />
          ) : (
            <div>
              {courses.map((c) => (
                <CourseRow
                  key={c.id}
                  course={c}
                  query=""
                  onSelect={() => {
                    onSelect();
                    navCourse(navigate, c);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Eyebrow ───────────────────────────────────────────────────────────
// Single eyebrow treatment: shared KICKER token, identical to the "Recent"
// section header. No amber/gold variants — all sections read the same.
function SectionEyebrow({
  label,
  gold: _gold = false,
  rightChip = null,
}: {
  label: string;
  gold?: boolean;
  rightChip?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 16px 8px',
        gap: 8,
      }}
    >
      {/* MICRO_BRIEF_SEARCH_OVERLAY_TYPE_SCALE: local floor lift (9 -> 11). */}
      <span style={KICKER} className="truncate">
        {label}
      </span>
      {rightChip}
    </div>
  );
}

function LiveChip() {
  return (
    <span
      className="animate-pulse"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        // ACCENT, not a fault: white label over the live green chip.
        background: '#22C55E',
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      <Zap style={{ width: 12, height: 12 }} />
      LIVE
    </span>
  );
}

// ─── Player card ───────────────────────────────────────────────────────
function PlayerCard({
  player,
  tourSlug,
  onTap,
}: {
  player: EmptyStatePlayer;
  tourSlug: string;
  onTap: () => void;
}) {
  const candidates = getPlayerHeadshotCandidates(
    player.full_name,
    tourSlug,
    player.headshot_override,
  );
  return (
    <button
      type="button"
      onClick={onTap}
      className="flex flex-col items-center shrink-0 text-left"
      style={{ width: 84 }}
    >
      <PlayerInitialAvatar
        name={player.full_name}
        srcCandidates={candidates}
        size={64}
        radius="34%"
        ringColor={DARK_HAIRLINE}
      />
      <p
        className="truncate w-full text-center"
        style={{
          marginTop: 8,
          fontSize: 12,
          fontWeight: 600,
          lineHeight: '14px',
          color: S.INK,
        }}
      >
        {player.abbr_name || player.full_name}
      </p>
      {(player.country_code || player.country) && (
        <div className="flex justify-center w-full" style={{ marginTop: 4 }}>
          <CountryFlag
            country={player.country_code || player.country}
            size="sm"
          />
        </div>
      )}
    </button>
  );
}

// ─── People-to-follow row ──────────────────────────────────────────────
function reasonLine(s: EmptyStateSuggestion): string {
  if (s.reason_type === 'followed_by' && s.reason_detail)
    return `Followed by ${s.reason_detail}`;
  if (s.reason_type === 'plays' && s.reason_detail)
    return `Plays ${s.reason_detail}`;
  return 'Popular on clbhouz';
}

function SuggestionRow({
  suggestion,
  onSelect,
}: {
  suggestion: EmptyStateSuggestion;
  onSelect: () => void;
}) {
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const viewerActorType: 'personal' | 'business' =
    activeActor?.type ?? 'personal';
  const viewerActorId = activeActor?.id ?? user?.id;
  const toggle = useToggleFollow();
  const { isFollowing: cached } = useFollowState({
    targetActorType: 'personal',
    targetActorId: suggestion.id,
    viewerActorType,
    viewerActorId,
  });
  const following = cached ?? false;

  const name = suggestion.display_name || suggestion.username || '—';
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const onFollowTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id || !viewerActorId) return;
    if (toggle.isPending) return;
    toggle.mutate({
      targetActorType: 'personal',
      targetActorId: suggestion.id,
      targetUserId: suggestion.id,
      viewerActorType,
      viewerActorId,
      viewerUserId: user.id,
      isFollowing: following,
    });
  };

  return (
    <div
      onClick={onSelect}
      className={`${ROW_BASE} cursor-pointer`}
    >
      <SquircleAvatar
        size={42}
        src={suggestion.profile_photo_url ?? undefined}
        alt={name}
        userId={suggestion.id}
        fallback={initials}
        hairlineRing
        ringColor={DARK_HAIRLINE}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium truncate" style={{ color: S.INK }}>
          {name}
        </p>
        <p className="text-[13px] truncate" style={{ color: S.QUIET }}>
          {reasonLine(suggestion)}
        </p>
      </div>
      <button
        type="button"
        onClick={onFollowTap}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={toggle.isPending}
        className="active:scale-[0.96] shrink-0"
        style={{
          height: 30,
          padding: '0 14px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          transition: 'transform 100ms ease',
          // Both states come from tokens: FOLLOW is ink-filled with the
          // canvas as its label; FOLLOWING is a quiet outline. Neither is a
          // literal.
          ...(following
            ? {
                background: 'transparent',
                color: S.QUIET,
                border: `1px solid ${S.HAIRLINE}`,
              }
            : {
                background: S.INK,
                color: A.CANVAS,
                border: 'none',
              }),
        }}
      >
        {following ? (
          <span className="inline-flex items-center gap-1">
            <Check size={12} strokeWidth={2.6} />
            Following
          </span>
        ) : (
          'Follow'
        )}
      </button>
    </div>
  );
}

// ─── Skeletons ─────────────────────────────────────────────────────────
function PlayerRailSkeleton() {
  return (
    <div
      className="flex"
      style={{ gap: 14, overflowX: 'hidden', padding: '4px 16px 12px' }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center shrink-0"
          style={{ width: 84 }}
        >
          <div
            className="clb-shimmer-dark"
            style={{ width: 64, height: 64, borderRadius: '34%' }}
          />
          <div
            className="clb-shimmer-dark"
            style={{ width: 60, height: 10, marginTop: 8, borderRadius: 4 }}
          />
          <div
            className="clb-shimmer-dark"
            style={{ width: 40, height: 8, marginTop: 4, borderRadius: 4 }}
          />
        </div>
      ))}
    </div>
  );
}

function PeopleSkeleton() {
  return (
    <div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 min-h-[60px]">
          <div
            className="clb-shimmer-dark shrink-0"
            style={{ width: 42, height: 42, borderRadius: '34%' }}
          />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-32 rounded clb-shimmer-dark" />
            <div className="h-3 w-24 rounded clb-shimmer-dark" />
          </div>
          <div
            className="clb-shimmer-dark shrink-0"
            style={{ width: 82, height: 30, borderRadius: 999 }}
          />
        </div>
      ))}
    </div>
  );
}

function CoursesSkeleton() {
  return (
    <div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 min-h-[60px]">
          <div
            className="clb-shimmer-dark shrink-0"
            style={{ width: 42, height: 42, borderRadius: 12 }}
          />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 rounded clb-shimmer-dark" />
            <div className="h-3 w-20 rounded clb-shimmer-dark" />
          </div>
        </div>
      ))}
    </div>
  );
}
