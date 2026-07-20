/**
 * AlmanacBoards — Tour Leaders full-bleed banded boards (approved mock:
 * leaders-almanac). Replaces the white StatBoard card chrome with the
 * Discover Almanac language: full-width 0.5px hairlines, 3.5% alt-row
 * banding, 14px side padding. Four anatomies dispatched by metric shape:
 *
 *   WorldBoard     — rank/points marquee (champion band + top 4)
 *   MoneyBoard     — currency/higher-is-better power bars (top 3)
 *   ScoringBoard   — lower-is-better averages with computed "+X behind" (top 3)
 *   WinnersCircle  — horizontal chip rail for wins/counts (all >0)
 *
 * Data hooks unchanged; `onOpen` still opens the shared FullListSheet.
 * Live-dot rendering + player nav preserved.
 */

import { memo, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import CountryFlag from '@/components/ui/country-flag';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
import {
  AMBER,
  AMBER_BORDER,
  FONT,
  INK,
  INK_FAINT,
  INK_MUTE,
} from '../../_shared/tokens';
import type { LeaderCategoryDef, LeaderRow } from '../data/useLeaderCategories';
import type { LivePlayerMap } from '../../players-v2/data/useLivePlayerIds';

// ── Almanac tokens (page-local, matched to Discover Almanac) ──────────
const HAIRLINE = 'rgba(15,23,42,0.08)';
const BAND_ALT = 'rgba(15,23,42,0.035)';
const CHAMP_BAND = 'linear-gradient(100deg, rgba(255,255,255,0.6), #fff6e8)';
const PAD_X = 14;
const LIVE_GREEN = '#10B981';

interface BoardBaseProps {
  category: LeaderCategoryDef;
  liveMap: LivePlayerMap;
  onOpen: () => void;
}

// ── Section header (overline + title + Full list link) ────────────────
function SectionHead({
  overline,
  title,
  onOpen,
}: {
  overline: string;
  title: string;
  onOpen: () => void;
}) {
  const { t } = useTranslation('tourhub');
  return (
    <div
      style={{
        padding: `0 ${PAD_X}px 8px`,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: INK_MUTE,
            lineHeight: 1,
          }}
        >
          {overline}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: INK,
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>
      </div>
      <button
        type="button"
        onClick={onOpen}
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: AMBER,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: FONT,
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {t('leaders.fullList')}
        <ChevronRight size={12} />
      </button>
    </div>
  );
}

// ── Shared row atoms ──────────────────────────────────────────────────
function PlayerCell({
  row,
  size,
  nameSize,
  nameWeight,
  liveMap,
  onTap,
  ringColor,
}: {
  row: LeaderRow;
  size: number;
  nameSize: number;
  nameWeight: number;
  liveMap: LivePlayerMap;
  onTap: (pid: string) => void;
  ringColor?: string;
}) {
  const live = liveMap[row.playerId];
  const candidates = resolvePlayerAvatarCandidates({
    name: row.name,
    photoUrl: row.photoUrl,
    tourSlug: row.tourCode ?? 'pga',
  });
  return (
    <button
      type="button"
      onClick={() => onTap(row.playerId)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        minWidth: 0,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontFamily: FONT,
        textAlign: 'left',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <SquircleAvatar
          size={size}
          srcCandidates={candidates}
          alt={row.name}
          userId={row.playerId}
          hairlineRing
          ringColor={ringColor ?? LIGHT_HAIRLINE}
        />
        {live && (
          <span
            style={{
              position: 'absolute',
              top: 1,
              right: 1,
              width: Math.max(6, Math.round(size * 0.22)),
              height: Math.max(6, Math.round(size * 0.22)),
              borderRadius: '50%',
              background: LIVE_GREEN,
              boxShadow: '0 0 0 1.5px #FFFFFF',
            }}
          />
        )}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          minWidth: 0,
          flex: 1,
        }}
      >
        <span
          style={{
            fontSize: nameSize,
            fontWeight: nameWeight,
            color: INK,
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.name}
        </span>
        <CountryFlag country={row.country} size="sm" />
      </div>
    </button>
  );
}

function bandedStyle(index: number, extra?: CSSProperties): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: `9px ${PAD_X}px`,
    background: index % 2 === 1 ? BAND_ALT : 'transparent',
    borderTop: index === 0 ? `0.5px solid ${HAIRLINE}` : undefined,
    borderBottom: `0.5px solid ${HAIRLINE}`,
    ...extra,
  };
}

