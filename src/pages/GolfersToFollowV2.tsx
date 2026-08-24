/**
 * GolfersToFollowV2 — reason-led suggestions page.
 *
 * REUSES the search overlay's `useSearchEmptyStateV2` RPC (single source
 * of truth for people-to-follow) and the shared row primitives from
 * social-lists-v2/rowParts (identical avatars / sublines / follow pill).
 *
 * RPC field mapping used for the reason eyebrow:
 *   suggested_people[].reason_type   — one of 'followed_by' | 'plays' | 'popular' | …
 *   suggested_people[].reason_detail — human copy (e.g. "@alex", "Pebble Beach")
 * When neither is present we fall back to 'SUGGESTED FOR YOU'.
 * Fields NOT exposed by the RPC today: mutual_count, home_club,
 * business_location. The shared subline gracefully hides when missing.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ChevronRight } from 'lucide-react';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useSearchEmptyStateV2, type EmptyStateSuggestion } from '@/features/search-v2/hooks/useSearchEmptyStateV2';
import { getProfilePathById } from '@/lib/profileRoutes';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import {
  RowAvatar,
  RowSubline,
  FollowButton,
  ROW_FONT,
  type RowActorLike,
} from '@/features/social-lists-v2/rowParts';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { ListSkeleton } from '@/features/social-lists-v2/SocialListPage';



/* ── reason eyebrow copy mapping ─────────────────────────────────────── */
function reasonEyebrow(s: EmptyStateSuggestion): string {
  const detail = (s.reason_detail ?? '').trim();
  switch (s.reason_type) {
    case 'followed_by':
      return detail ? `FOLLOWED BY @${detail.replace(/^@/, '').toUpperCase()}` : 'FOLLOWED BY FRIENDS';
    case 'plays':
      return detail ? `PLAYS ${detail.toUpperCase()}` : 'PLAYS COURSES YOU FOLLOW';
    case 'popular':
      return 'POPULAR ON CLBHOUZ';
    default:
      return 'SUGGESTED FOR YOU';
  }
}

/* ── adapter: EmptyStateSuggestion → RowActorLike ────────────────────── */
function toRow(s: EmptyStateSuggestion): RowActorLike {
  return {
    actor_type: 'personal',
    actor_id: s.id,
    display_name: s.display_name,
    username: s.username,
    avatar_url: s.profile_photo_url,
    viewer_follows: false,
    mutual_count: s.reason_type === 'followed_by' ? 1 : 0,
    mutual_usernames: s.reason_type === 'followed_by' && s.reason_detail
      ? [s.reason_detail.replace(/^@/, '')]
      : null,
    home_club: s.reason_type === 'plays' ? s.reason_detail : null,
  };
}

