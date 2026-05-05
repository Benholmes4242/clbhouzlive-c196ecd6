/**
 * StatOfTheWeek — Editorial Stat Watch.
 *
 * Side-by-side hero block: gold-ringed leader portrait + category label +
 * giant hero number + leader name with country flag.
 *
 * 13 categories accessible via a bottom-sheet picker (unchanged).
 * AI standfirsts cached in stat_of_week_copy with deterministic fallback.
 * PGA-only by data limitation; non-PGA tours just hide the "· PGA" suffix.
 */

import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useGamifiedLeaderboards } from '../hooks/useGamifiedLeaderboards';
import { useStatOfWeekCopy } from '../hooks/useStatOfWeekCopy';
import { useTourSelection } from '../hooks/useTourSelection';
import { LEADER_CATEGORIES, type LeaderCategory } from './leaders/constants';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PlayerAvatar } from './PlayerAvatar';
import { Shimmer } from './shared/Shimmer';
import CountryFlag from '@/components/ui/country-flag';

const AMBER = '#F7931E';
const AMBER_SOFT = 'rgba(247,147,30,0.10)';
const INK = '#0F172A';
const GOLD = '#FFB800';
const SLATE_400 = '#94A3B8';
const SLATE_500 = '#64748B';
const SLATE_600 = '#475569';
const SLATE_200 = 'rgba(15,23,42,0.10)';
const SLATE_150 = '#EDF1F5';

// ── Random per-session default ──
function pickRandomCategoryKey(): string {
  const idx = Math.floor(Math.random() * LEADER_CATEGORIES.length);
  return LEADER_CATEGORIES[idx]?.key ?? 'earnings';
}

// ── Split hero number into ink whole + amber decimal/suffix ──
interface SplitDisplay {
  whole: string;
  rest: string;
}
function splitDisplay(display: string): SplitDisplay {
  const dot = display.indexOf('.');
  if (dot === -1) {
    const spaceIdx = display.indexOf(' ');
    if (spaceIdx !== -1) {
      return { whole: display.slice(0, spaceIdx), rest: display.slice(spaceIdx) };
    }
    return { whole: display, rest: '' };
  }
  return { whole: display.slice(0, dot), rest: display.slice(dot) };
}

// ── Sub-detail copy ──
function buildSubDetail(
  marginValue: number | null,
  marginDisplay: string | null,
  surname: string,
  isLargestMargin: boolean,
  tiedCount: number,
): string | null {
  if (marginValue !== null && marginValue === 0) {
    if (tiedCount === 0) return `${surname} sets the pace.`;
    return `Tied with ${tiedCount} ${tiedCount === 1 ? 'other' : 'others'}.`;
  }
  if (!marginDisplay) return null;
  const year = new Date().getFullYear();
  if (isLargestMargin) {
    return `${surname} leads the field by ${marginDisplay} — the widest gap in any ${year} statistical category.`;
  }
  return `${surname} leads the field by ${marginDisplay}.`;
}

// ── Group label for picker ──
const GROUP_LABELS: Record<LeaderCategory['group'], string> = {
  general: 'GENERAL',
  ball_striking: 'BALL STRIKING',
  short_game: 'SHORT GAME',
};
const GROUP_ORDER: LeaderCategory['group'][] = ['general', 'ball_striking', 'short_game'];

function StatWatchSkeleton({ scopeLabel }: { scopeLabel: string }) {
  return (
    <section className="px-4" aria-label="Stat of the Week">
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <Shimmer width="35%" height={24} radius={5} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: SLATE_400,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {scopeLabel}
        </span>
      </div>
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: `1px solid ${SLATE_200}`,
          padding: '16px 18px 18px',
        }}
      >
        <Shimmer width={170} height={32} radius={10} style={{ marginBottom: 18 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <Shimmer width={88} height={88} radius="50%" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Shimmer width="55%" height={10} radius={3} style={{ marginBottom: 6 }} />
            <Shimmer width="80%" height={48} radius={6} style={{ marginBottom: 6 }} />
            <Shimmer width="60%" height={14} radius={3} />
          </div>
        </div>
        <div style={{ paddingTop: 14, borderTop: `1px solid ${SLATE_150}` }}>
          <Shimmer width="92%" height={18} radius={4} style={{ marginBottom: 8 }} />
          <Shimmer width="55%" height={13} radius={3} style={{ marginBottom: 16 }} />
        </div>
        <Shimmer width={60} height={10} radius={3} style={{ marginBottom: 8 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                background: '#fff',
                border: `1px solid ${SLATE_200}`,
                borderRadius: 10,
                padding: 10,
              }}
            >
              <Shimmer width="40%" height={9} radius={2} style={{ marginBottom: 4 }} />
              <Shimmer width="80%" height={13} radius={3} style={{ marginBottom: 4 }} />
              <Shimmer width="60%" height={12} radius={3} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <Shimmer width={130} height={12} radius={3} />
        </div>
      </div>
    </section>
  );
}

