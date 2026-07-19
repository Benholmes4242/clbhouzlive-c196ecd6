import React from 'react';
import { Crown, Swords, type LucideIcon } from 'lucide-react';
import type { LegendCategory } from '@/lib/gam/types';
import {
  ChampionsListRow,
  CHAMPS_GRID_COMPACT,
  CHAMPS_GRID_GAP_COMPACT,
  CHAMPS_ROW_PADDING_X,
} from './ChampionsListRow';
import { MovementCell } from './_shared/MovementCell';
import { duelLine, chaseProgress } from './_shared/duelTension';
import { ProBenchmarkBand } from './ProBenchmarkBand';
import type { ProProfile, ProBandBase } from './_shared/proBenchmark';
import { SectionHeader } from '@/components/ui/SectionHeader';

export interface DuelRow {
  rank: number;
  name: string;
  photoUrl: string | null;
  valueDisplay: string;
  value: number;
  isSelf: boolean;
  gapToChampion: string | null;
  userId?: string | null;
  /** 30-day movement inputs. */
  rank30d?: number | null;
  delta?: number | null;
}

interface ChampionsDuelCardProps {
  category: LegendCategory;
  categoryLabel: string;
  categoryIcon: LucideIcon;
  rows: DuelRow[];
  yourRank: number | null;
  holdDuration: string;
  totalCount: number;
  onFullLeaderboardTap: () => void;
  proBenchmark?: {
    pro: ProProfile;
    base: ProBandBase;
    value: string;
    sub: string;
    chaseLine?: string;
  } | null;
  /** Backdrop theme for the embedded rows/avatars. Default 'dark'. */
  theme?: 'light' | 'dark';
  /** When true, section sits on a soft alternating band (matches the
   *  course-records ledger on the discover page). No card chrome either way. */
  banded?: boolean;
}


const INK = 'var(--hcp-t-100)';
const INK_55 = 'var(--hcp-t-60)';
const DEEP_AMBER = 'var(--hcp-amber)';
const GOLD = '#FBBC2E';

const SQUIRCLE_MASK_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M40 0h20c22.091 0 40 17.909 40 40v20c0 22.091-17.909 40-40 40H40C17.909 100 0 82.091 0 60V40C0 17.909 17.909 0 40 0z'/%3E%3C/svg%3E\")";
const squircleMaskStyle: React.CSSProperties = {
  WebkitMaskImage: SQUIRCLE_MASK_URL,
  maskImage: SQUIRCLE_MASK_URL,
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
};