export default function GolfersToFollowV2() {
  const navigate = useNavigate();
  const { user: viewer } = useSupabaseSession();
  const q = useSearchEmptyStateV2(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const people = useMemo(
    () => (q.data?.suggested_people ?? []).filter((s) => !viewer?.id || s.id !== viewer.id),
    [q.data?.suggested_people, viewer?.id],
  );

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/clubhouse');
  };

  const onFollowChange = (id: string) => (following: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (following) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const openProfile = (id: string) => {
    const path = getProfilePathById(id);
    if (path) navigate(path);
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: A.CANVAS,
        fontFamily: ROW_FONT,
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 108px)',
      }}
    >
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>
        {/* Back pill */}
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 34,
            padding: '0 12px 0 10px',
            borderRadius: 17,
            background: A.PANEL,
            border: `0.5px solid ${A.BORDER}`,
            color: A.INK,
            fontSize: 12.5,
            fontWeight: 600,
            fontFamily: ROW_FONT,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={15} strokeWidth={2.2} />
          Back
        </button>

        {/* Masthead */}
        <div style={{ marginTop: 18, marginBottom: 18 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.16em',
              color: A.AMBER,
              textTransform: 'uppercase',
            }}
          >
            Build your clubhouse
          </div>
          <h1
            style={{
              margin: '6px 0 4px',
              fontSize: 26,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              fontWeight: 700,
              color: A.INK,
            }}
          >
            Golfers to follow
          </h1>
          <div style={{ fontSize: 13, fontWeight: 500, color: A.BODY }}>
            Fill your feed with players, friends, and courses you care about.
          </div>
        </div>

        {/* Body */}
        {q.isLoading ? (
          <Card title="SUGGESTED FOR YOU">
            <ListSkeleton />
          </Card>
        ) : q.isError ? (
          <Card title="SUGGESTED FOR YOU">
            <ErrorBlock onRetry={() => q.refetch()} />
          </Card>
        ) : people.length === 0 ? (
          <Card title="SUGGESTED FOR YOU">
            <EmptyBlock onFind={() => navigate('/search')} />
          </Card>
        ) : (
          <>
            <Card title="SUGGESTED FOR YOU">
              {people.map((s, i) => (
                <SuggestionRow
                  key={s.id}
                  suggestion={s}
                  eyebrow={reasonEyebrow(s)}
                  showDivider={i < people.length - 1}
                  onFollowChange={onFollowChange(s.id)}
                  onOpen={() => openProfile(s.id)}
                />
              ))}
            </Card>

            <div style={{ height: 16 }} />

            <Card title="VERIFIED ON CLBHOUZ">
              <div
                style={{
                  padding: '18px 16px',
                  fontSize: 12.5,
                  color: A.BODY,
                  fontWeight: 500,
                }}
              >
                No verified accounts to show yet.
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          padding:
            'calc(env(safe-area-inset-bottom, 0px) + 12px) 16px calc(env(safe-area-inset-bottom, 0px) + 16px)',
          background: `linear-gradient(180deg, rgba(21,23,31,0) 0%, ${A.CANVAS} 40%)`,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            width: '100%',
            maxWidth: 520,
          }}
        >
          <button
            type="button"
            onClick={goBack}
            style={{
              flex: '0 0 auto',
              height: 46,
              padding: '0 18px',
              borderRadius: 23,
              background: 'transparent',
              border: `1px solid ${A.BORDER}`,
              color: A.BODY,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: ROW_FONT,
              cursor: 'pointer',
            }}
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={goBack}
            disabled={selected.size < 1}
            style={{
              flex: 1,
              height: 46,
              borderRadius: 23,
              background: selected.size >= 1 ? A.INK : 'rgba(255,255,255,0.08)',
              color: selected.size >= 1 ? A.CANVAS : 'rgba(248,250,252,0.38)',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: ROW_FONT,
              cursor: selected.size >= 1 ? 'pointer' : 'default',
            }}
          >
            {selected.size >= 1 ? `Continue · following ${selected.size}` : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── card shell ─────────────────────────────────────────────────────── */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: A.PANEL,
        borderRadius: 16,
        border: `0.5px solid ${A.BORDER}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 16px 10px',
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
          color: A.BODY,
        }}
      >
        {title}
      </div>
      <div>{children}</div>
    </section>
  );
}

/* ── suggestion row (shared parts + amber eyebrow) ──────────────────── */
function SuggestionRow({
  suggestion,
  eyebrow,
  showDivider,
  onFollowChange,
  onOpen,
}: {
  suggestion: EmptyStateSuggestion;
  eyebrow: string;
  showDivider: boolean;
  onFollowChange: (following: boolean) => void;
  onOpen: () => void;
}) {
  const row = toRow(suggestion);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 16px',
        cursor: 'pointer',
        borderTop: showDivider ? undefined : undefined,
        borderBottom: showDivider ? `0.5px solid ${A.BORDER}` : undefined,
      }}
    >
      <RowAvatar row={row} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: A.AMBER,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: 2,
          }}
        >
          {eyebrow}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: A.INK,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {row.display_name ?? row.username}
          </div>
        </div>
        <RowSubline row={row} />
      </div>
      <FollowButton row={row} onFollowChange={onFollowChange} />
    </div>
  );
}

/* ── error / empty blocks (in-card) ──────────────────────────────────── */
function ErrorBlock({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      style={{
        padding: '28px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        color: A.BODY,
        fontSize: 13,
      }}
    >
      Couldn't load suggestions
      <button
        type="button"
        onClick={onRetry}
        style={{
          background: A.INK,
          color: A.CANVAS,
          border: 'none',
          borderRadius: 999,
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: ROW_FONT,
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
    </div>
  );
}

function EmptyBlock({ onFind }: { onFind: () => void }) {
  return (
    <div
      style={{
        padding: '28px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        color: A.BODY,
        fontSize: 13,
        textAlign: 'center',
      }}
    >
      No suggestions right now
      <button
        type="button"
        onClick={onFind}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: A.INK,
          color: A.CANVAS,
          border: 'none',
          borderRadius: 999,
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: ROW_FONT,
          cursor: 'pointer',
        }}
      >
        <Search size={14} strokeWidth={2.4} />
        Find golfers
        <ChevronRight size={14} strokeWidth={2.4} />
      </button>
    </div>
  );
}

// Kept import to satisfy tree-shaking in case future rows need it.
void VerifiedBadge;