export const StatOfTheWeek = memo(function StatOfTheWeek() {
  const navigate = useNavigate();
  const { entries, isLoading } = useGamifiedLeaderboards();
  const { data: standfirstMap } = useStatOfWeekCopy();
  const { selectedTour } = useTourSelection();

  const [activeKey, setActiveKey] = useState<string>(pickRandomCategoryKey);
  const [sheetOpen, setSheetOpen] = useState(false);

  const isPga = (selectedTour ?? 'pga').toLowerCase() === 'pga';
  const currentYear = new Date().getFullYear();
  const scopeLabel = `${currentYear} Season${isPga ? ' · PGA' : ''}`;

  const { category, entry, marginRank } = useMemo(() => {
    const activeCat = LEADER_CATEGORIES.find((c) => c.key === activeKey) ?? LEADER_CATEGORIES[0];
    let resolvedEntry = entries.get(activeCat.key);

    if (!resolvedEntry || resolvedEntry.players.length === 0) {
      for (const c of LEADER_CATEGORIES) {
        const e = entries.get(c.key);
        if (e && e.players.length > 0) {
          return { category: c, entry: e, marginRank: 0 };
        }
      }
      return { category: activeCat, entry: undefined, marginRank: 0 };
    }

    let widestMargin = 0;
    let widestKey = '';
    entries.forEach((e, key) => {
      if (e.marginValue !== null && e.marginValue > widestMargin && e.category.section === 'stats') {
        widestMargin = e.marginValue;
        widestKey = key;
      }
    });
    return {
      category: activeCat,
      entry: resolvedEntry,
      marginRank: widestKey === activeCat.key ? 1 : 0,
    };
  }, [activeKey, entries]);

  if (isLoading && entries.size === 0) {
    return <StatWatchSkeleton scopeLabel={scopeLabel} />;
  }

  if (!entry || entry.players.length === 0) return null;

  const leader = entry.players[0];
  const split = splitDisplay(leader.display);
  const Icon = category.icon;

  const tiedCount = entry.players
    .slice(1)
    .filter((p) => p.value === leader.value).length;

  const metricUnit = category.unit === '%' ? '%' : '';
  const cachedStandfirst = standfirstMap?.get(category.key);
  const standfirst =
    cachedStandfirst ??
    `${leader.lastName} leads with ${leader.display}${metricUnit} ${category.label}.`;

  const subDetail = buildSubDetail(
    entry.marginValue,
    entry.marginDisplay,
    leader.lastName,
    marginRank === 1,
    tiedCount,
  );

  const chasers = entry.players.slice(1, 4);

  return (
    <>
      <section className="px-4" aria-label="Stat of the Week">
        {/* ── Single-line section header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <h2
            style={{
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: INK,
              margin: 0,
            }}
          >
            Stat Watch
          </h2>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: SLATE_400,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {scopeLabel}
          </span>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            border: `1px solid ${SLATE_200}`,
            boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
            padding: '16px 18px 18px',
          }}
        >
          {/* ── Category dropdown trigger ── */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label={`Change category. Current: ${category.gamifiedTitle}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 12px',
              background: AMBER_SOFT,
              border: `1px solid ${AMBER}33`,
              borderRadius: 10,
              cursor: 'pointer',
              marginBottom: 18,
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                background: AMBER,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={11} color="#fff" strokeWidth={2.5} />
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: AMBER,
                letterSpacing: '0.14em',
              }}
            >
              {category.gamifiedTitle}
            </span>
            <ChevronDown size={13} color={AMBER} strokeWidth={2.5} />
          </button>

          {/* ── Side-by-side hero block ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 16,
            }}
          >
            <button
              type="button"
              onClick={() => navigate(`/tourhub/player/${leader.playerId}`)}
              style={{
                position: 'relative',
                flexShrink: 0,
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                borderRadius: '50%',
              }}
              aria-label={`View ${leader.fullName}`}
            >
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  border: `2px solid ${GOLD}`,
                  boxShadow: '0 0 18px rgba(255,184,0,0.20)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <PlayerAvatar
                  playerId={leader.playerId}
                  playerName={leader.fullName}
                  tourCode="pga"
                  size="xl"
                />
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: GOLD,
                  color: INK,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #fff',
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                1
              </div>
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              {category.label && (
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: SLATE_500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {category.label}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 0,
                  fontVariantNumeric: 'tabular-nums',
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 52,
                    fontWeight: 900,
                    color: INK,
                    letterSpacing: '-0.04em',
                    lineHeight: 0.9,
                  }}
                >
                  {split.whole}
                </span>
                {split.rest && (
                  <span
                    style={{
                      fontSize: 30,
                      fontWeight: 900,
                      color: AMBER,
                      letterSpacing: '-0.025em',
                      lineHeight: 1,
                      paddingBottom: 3,
                    }}
                  >
                    {split.rest}
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: '-0.015em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {leader.fullName}
                </span>
                {leader.countryCode && (
                  <span style={{ flexShrink: 0, display: 'inline-flex' }}>
                    <CountryFlag country={leader.countryCode} size="sm" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Standfirst ── */}
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: INK,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: 6,
              paddingTop: 14,
              borderTop: `1px solid ${SLATE_150}`,
            }}
          >
            {standfirst}
          </div>

          {subDetail && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: SLATE_600,
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              {subDetail}
            </div>
          )}

          {/* ── Chasers ── */}
          {chasers.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: SLATE_500,
                  letterSpacing: '0.16em',
                  marginBottom: 8,
                }}
              >
                CHASING
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                }}
              >
                {chasers.map((p, idx) => (
                  <div
                    key={`${p.playerId}-${idx}`}
                    style={{
                      background: '#fff',
                      border: `1px solid ${SLATE_200}`,
                      borderRadius: 10,
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        color: SLATE_400,
                        letterSpacing: '0.08em',
                        marginBottom: 3,
                      }}
                    >
                      #{idx + 2}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: INK,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: 3,
                      }}
                    >
                      {p.lastName}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: SLATE_600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {p.display}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── CTA: discreet text-link ── */}
          <button
            type="button"
            onClick={() => navigate(`/tourhub?tab=leaderboards&category=${category.key}`)}
            style={{
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              border: 'none',
              padding: 0,
              color: AMBER,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: 'auto',
            }}
          >
            See full leaderboard <ChevronRight size={13} />
          </button>
        </div>
      </section>

      {/* ── Category picker bottom sheet ── */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        ariaLabelledBy="stat-of-week-picker-title"
      >
        <div
          style={{
            padding: '8px 20px 24px',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <h2
              id="stat-of-week-picker-title"
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: INK,
                letterSpacing: '-0.01em',
                margin: 0,
              }}
            >
              Choose a category
            </h2>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                border: 'none',
                background: 'rgba(15,23,42,0.06)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close"
            >
              <X size={16} color={SLATE_600} />
            </button>
          </div>

          {GROUP_ORDER.map((groupKey) => {
            const cats = LEADER_CATEGORIES.filter((c) => c.group === groupKey);
            if (cats.length === 0) return null;
            return (
              <div key={groupKey} style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: SLATE_500,
                    letterSpacing: '0.12em',
                    marginBottom: 8,
                  }}
                >
                  {GROUP_LABELS[groupKey]}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cats.map((cat) => {
                    const isActive = cat.key === category.key;
                    const CatIcon = cat.icon;
                    return (
                      <button
                        type="button"
                        key={cat.key}
                        onClick={() => {
                          setActiveKey(cat.key);
                          setSheetOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: 12,
                          borderRadius: 10,
                          border: isActive
                            ? `1.5px solid ${AMBER}`
                            : `1px solid ${SLATE_200}`,
                          background: isActive ? 'rgba(247,147,30,0.08)' : '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <CatIcon
                          size={14}
                          color={isActive ? AMBER : SLATE_500}
                          strokeWidth={2.5}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 900,
                              color: isActive ? AMBER : INK,
                              letterSpacing: '0.04em',
                            }}
                          >
                            {cat.gamifiedTitle}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              color: SLATE_500,
                              marginTop: 1,
                            }}
                          >
                            {cat.label}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
});