function ChampionsSquircle({ photoUrl, size = 38, dashed = false, ringColor = 'rgba(255,255,255,0.22)' }: { photoUrl: string | null; size?: number; dashed?: boolean; ringColor?: string }) {
  if (dashed) {
    // Dashed = empty-slot ghost, not an avatar — canon exception, no hairline overlay.
    return (
      <div
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: '34%',
          border: '1.5px dashed var(--hcp-dash)',
          flexShrink: 0,
        }}
      />
    );
  }
  const photoBg = photoUrl
    ? `url(${photoUrl}) center/cover`
    : 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)';
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }} aria-hidden>
      <div style={{ position: 'absolute', inset: 0, background: photoBg, ...squircleMaskStyle }} />
      {/* Traced hairline (theme-aware) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '34%',
          border: `1px solid ${ringColor}`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

/** Mini avatar (22px squircle) for the chase track. Crowned variant adds the mini crown. */
function TrackFace({
  entry,
  crowned = false,
  style,
  ringColor = 'rgba(15,23,42,0.10)',
}: {
  entry: DuelRow | null;
  crowned?: boolean;
  style?: React.CSSProperties;
  ringColor?: string;
}) {
  const size = 22;
  const photoUrl = entry?.photoUrl ?? null;
  const initials = (entry?.name ?? '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || '?';
  const photoBg = photoUrl
    ? `url(${photoUrl}) center/cover`
    : 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)';
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0, ...style }} aria-hidden>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: photoBg,
          borderRadius: '34%',
          overflow: 'hidden',
          boxShadow: `0 1px 3px rgba(15,23,42,0.18), inset 0 0 0 1px ${ringColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '-0.01em',
        }}
      >
        {!photoUrl && initials}
      </div>
      {crowned && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -6,
            left: -3,
            transform: 'rotate(-18deg)',
            lineHeight: 0,
          }}
        >
          <Crown size={10} fill={GOLD} color={DEEP_AMBER} strokeWidth={2.4} />
        </div>
      )}
    </div>
  );
}

function firstName(name: string): string {
  if (!name) return name;
  if (name === 'You') return 'You';
  return name.split(' ')[0];
}

export const ChampionsDuelCard: React.FC<ChampionsDuelCardProps> = ({
  category,
  categoryLabel,
  categoryIcon: CatIcon,
  rows,
  yourRank,
  holdDuration,
  totalCount,
  onFullLeaderboardTap,
  proBenchmark,
  theme = 'dark',
  banded = false,
}) => {
  const isLight = theme === 'light';
  const avatarRing = isLight ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.22)';

  // Track mini-avatars: preserve current dark rendering (slate 10%) so the
  // handicap compete drilldown stays pixel-for-pixel. Light theme uses the
  // canonical ink-12% traced hairline.
  const trackRing = isLight ? 'rgba(15,23,42,0.12)' : 'rgba(15,23,42,0.10)';
  const champion = rows[0];
  const defending = champion?.isSelf === true;
  const standsAlone = rows.length === 1;
  const selfRow = rows.find((r) => r.isSelf) ?? null;
  const selfOnBoard = selfRow != null;

  // Right side opponent
  let right: DuelRow | null = null;
  if (defending) {
    right = rows[1] ?? null;
  } else {
    right = selfRow;
  }

  // (legacy showBar removed — chase track uses showTrack below)
  const leftValue = champion?.value ?? 0;
  const rightValue = right?.value ?? 0;

  // Chase track participants — champion = crown holder, chaser = the other face.
  const trackChampion: DuelRow | null = champion ?? null;
  const trackChaser: DuelRow | null = defending ? (right ?? null) : selfRow;
  const showTrack = !standsAlone && trackChampion != null && trackChaser != null;
  const rawProgress = showTrack
    ? chaseProgress(category, trackChampion!.value, trackChaser!.value)
    : 0;
  const pos = Math.max(0.04, Math.min(0.90, rawProgress));

  let line: string;
  let isNormalDuelLine = false;
  if (standsAlone) {
    line = 'The champion stands alone. Be the first to challenge.';
  } else if (!selfOnBoard && !defending) {
    line = 'Not on the board yet — log a round here';
  } else if (defending && !right) {
    line = 'The champion stands alone. Be the first to challenge.';
  } else {
    line = duelLine(category, leftValue, rightValue, defending, false, (champion?.name ?? '').split(' ')[0]);
    isNormalDuelLine = true;
  }
  if (isNormalDuelLine && proBenchmark?.chaseLine) {
    line = `${line} — ${proBenchmark.chaseLine}`;
  }

  // Status pill text
  const pillText = defending
    ? `DEFENDING · ${holdDuration.toUpperCase()}`
    : yourRank != null
      ? `CHASE · YOU'RE #${yourRank}`
      : 'CHASE';

  // Inline ranks 2–5
  const inlineRows = rows.filter((r) => r.rank >= 2 && r.rank <= 5);

  return (
    <div
      data-category-section
      style={{
        background: 'var(--hcp-bg-1)',
        border: '0.5px solid var(--hcp-line)',
        borderTop: defending ? `2px solid ${GOLD}` : '0.5px solid var(--hcp-line)',
        borderRadius: 16,
        padding: '12px 16px',
        margin: '0 16px 12px',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SectionHeader
            role="section"
            kicker={categoryLabel.toUpperCase()}
            inlineIcon
            icon={CatIcon}
          />
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.10em',
            padding: '3px 8px',
            borderRadius: 999,
            background: defending ? 'rgba(251,188,46,0.16)' : 'var(--hcp-tint-1)',
            color: defending ? DEEP_AMBER : INK_55,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {pillText}
        </span>
      </div>

      {proBenchmark && (
        <ProBenchmarkBand
          pro={proBenchmark.pro}
          base={proBenchmark.base}
          value={proBenchmark.value}
          sub={proBenchmark.sub}
        />
      )}

      {/* Duel row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
        {/* LEFT: crown holder */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span
            aria-hidden
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: DEEP_AMBER,
              fontVariantNumeric: 'tabular-nums',
              width: 12,
              textAlign: 'right',
              flexShrink: 0,
            }}
          >
            1
          </span>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <ChampionsSquircle photoUrl={champion?.photoUrl ?? null} size={38} ringColor={avatarRing} />
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: -7,
                left: -4,
                transform: 'rotate(-18deg)',
                lineHeight: 0,
              }}
            >
              <Crown size={13} fill={GOLD} color={DEEP_AMBER} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: INK,
                letterSpacing: '-0.01em',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-word',
              }}
            >
              {firstName(champion?.name ?? '—')}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: INK,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                {champion?.valueDisplay ?? '—'}
              </span>
              {champion && champion.delta != null && champion.delta !== 0 && (
                <MovementCell
                  delta={champion.delta}
                  rank30d={champion.rank30d}
                  theme={theme}
                  size="chip"
                />
              )}
            </span>
          </div>
        </div>

        {/* CENTER */}
        <Swords size={15} color="var(--hcp-t-40)" strokeWidth={2} aria-hidden />

        {/* RIGHT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, justifyContent: 'flex-end' }}>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: INK,
                letterSpacing: '-0.01em',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-word',
                maxWidth: '100%',
              }}
            >
              {defending
                ? right ? firstName(right.name) : '—'
                : selfOnBoard ? 'You' : 'You'}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              {(() => {
                const rightEntry = defending ? right : selfRow;
                if (rightEntry && rightEntry.delta != null && rightEntry.delta !== 0) {
                  return (
                    <MovementCell
                      delta={rightEntry.delta}
                      rank30d={rightEntry.rank30d}
                      theme={theme}
                      size="chip"
                    />
                  );
                }
                return null;
              })()}
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: INK,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                {defending
                  ? right ? right.valueDisplay : '—'
                  : selfOnBoard ? (selfRow?.valueDisplay ?? '—') : '—'}
              </span>
            </span>
          </div>
          {defending ? (
            right ? (
              <ChampionsSquircle photoUrl={right.photoUrl} size={38} ringColor={avatarRing} />
            ) : (
              <ChampionsSquircle photoUrl={null} size={38} dashed />
            )
          ) : selfOnBoard ? (
            <ChampionsSquircle photoUrl={selfRow?.photoUrl ?? null} size={38} ringColor={avatarRing} />
          ) : (
            <ChampionsSquircle photoUrl={null} size={38} dashed />
          )}
        </div>
      </div>

      {/* Chase track: champion at the finish, chaser travelling toward them */}
      {showTrack && (
        <div style={{ position: 'relative', height: 30, marginTop: 11 }}>
          {/* rail */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              height: 4,
              transform: 'translateY(-50%)',
              borderRadius: 999,
              background: 'var(--hcp-bar-neutral)',
            }}
          />
          {/* progress fill behind the chaser */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              height: 4,
              width: `${pos * 100}%`,
              transform: 'translateY(-50%)',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #FBBC2E, #F7931E)',
              transition: 'width 400ms cubic-bezier(.2,.8,.2,1)',
            }}
          />
          {/* quarter notches */}
          {[0.25, 0.5, 0.75].map((p) => (
            <div
              key={p}
              style={{
                position: 'absolute',
                left: `${p * 100}%`,
                top: '50%',
                width: 1,
                height: 8,
                transform: 'translate(-50%,-50%)',
                background: 'var(--hcp-line)',
              }}
            />
          ))}
          {/* chaser mini-avatar */}
          <TrackFace
            entry={trackChaser}
            ringColor={trackRing}
            style={{
              position: 'absolute',
              left: `calc(${(1 - pos) * 100}% - 11px)`,
              top: '50%',
              transform: 'translateY(-50%)',
              transition: 'left 400ms cubic-bezier(.2,.8,.2,1)',
            }}
          />
          {/* champion mini-avatar at the finish, crowned */}
          <TrackFace
            entry={trackChampion}
            crowned
            ringColor={trackRing}
            style={{
              position: 'absolute',
              left: -2,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
        </div>
      )}

      {/* Line */}
      <div
        style={{
          marginTop: showTrack ? 8 : 12,
          fontSize: 11,
          fontWeight: 600,
          color: defending ? DEEP_AMBER : INK_55,
        }}
      >
        {line}
      </div>

      {/* Inline top 5 */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 4,
          borderTop: '0.5px solid var(--hcp-line)',
          marginLeft: -16,
          marginRight: -16,
        }}
      >
        {standsAlone ? null : (
          <>
            {/* Column header — matches the compact list row grid so 30D and
                SCORE sit exactly above their columns in both themes. */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: CHAMPS_GRID_COMPACT,
                gap: CHAMPS_GRID_GAP_COMPACT,
                alignItems: 'center',
                padding: `6px ${CHAMPS_ROW_PADDING_X}px 4px`,
                borderBottom: '0.5px solid var(--hcp-line)',
              }}
            >
              <span />
              <span />
              <span />
              <span
                style={{
                  textAlign: 'center',
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: INK_55,
                }}
              >
                30D
              </span>
              <span
                style={{
                  textAlign: 'center',
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: INK_55,
                }}
              >
                SCORE
              </span>
            </div>
            {inlineRows.map((row, i) => (
              <ChampionsListRow
                key={`${row.rank}-${i}`}
                rank={row.rank}
                name={row.name}
                photoUrl={row.photoUrl}
                valueDisplay={row.valueDisplay}
                unitLabel=""
                isSelf={row.isSelf}
                isChampion={false}
                gapToChampion={row.gapToChampion}
                holdDuration={null}
                compact
                theme={theme}
                rank30d={row.rank30d}
                delta={row.delta}
              />
            ))}
          </>
        )}
        <div style={{ padding: '8px 16px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onFullLeaderboardTap}
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: INK,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {totalCount > 5 ? `FULL LEADERBOARD (${totalCount}) ›` : 'FULL LEADERBOARD ›'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChampionsDuelCard;
