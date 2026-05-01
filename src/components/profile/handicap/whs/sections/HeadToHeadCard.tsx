import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useFriendsLeaderboard, whsKeys } from '@/lib/whs/hooks';
import { callCreateInvite } from '@/lib/whs/api';
import { firstName, shareInvite } from '@/lib/whs/share';
import type { WhsFriendMatch } from '@/lib/whs/types';
import SectionHeader from './SectionHeader';

interface Props {
  ownerUserId: string;
  currentUserHandicap: number | null | undefined;
}

const AMBER = '#F7931E';
const AMBER_INK = '#9A6116';
const GREEN = '#059669';
const RED = '#9F1D1D';

function initials(name: string): string {
  const fn = firstName(name);
  return fn.slice(0, 2).toUpperCase();
}

const fmtSigned = (n: number) => {
  if (n === 0) return '0.0';
  if (n > 0) return `+${n.toFixed(1)}`;
  return `\u2212${Math.abs(n).toFixed(1)}`;
};

export const HeadToHeadCard: React.FC<Props> = ({
  ownerUserId,
  currentUserHandicap,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: friends, isLoading } = useFriendsLeaderboard(ownerUserId);

  const closestRival = useMemo<WhsFriendMatch | null>(() => {
    if (
      !friends ||
      friends.length === 0 ||
      currentUserHandicap === null ||
      currentUserHandicap === undefined
    )
      return null;
    const candidates = friends
      .filter(
        (f) =>
          f.friend_handicap_index !== null &&
          f.friend_handicap_index !== undefined,
      )
      .map((f) => ({
        f,
        distance: Math.abs(
          (f.friend_handicap_index ?? 0) - currentUserHandicap,
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
    return candidates[0]?.f ?? null;
  }, [friends, currentUserHandicap]);

  if (isLoading) {
    return (
      <section style={{ marginBottom: 24 }}>
        <SectionHeader eyebrow="Closest Rival" title="Loading…" />
        <div
          style={{
            padding: '0 20px 8px',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 12,
            alignItems: 'center',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                margin: '0 auto',
                background: 'rgba(15,23,42,0.06)',
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (
    !closestRival ||
    currentUserHandicap === null ||
    currentUserHandicap === undefined
  ) {
    return null;
  }

  const rivalH = closestRival.friend_handicap_index ?? 0;
  const delta = rivalH - currentUserHandicap;
  const absDelta = Math.abs(delta);
  const rivalFirst = firstName(closestRival.friend_name);

  const recentMissionAvailable =
    !!closestRival.last_round_played_at &&
    Date.now() - new Date(closestRival.last_round_played_at).getTime() <
      30 * 86400_000;
  const lastGross = closestRival.last_round_adjusted_gross;

  const subText = (() => {
    if (delta === 0) return 'Level pegging — every shot counts.';
    const orientationLabel =
      delta > 0
        ? `${absDelta.toFixed(1)} behind you`
        : `${absDelta.toFixed(1)} ahead of you`;
    if (recentMissionAvailable && lastGross !== null && lastGross !== undefined) {
      if (delta < 0) {
        return `${orientationLabel} · Beat ${lastGross} on your next round to leapfrog.`;
      }
      return `${orientationLabel} · ${rivalFirst} won't stop chasing.`;
    }
    return `${orientationLabel} · ${rivalFirst} hasn't played in a while.`;
  })();

  const handleInvite = async () => {
    const res = await callCreateInvite(closestRival.friend_passport_id, 'copy_link');
    if (!res.ok || !res.share_url) {
      toast.error(res.message ?? `Couldn't create invite`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: whsKeys.sentInvites() });
    await shareInvite({
      share_url: res.share_url,
      share_message: res.share_message ?? '',
      invitee_name: res.invitee_name ?? closestRival.friend_name,
    });
  };

  const onVsClick = () => {
    if (closestRival.is_clbhouz_user && closestRival.friend_user_id) {
      navigate(`/p/${closestRival.friend_user_id}`);
    }
  };

  const isVsTappable =
    !!closestRival.is_clbhouz_user && !!closestRival.friend_user_id;

  const deltaColor =
    delta === 0 ? 'rgba(15,23,42,0.45)' : delta > 0 ? GREEN : RED;

  const handicapStyle: React.CSSProperties = {
    fontSize: 26,
    fontFamily: 'Georgia, serif',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    lineHeight: 1,
    color: '#0F172A',
    fontVariantNumeric: 'tabular-nums',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    letterSpacing: '0.18em',
    fontWeight: 700,
    color: 'rgba(15,23,42,0.45)',
    textTransform: 'uppercase',
    marginTop: 6,
  };

  return (
    <section style={{ marginBottom: 24 }}>
      <SectionHeader
        eyebrow="Closest Rival"
        title={`You vs ${rivalFirst}`}
        sub={subText}
      />

      {/* VS layout */}
      <div
        role={isVsTappable ? 'button' : undefined}
        tabIndex={isVsTappable ? 0 : undefined}
        onClick={isVsTappable ? onVsClick : undefined}
        style={{
          padding: '0 20px 8px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 12,
          alignItems: 'center',
          cursor: isVsTappable ? 'pointer' : 'default',
          transition: 'opacity 120ms ease',
        }}
        onMouseDown={(e) => {
          if (isVsTappable) (e.currentTarget as HTMLDivElement).style.opacity = '0.7';
        }}
        onMouseUp={(e) => {
          if (isVsTappable) (e.currentTarget as HTMLDivElement).style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          if (isVsTappable) (e.currentTarget as HTMLDivElement).style.opacity = '1';
        }}
      >
        {/* YOU */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              margin: '0 auto',
              background: 'rgba(247, 147, 30, 0.12)',
              border: `1.5px solid ${AMBER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: AMBER_INK,
            }}
          >
            YOU
          </div>
          <div style={{ ...handicapStyle, marginTop: 8 }}>
            {currentUserHandicap.toFixed(1)}
          </div>
          <div style={labelStyle}>YOU</div>
        </div>

        {/* GAP */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: '0.16em',
              fontWeight: 700,
              color: 'rgba(15,23,42,0.45)',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            GAP
          </div>
          <div
            style={{
              fontSize: 22,
              fontFamily: 'Georgia, serif',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              color: deltaColor,
            }}
          >
            {fmtSigned(delta)}
          </div>
        </div>

        {/* RIVAL */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              margin: '0 auto',
              overflow: 'hidden',
              border: '1px solid rgba(15,23,42,0.10)',
              background: 'rgba(15,23,42,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 800,
              color: '#0F172A',
            }}
          >
            {closestRival.friend_thumbnail_url ? (
              <img
                src={closestRival.friend_thumbnail_url}
                alt={closestRival.friend_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initials(closestRival.friend_name)
            )}
          </div>
          <div style={{ ...handicapStyle, marginTop: 8 }}>
            {rivalH.toFixed(1)}
          </div>
          <div style={labelStyle}>{rivalFirst.toUpperCase()}</div>
        </div>
      </div>

      {/* Invite link — only for non-clbhouz rival */}
      {!closestRival.is_clbhouz_user && (
        <div style={{ padding: '8px 20px 0', textAlign: 'center' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleInvite();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 800,
              color: AMBER,
              letterSpacing: '0.04em',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Invite {rivalFirst} for live rivalry tracking →
          </button>
        </div>
      )}
    </section>
  );
};

export default HeadToHeadCard;
