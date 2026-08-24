/**
 * Shared row primitives for the social lists surface.
 *
 * Extracted from SocialListPage.tsx so the /golferstofollow page can render
 * pixel-identical rows. SocialListPage continues to import from here — any
 * visual change here affects BOTH pages.
 */
import { useState } from 'react';
import { toast } from '@/lib/toast';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SF_STACK } from '@/components/manage/ui';
import { getAvatarFallbackColor } from '@/lib/avatarFallback';

/* ── type stack ──────────────────────────────────────────────────────
   Colour lives in A (analytical dark ramp) — this surface declares NO
   colour constants. ROW_FONT is the SF stack, sourced from manage/ui. */
export const ROW_FONT = SF_STACK;

/** Minimal shape the shared row primitives operate on. */
export interface RowActorLike {
  actor_type: 'personal' | 'business';
  actor_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  viewer_follows?: boolean;
  // subline fields
  mutual_count?: number;
  mutual_usernames?: string[] | null;
  home_club?: string | null;
  business_location?: string | null;
  business_category?: string | null;
}

/* ── avatar (42px squircle w/ hairline + soft-ink initials) ─────────── */
export function RowAvatar({
  row,
  size = 42,
}: {
  row: RowActorLike;
  size?: number;
}) {
  const initial = (row.display_name ?? row.username ?? '?').charAt(0);
  if (row.actor_type === 'business') {
    if (row.avatar_url) {
      return (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '34%',
            overflow: 'hidden',
            /* LOGO PLATE: #E9ECF2, not white — a club mark must stay legible
               (white knock-outs need a plate) but must not out-rank member ink
               at A.INK. Mirrored in components/business/verification/manageRows. */
            background: '#E9ECF2',
            border: `0.5px solid ${DARK_HAIRLINE}`,
            flexShrink: 0,
          }}
        >
          <img
            src={row.avatar_url}
            alt={row.display_name ?? ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      );
    }
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '34%',
          /* Shared fallback hash — see lib/avatarFallback.ts. Keyed on actor_id
             so a business gets the same colour everywhere it appears. */
          background: getAvatarFallbackColor(row.actor_id),
          border: `0.5px solid ${DARK_HAIRLINE}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          fontWeight: 700,
          color: A.INK,
          flexShrink: 0,
        }}
      >
        {initial}
      </div>
    );
  }
  return (
    <SquircleAvatar
      src={row.avatar_url ?? undefined}
      alt={row.display_name ?? row.username ?? ''}
      size={size}
      fallback={initial}
      hairlineRing
    />
  );
}

/* ── subline (mutuals › home club › business location) ──────────────── */
export function RowSubline({ row }: { row: RowActorLike }) {
  if (row.actor_type === 'business') {
    const loc = row.business_location ?? row.business_category ?? '';
    return (
      <div style={{ fontSize: 11.5, fontWeight: 500, color: A.BODY, marginTop: 1 }}>
        Business{loc ? ` · ${loc}` : ''}
      </div>
    );
  }
  const mutuals = row.mutual_usernames ?? [];
  if ((row.mutual_count ?? 0) > 0 && mutuals.length > 0) {
    const extra = (row.mutual_count ?? 0) - 1;
    return (
      <div style={{ fontSize: 11.5, fontWeight: 500, color: A.BODY, marginTop: 1 }}>
        Followed by @{mutuals[0]}
        {extra > 0 ? ` + ${extra} ${extra === 1 ? 'other' : 'others'}` : ''}
      </div>
    );
  }
  const home = row.home_club;
  if (!home) return null;
  return (
    <div style={{ fontSize: 11.5, fontWeight: 500, color: A.BODY, marginTop: 1 }}>{home}</div>
  );
}

/* ── follow button (near-white action pill; Following = 6% raised fill) ── */
export function FollowButton({
  row,
  onFollowChange,
}: {
  row: RowActorLike;
  /** Optional callback fired after an optimistic toggle so parents can
   *  count selected follows for a bottom bar. */
  onFollowChange?: (following: boolean) => void;
}) {
  const { user: viewer } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const toggle = useToggleFollow();
  const [pending, setPending] = useState(false);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  const isSelf =
    viewer?.id && row.actor_type === 'personal' && row.actor_id === viewer.id;
  if (isSelf) return null;

  const following = optimistic ?? !!row.viewer_follows;
  const viewerActorType: 'personal' | 'business' = activeActor?.type ?? 'personal';
  const viewerActorId = activeActor?.id ?? viewer?.id ?? '';

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!viewer?.id) {
      toast.error('Please sign in');
      return;
    }
    const prev = following;
    setOptimistic(!prev);
    onFollowChange?.(!prev);
    setPending(true);
    try {
      await toggle.mutateAsync({
        targetActorType: row.actor_type,
        targetActorId: row.actor_id,
        targetUserId: row.actor_type === 'personal' ? row.actor_id : undefined,
        viewerActorType,
        viewerActorId,
        viewerUserId: viewer.id,
        isFollowing: prev,
      });
    } catch {
      setOptimistic(prev);
      onFollowChange?.(prev);
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
        height: 30,
        padding: '0 14px',
        borderRadius: 15,
        /* The ACTION is the near-white pill with canvas-dark ink; the
           completed state recedes to a quiet raised fill. */
        background: following ? 'rgba(255,255,255,0.06)' : A.INK,
        color: following ? A.BODY : A.CANVAS,
        border: following ? `1px solid ${A.BORDER}` : 'none',
        fontSize: 12,
        fontWeight: 700,
        fontFamily: ROW_FONT,
        cursor: pending ? 'default' : 'pointer',
        opacity: pending ? 0.7 : 1,
        flexShrink: 0,
      }}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
