import React, { useMemo } from 'react';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { initials } from '@/lib/whs/utils/initials';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import { useRivalryDimension } from '@/lib/whs/utils/useRivalryDimension';
import { rivalKey } from '@/lib/whs/utils/rivalryTiering';
import {
  RIVALRY_STATE_TOKENS,
  rivalryStateFor,
} from './_shared/rivalryTokens';
import { computeStreak, fmtDaysAgo } from './_shared/streakUtils';

const FONT_GEIST =
  'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  rivalry: FriendRivalryHydrated;
  onTap?: () => void;
}

function truncate(s: string, max = 15): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/**
 * Compact list row used by the Manage Rivals sheet. Every rival shares
 * the universal "RIVAL" eyebrow — tier badges (ARCHRIVAL/RECENT) were
 * retired with the Fight Card redesign.
 */
export const RivalListRow: React.FC<Props> = ({ rivalry, onTap }) => {
  const key = rivalKey(rivalry);
  const [dimension] = useRivalryDimension(key);
  const record =
    (dimension === 'gross' ? rivalry.gross_record : rivalry.stableford_record) ?? {
      wins: 0,
      losses: 0,
      ties: 0,
    };
  const results = rivalry.shared_round_results ?? [];
  const state = rivalryStateFor(record.wins, record.losses, rivalry.shared_rounds_count ?? 0);
  const tokens = RIVALRY_STATE_TOKENS[state];
  const streak = useMemo(() => computeStreak(results, dimension), [results, dimension]);

  const rivalDisplayName = reformatFriendName(rivalry.rival_name ?? 'Unknown');
  const lastResult = useMemo(() => {
    if (!results.length) return null;
    return [...results].sort(
      (a, b) => new Date(b.play_date).getTime() - new Date(a.play_date).getTime(),
    )[0];
  }, [results]);

  const sorted = [...results]
    .sort((a, b) => new Date(b.play_date).getTime() - new Date(a.play_date).getTime())
    .slice(0, 5);
  const pad: (typeof sorted[number] | null)[] = [...sorted];
  while (pad.length < 5) pad.push(null);

  const stripeColor = state === 'winning' ? '#F7931E' : state === 'losing' ? 'var(--hcp-bad)' : null;

  const tappable = typeof onTap === 'function';
  const Tag: any = tappable ? 'button' : 'div';

  return (
    <Tag
      {...(tappable ? { type: 'button' as const, onClick: onTap } : {})}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        textAlign: 'left',
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: 14,
        overflow: 'hidden',
        background: 'var(--hcp-bg-1)',
        fontFamily: FONT_GEIST,
        padding: 0,
        cursor: tappable ? 'pointer' : 'default',
      }}
    >
      {stripeColor && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: 3,
            background: stripeColor,
          }}
        />
      )}

      <div style={{ padding: '12px 14px 10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: (() => {
                const src = pickAvatarSrc(
                  rivalry.rival_thumbnail_url,
                  rivalry.rival_profile_photo_url,
                );
                return src ? `url(${src}) center/cover no-repeat` : 'rgba(255,255,255,0.08)';
              })(),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--hcp-t-60)',
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {!pickAvatarSrc(rivalry.rival_thumbnail_url, rivalry.rival_profile_photo_url) &&
              initials(rivalDisplayName)}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: 'var(--hcp-t-60)',
                marginBottom: 2,
              }}
            >
              ★ RIVAL
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--hcp-t-100)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {rivalDisplayName}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--hcp-t-60)',
                marginTop: 1,
              }}
            >
              HCP {fmtHcp(rivalry.rival_handicap)} · {rivalry.shared_rounds_count} rounds
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 2,
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 800,
              fontSize: 20,
              letterSpacing: '-0.02em',
            }}
          >
            <span style={{ color: tokens.selfNumColor }}>{record.wins}</span>
            <span style={{ color: 'var(--hcp-t-40)', fontSize: 18 }}>{'\u2014'}</span>
            <span style={{ color: tokens.rivalNumColor }}>{record.losses}</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12,
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 4 }}>
            {pad.map((r, i) => {
              const outcome = r
                ? dimension === 'gross' ? r.gross_outcome : r.stableford_outcome
                : null;
              let bg: string = tokens.pillEmptyBg;
              let color = 'rgba(255,255,255,0.30)';
              let letter = '';
              if (outcome === 'W') { bg = tokens.pillWinGradient; color = '#0F172A'; letter = 'W'; }
              else if (outcome === 'L') { bg = tokens.pillLossBg; color = '#FFFFFF'; letter = 'L'; }
              else if (outcome === 'T') { bg = tokens.pillTieBg; color = '#FFFFFF'; letter = 'T'; }
              return (
                <div
                  key={i}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    background: bg,
                    color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 800,
                  }}
                >
                  {letter}
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
            }}
          >
            {streak && streak.count >= 2 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.10em',
                  color: streak.who === 'you' ? '#FBBC2E' : 'var(--hcp-bad)',
                  whiteSpace: 'nowrap',
                }}
              >
                {streak.count}{streak.who === 'you' ? 'W' : 'L'} STREAK
              </span>
            )}
            {lastResult && (
              <span
                style={{
                  fontSize: 10,
                  color: 'var(--hcp-t-40)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 140,
                }}
              >
                {fmtDaysAgo(lastResult.play_date)}
                {lastResult.course_name && ` · ${truncate(lastResult.course_name)}`}
              </span>
            )}
          </div>
        </div>
      </div>
    </Tag>
  );
};

export default RivalListRow;
