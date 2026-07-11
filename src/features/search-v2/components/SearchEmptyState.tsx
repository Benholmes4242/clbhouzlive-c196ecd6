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
import { useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useFollowState } from '@/hooks/useFollowState';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { isAnyMajor } from '@/features/tourhub/utils/majorScope';
import { CourseRow } from './CourseRow';
import {
  useSearchEmptyStateV2,
  type EmptyStatePlayer,
  type EmptyStateSuggestion,
} from '../hooks/useSearchEmptyStateV2';
import { navCourse } from '../lib/searchNavigation';

const AMBER = '#F7931E';
const GOLD_GRADIENT =
  'linear-gradient(90deg, #B8860B 0%, #F7C948 45%, #FFD97A 60%, #F7C948 80%, #B8860B 100%)';

interface Props {
  onSelect: () => void; // called before navigation (parent uses to close)
}

export function SearchEmptyState({ onSelect }: Props) {
  const { data, isLoading } = useSearchEmptyStateV2(true);
  const navigate = useNavigate();

  const event = data?.event;
  const players = data?.players ?? [];
  const people = data?.suggested_people ?? [];
  const courses = data?.popular_courses ?? [];

  const eyebrowLabel = event
    ? `IN ACTION AT ${event.name.toUpperCase()}`
    : 'TOUR PLAYERS';
  const isMajorEvent = event ? isAnyMajor(event.name) : false;

  return (
    <div>
      {/* ============ IN ACTION rail ============ */}
      <SectionEyebrow
        label={eyebrowLabel}
        gold={isMajorEvent}
        rightChip={event?.is_live ? <LiveChip /> : null}
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
              onTap={() => {
                onSelect();
                navigate(`/tourhub/player/${p.id}`);
              }}
            />
          ))}
        </div>
      )}

      {/* ============ PEOPLE TO FOLLOW ============ */}
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
                if (!s.username) return;
                onSelect();
                navigate(`/profile/${s.username}`);
              }}
            />
          ))}
        </div>
      )}

      {/* ============ POPULAR ON CLBHOUZ ============ */}
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
    </div>
  );
}

// ─── Eyebrow ───────────────────────────────────────────────────────────
function SectionEyebrow({
  label,
  gold = false,
  rightChip = null,
}: {
  label: string;
  gold?: boolean;
  rightChip?: React.ReactNode;
}) {
  const textStyle: React.CSSProperties = gold
    ? {
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        backgroundImage: GOLD_GRADIENT,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
      }
    : {
        fontSize: 10.5,
        fontWeight: 800,
        color: AMBER,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      };
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
      <span style={textStyle} className="truncate">
        {label}
      </span>
      {rightChip}
    </div>
  );
}

function LiveChip() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 7px',
        borderRadius: 999,
        background: '#DC2626',
        color: '#fff',
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: '0.1em',
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: '#fff',
        }}
      />
      LIVE
    </span>
  );
}

// ─── Player card ───────────────────────────────────────────────────────
function PlayerCard({
  player,
  onTap,
}: {
  player: EmptyStatePlayer;
  onTap: () => void;
}) {
  const initials = (player.abbr_name || player.full_name || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <button
      type="button"
      onClick={onTap}
      className="flex flex-col items-center shrink-0 text-left"
      style={{ width: 84 }}
    >
      <SquircleAvatar
        size={64}
        src={player.headshot_override ?? undefined}
        alt={player.full_name}
        fallback={initials}
        hairlineRing
        ringColor={LIGHT_HAIRLINE}
      />
      <p
        className="truncate w-full text-center"
        style={{
          marginTop: 8,
          fontSize: 12,
          fontWeight: 600,
          lineHeight: '14px',
          color: '#0F172A',
        }}
      >
        {player.abbr_name || player.full_name}
      </p>
      {player.country && (
        <p
          className="truncate w-full text-center"
          style={{ marginTop: 2, fontSize: 10.5, color: '#64748B' }}
        >
          {player.country}
        </p>
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
  const queryClient = useQueryClient();
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
    toggle.mutate(
      {
        targetActorType: 'personal',
        targetActorId: suggestion.id,
        targetUserId: suggestion.id,
        viewerActorType,
        viewerActorId,
        viewerUserId: user.id,
        isFollowing: following,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['search-empty-state-v2'] });
        },
      },
    );
  };

  return (
    <div
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-4 min-h-[60px] active:bg-black/[0.02] text-left cursor-pointer"
    >
      <SquircleAvatar
        size={42}
        src={suggestion.profile_photo_url ?? undefined}
        alt={name}
        fallback={initials}
        hairlineRing
        ringColor={LIGHT_HAIRLINE}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium truncate" style={{ color: '#0F172A' }}>
          {name}
        </p>
        <p className="text-[12px] truncate" style={{ color: '#64748B' }}>
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
          ...(following
            ? {
                background: 'transparent',
                color: 'rgba(15,23,42,0.55)',
                border: '1px solid rgba(15,23,42,0.14)',
              }
            : {
                background: '#0F172A',
                color: '#fff',
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
            className="clb-shimmer-light"
            style={{ width: 64, height: 64, borderRadius: '34%' }}
          />
          <div
            className="clb-shimmer-light"
            style={{ width: 60, height: 10, marginTop: 8, borderRadius: 4 }}
          />
          <div
            className="clb-shimmer-light"
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
            className="clb-shimmer-light shrink-0"
            style={{ width: 42, height: 42, borderRadius: '34%' }}
          />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-32 rounded clb-shimmer-light" />
            <div className="h-3 w-24 rounded clb-shimmer-light" />
          </div>
          <div
            className="clb-shimmer-light shrink-0"
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
            className="clb-shimmer-light shrink-0"
            style={{ width: 42, height: 42, borderRadius: 12 }}
          />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 rounded clb-shimmer-light" />
            <div className="h-3 w-20 rounded clb-shimmer-light" />
          </div>
        </div>
      ))}
    </div>
  );
}
