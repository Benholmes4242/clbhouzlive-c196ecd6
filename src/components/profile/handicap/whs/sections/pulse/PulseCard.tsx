import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { PulseFriend } from '@/hooks/gam/usePulseFriends';
import { Sparkline, indexTone, toneColor } from '../../charts';
import { useMemberTapResolver } from '@/components/friend-sheet/useMemberTapResolver';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface Props {
  friend: PulseFriend;
}

function relativeDay(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function colorFromUserId(id: string): string {
  const palette = ['#475569', '#7C2D12', '#1E3A8A', '#831843', '#064E3B', '#92400E', '#581C87', '#0F766E'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length];
}

/** Dark-surface LABEL. Nothing on this card renders at weight 800. */
const ZONE_LABEL: React.CSSProperties = {
  fontSize: 7.5,
  fontWeight: 700,
  letterSpacing: '0.16em',
  color: 'var(--hcp-t-40)',
  textTransform: 'uppercase',
};

/** The index slot is a fixed height so a null index cannot shorten a card. */
const INDEX_SLOT = 26;

export const PulseCard: React.FC<Props> = ({ friend }) => {
  const { t } = useTranslation(['common']);
  const { resolve } = useMemberTapResolver();
  // Direction is decided in exactly one place on this surface.
  const s = friend.hcp_series;
  const deltaTone =
    friend.delta90 != null
      ? indexTone(0, friend.delta90)
      : s.length >= 2
        ? indexTone(s[0], s[s.length - 1])
        : 'neutral';
  const isUp = deltaTone === 'up';
  const isDown = deltaTone === 'down';
  // A flat delta renders NOTHING: no dash, no arrow, no zero.
  const showDelta = friend.delta90 != null && deltaTone !== 'neutral';
  const deltaColor = toneColor(deltaTone);
  const lineTone = s.length >= 2 ? indexTone(s[0], s[s.length - 1]) : deltaTone;
  const lastPlayedLabel = relativeDay(friend.last_played);
  const nameForInitial = friend.first_name ?? friend.display_name;
  const initial = (nameForInitial || '?').charAt(0).toUpperCase();
  const avatarBg = colorFromUserId(friend.user_id);

  const runTotal = friend.last5.length;
  const runHits = friend.last5.filter(Boolean).length;
  // hot is "3+ of the last 5 played to handicap" - the same fact the bar
  // shows, so it marks the LABEL amber rather than adding a second shape.
  const runLabel =
    runTotal > 0
      ? t('common:handicap.pulse.toHcp', { n: runHits, m: runTotal })
      : t('common:handicap.pulse.noRecent');

  return (
    <div
      // Another member's handicap page is private to them: the tap resolves
      // to compare, the nudge or an invite. void - the row is fire-and-forget.
      onClick={() => { void resolve({ targetUserId: friend.user_id }); }}
      style={{
        position: 'relative',
        width: 152,
        height: '100%',
        boxSizing: 'border-box',
        flexShrink: 0,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        borderRadius: 13,
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)',
        fontFamily: FONT,
      }}
    >
      {/* Header row: avatar + name/recency */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', width: 32, height: 34, flexShrink: 0 }}>
          {friend.profile_photo_url ? (
            <img
              src={friend.profile_photo_url}
              alt=""
              style={{
                width: 32,
                height: 34,
                borderRadius: '34%',
                objectFit: 'cover',
                background: 'var(--hcp-bg-2)',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 34,
                borderRadius: '34%',
                background: avatarBg,
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {initial}
            </div>
          )}
          {/* Traced hairline overlay -- dark surface canon */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '34%',
              border: '1px solid rgba(255,255,255,0.22)',
              pointerEvents: 'none',
            }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--hcp-t-100)',
              overflowWrap: 'anywhere',
              lineHeight: 1.15,
            }}
          >
            {friend.first_name ?? friend.display_name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--hcp-t-60)', lineHeight: 1, marginTop: 3 }}>
            {lastPlayedLabel}
          </div>
        </div>
      </div>

      {/* Zone A: HANDICAP - the headline figure, now labelled */}
      <div style={{ marginTop: 12 }}>
        <span style={ZONE_LABEL}>{t('common:handicap.pulse.handicap')}</span>
        <div
          style={{
            height: INDEX_SLOT,
            display: 'flex',
            alignItems: 'flex-end',
            marginTop: 3,
            fontSize: 25,
            fontWeight: 700,
            letterSpacing: '-0.045em',
            color: 'var(--hcp-t-100)',
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"kern" 1, "liga" 1',
            lineHeight: 1,
          }}
        >
          {friend.handicap_index != null ? friend.handicap_index.toFixed(1) : null}
        </div>
      </div>

      {/* Zone B: 90 DAYS */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={ZONE_LABEL}>{t('common:handicap.pulse.ninetyDays')}</span>
          {showDelta && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: deltaColor,
                fontVariantNumeric: 'tabular-nums',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                lineHeight: 1,
              }}
            >
              {isUp && <ArrowUp size={9} strokeWidth={3} />}
              {isDown && <ArrowDown size={9} strokeWidth={3} />}
              {Math.abs(friend.delta90 as number).toFixed(1)}
            </span>
          )}
        </div>
        <div style={{ marginTop: 5, height: 18 }}>
          <Sparkline values={friend.hcp_series} tone={lineTone} w={128} h={18} />
        </div>
      </div>

      {/* Zone C: the last-five run, pinned to the bottom of every card */}
      <div style={{ marginTop: 'auto', paddingTop: 14 }}>
        <span style={{ ...ZONE_LABEL, color: friend.hot ? '#F7931E' : 'var(--hcp-t-40)' }}>
          {runLabel}
        </span>
        {runTotal > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {friend.last5.map((hit, i) => (
              <span
                key={i}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 999,
                  background: hit ? '#5EE9A6' : 'rgba(255,255,255,0.14)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PulseCard;