// ══ WorldBoard ═════════════════════════════════════════════════════════
// Rank/points marquee. Champion band + banded ranks 2–4.
export interface WorldBoardProps extends BoardBaseProps {
  overline: string;
  title: string;
  championSubline: string;
}
function WorldBoardInner({
  category,
  liveMap,
  onOpen,
  overline,
  title,
  championSubline,
}: WorldBoardProps) {
  const navigate = useNavigate();
  const top = category.rows.slice(0, 4);
  if (!top.length) return null;
  const [champ, ...rest] = top;
  const tap = (pid: string) => pid && navigate(`/tourhub/player/${pid}`);

  return (
    <section style={{ fontFamily: FONT }}>
      <SectionHead overline={overline} title={title} onOpen={onOpen} />

      {/* Champion band */}
      <div
        style={{
          background: CHAMP_BAND,
          borderTop: `0.5px solid ${HAIRLINE}`,
          borderBottom: `0.5px solid ${HAIRLINE}`,
          padding: `12px ${PAD_X}px`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <PlayerCell
          row={champ}
          size={38}
          nameSize={14.5}
          nameWeight={700}
          liveMap={liveMap}
          onTap={tap}
          ringColor={AMBER_BORDER}
        />
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: AMBER,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {champ.valueFormatted}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: INK_MUTE,
              textTransform: 'uppercase',
            }}
          >
            {championSubline}
          </div>
        </div>
      </div>

      {/* Ranks 2–4 */}
      {rest.map((r, i) => (
        <div key={r.playerId || `w-${i}`} style={bandedStyle(i)}>
          <div
            style={{
              width: 18,
              fontSize: 12,
              fontWeight: 500,
              color: INK_MUTE,
              fontVariantNumeric: 'tabular-nums',
              textAlign: 'right',
            }}
          >
            {r.rank}
          </div>
          <PlayerCell
            row={r}
            size={26}
            nameSize={13}
            nameWeight={600}
            liveMap={liveMap}
            onTap={tap}
          />
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: INK,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {r.valueFormatted}
          </div>
        </div>
      ))}
    </section>
  );
}
export const WorldBoard = memo(WorldBoardInner);

