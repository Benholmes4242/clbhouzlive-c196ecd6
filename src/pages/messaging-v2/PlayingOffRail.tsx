/**
 * BRIEF_GROUP_THREAD_PLAYING_OFF — every group member's handicap index.
 *
 * Indexes come ONLY from get_visible_handicaps (gated on can_view_handicap).
 * A withheld index returns no row, identical to no index. No row = em dash.
 * NEVER replace the dash with "Hidden"/"Private"/a lock/0 — that would leak
 * the distinction the RPC exists to hide.
 *
 * Renders nothing when no member has an index. No amber: "You" identifies the
 * viewer (amber in Messages is reserved for the member's own shared-round score).
 */
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fmtHcp } from '@/lib/whs/format';
import { MSG, MT } from '@/features/messaging-dark/tokens';
import type { ConversationMember } from '@/types/messaging';
import { MemberRailTile } from './MemberRailTile';

interface Props {
  members: ConversationMember[];
  viewerActorType: string | null;
  viewerActorId: string | null;
}

export const PlayingOffRail: React.FC<Props> = ({ members, viewerActorType, viewerActorId }) => {
  const { t } = useTranslation('messaging');
  const navigate = useNavigate();

  const personalIds = useMemo(
    () => members.filter((m) => m.actor_type === 'personal').map((m) => m.actor_id).sort(),
    [members],
  );

  const { data: byId } = useQuery({
    queryKey: ['messaging', 'playing-off', personalIds],
    enabled: personalIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_visible_handicaps', { p_ids: personalIds });
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const r of (data ?? []) as { user_id: string; handicap_index: number | null }[]) {
        if (r.handicap_index != null && Number.isFinite(Number(r.handicap_index))) {
          map[r.user_id] = Number(r.handicap_index);
        }
      }
      return map;
    },
  });

  const ordered = useMemo(() => {
    const idx = byId ?? {};
    const withIdx = members
      .filter((m) => m.actor_type === 'personal' && idx[m.actor_id] != null)
      .sort((a, b) => idx[a.actor_id] - idx[b.actor_id]);
    const without = members.filter((m) => !(m.actor_type === 'personal' && idx[m.actor_id] != null));
    return { withIdx, without, idx };
  }, [members, byId]);

  if (ordered.withIdx.length === 0) return null;

  const bubbleBase: React.CSSProperties = {
    display: 'inline-block',
    borderRadius: 10,
    padding: '4px 8px',
    fontSize: 12,
    letterSpacing: '-0.01em',
    fontVariantNumeric: 'tabular-nums',
    marginBottom: 6,
    whiteSpace: 'nowrap',
  };

  const tile = (m: ConversationMember) => {
    const isYou = m.actor_type === viewerActorType && m.actor_id === viewerActorId;
    const value = m.actor_type === 'personal' ? ordered.idx[m.actor_id] : undefined;
    const bubble =
      value != null ? (
        <span style={{ ...bubbleBase, background: 'rgba(255,255,255,0.09)', color: MSG.INK, fontWeight: 700 }}>
          {fmtHcp(value)}
        </span>
      ) : (
        <span style={{ ...bubbleBase, background: 'rgba(255,255,255,0.05)', color: MSG.INK_3, fontWeight: 600 }}>
          {'\u2014'}
        </span>
      );
    const first = (m.name ?? '').trim().split(/\s+/)[0] || m.name || '';
    return (
      <MemberRailTile
        key={`${m.actor_type}-${m.actor_id}`}
        width={66}
        nameGap={6}
        hairlineRing
        avatarUrl={m.avatar_url}
        userId={m.actor_type === 'personal' ? m.actor_id : null}
        name={m.name ?? ''}
        label={isYou ? t('shared.you', { defaultValue: 'You' }) : first}
        bubble={bubble}
        onClick={() =>
          m.actor_type === 'business'
            ? navigate(`/business/${m.actor_id}`)
            : navigate(`/profile/${m.username ?? m.actor_id}`)
        }
      />
    );
  };

  return (
    <div>
      <div style={{ ...MT.EYEBROW, padding: '10px 14px 8px' }}>
        {t('playingOff.eyebrow', { defaultValue: 'Playing off' })}
      </div>
      <div className="msg-rail" style={{ gap: 12, padding: '0 14px 14px' }}>
        {ordered.withIdx.map(tile)}
        {ordered.without.map(tile)}
      </div>
    </div>
  );
};

export default PlayingOffRail;