// ══ MoneyBoard ═════════════════════════════════════════════════════════
// Currency / higher-is-better. Top 3 rows with 3px amber power bars.
function MoneyBoardInner({ category, liveMap, onOpen }: BoardBaseProps) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const top = category.rows.slice(0, 3);
  if (!top.length) return null;
  const max = Math.max(...top.map((r) => r.value || 0));
  const tap = (pid: string) => pid && navigate(`/tourhub/player/${pid}`);

  return (
    <section style={{ fontFamily: FONT }}>
      <SectionHead
        overline={t(category.shortKey)}
        title={t(`leaders.almanac.titles.${category.key}`, { defaultValue: t(category.labelKey) })}
        onOpen={onOpen}
      />
      {top.map((r, i) => {
        const isLeader = i === 0;
        const pct = max > 0 ? Math.max(0.08, r.value / max) : 0.08;
        return (
          <div
            key={r.playerId || `m-${i}`}
            style={bandedStyle(i, { flexDirection: 'column', alignItems: 'stretch', gap: 6 })}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 18,
                  fontSize: 12,
                  fontWeight: 500,
                  color: isLeader ? AMBER : INK_MUTE,
                  fontVariantNumeric: 'tabular-nums',
                  textAlign: 'right',
                }}
              >
                {r.rank}
              </div>
              <PlayerCell
                row={r}
                size={26}
                nameSize={13}
                nameWeight={600}
                liveMap={liveMap}
                onTap={tap}
              />
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: isLeader ? AMBER : INK,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {r.valueFormatted}
              </div>
            </div>
            {/* Power bar — inset to text edge (18 rank + 26 avatar + 10+10 gap) */}
            <div
              style={{
                marginLeft: 18 + 10 + 26 + 10,
                height: 3,
                background: 'rgba(15,23,42,0.06)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pct * 100}%`,
                  height: '100%',
                  background: AMBER,
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}
export const MoneyBoard = memo(MoneyBoardInner);

// ══ ScoringBoard ═══════════════════════════════════════════════════════
// Lower-is-better averages. Value-forward with computed deltas. No bars.
function ScoringBoardInner({ category, liveMap, onOpen }: BoardBaseProps) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const top = category.rows.slice(0, 3);
  if (!top.length) return null;
  const leaderValue = top[0].value;
  const tap = (pid: string) => pid && navigate(`/tourhub/player/${pid}`);

  return (
    <section style={{ fontFamily: FONT }}>
      <SectionHead
        overline={t(category.shortKey)}
        title={t(`leaders.almanac.titles.${category.key}`, { defaultValue: t(category.labelKey) })}
        onOpen={onOpen}
      />
      {top.map((r, i) => {
        const isLeader = i === 0;
        const delta = (r.value - leaderValue).toFixed(2);
        return (
          <div key={r.playerId || `s-${i}`} style={bandedStyle(i)}>
            <div
              style={{
                width: 18,
                fontSize: 12,
                fontWeight: 500,
                color: isLeader ? AMBER : INK_MUTE,
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
              }}
            >
              {r.rank}
            </div>
            <PlayerCell
              row={r}
              size={26}
              nameSize={13}
              nameWeight={600}
              liveMap={liveMap}
              onTap={tap}
            />
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: INK,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                {r.valueFormatted}
              </div>
              <div
                style={{
                  marginTop: 3,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: isLeader ? AMBER : INK_FAINT,
                  textTransform: 'uppercase',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {isLeader
                  ? t('leaders.almanac.scoring.leader')
                  : t('leaders.almanac.scoring.behind', { delta })}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
export const ScoringBoard = memo(ScoringBoardInner);

// ══ WinnersCircle ══════════════════════════════════════════════════════
// Horizontal chip rail. All rows with value >= 1. Leader amber-bordered.
function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

function WinnersCircleInner({ category, onOpen }: BoardBaseProps) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const chips = category.rows.filter((r) => (r.value ?? 0) >= 1);
  if (!chips.length) return null;
  const tap = (pid: string) => pid && navigate(`/tourhub/player/${pid}`);

  return (
    <section style={{ fontFamily: FONT }}>
      <SectionHead
        overline={t(category.shortKey)}
        title={t(`leaders.almanac.titles.${category.key}`, { defaultValue: t(category.labelKey) })}
        onOpen={onOpen}
      />
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: `4px ${PAD_X}px 6px`,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {chips.map((r, i) => {
          const isLeader = i === 0;
          const candidates = resolvePlayerAvatarCandidates({
            name: r.name,
            photoUrl: r.photoUrl,
            tourSlug: r.tourCode ?? 'pga',
          });
          return (
            <button
              key={r.playerId || `wc-${i}`}
              type="button"
              onClick={() => tap(r.playerId)}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 10px 5px 5px',
                background: '#FFFFFF',
                borderRadius: 999,
                border: `0.5px solid ${isLeader ? AMBER_BORDER : HAIRLINE}`,
                fontFamily: FONT,
                cursor: 'pointer',
              }}
            >
              <SquircleAvatar
                size={24}
                srcCandidates={candidates}
                alt={r.name}
                userId={r.playerId}
                hairlineRing
                ringColor={isLeader ? AMBER_BORDER : LIGHT_HAIRLINE}
              />
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: INK,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                }}
              >
                {surname(r.name)}
              </span>
              <span
                style={{
                  minWidth: 20,
                  height: 20,
                  padding: '0 6px',
                  borderRadius: 999,
                  background: isLeader ? AMBER : 'rgba(15,23,42,0.06)',
                  color: isLeader ? '#FFFFFF' : INK,
                  fontSize: 11,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {r.valueFormatted}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
export const WinnersCircle = memo(WinnersCircleInner);

// ── Anatomy router ────────────────────────────────────────────────────
// Maps category key -> anatomy by metric SHAPE, not name.
export type Anatomy = 'world' | 'money' | 'scoring' | 'winners';

export const ANATOMY_BY_KEY: Record<string, Anatomy> = {
  world_rank: 'world',
  points: 'world',
  earnings: 'money',
  drive_avg: 'money',
  drive_acc: 'money',
  gir_pct: 'money',
  sand_saves_pct: 'money',
  strokes_gained_tee_green: 'money',
  strokes_gained_putting: 'money',
  scoring_avg: 'scoring',
  putt_avg: 'scoring',
  wins: 'winners',
  top_10: 'winners',
};
