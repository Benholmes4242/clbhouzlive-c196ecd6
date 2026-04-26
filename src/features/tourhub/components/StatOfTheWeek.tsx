/**
 * StatOfTheWeek — Gamified leaderboard with title bible.
 *
 * 13 categories accessible via a bottom-sheet picker.
 * Active category randomized per session (fresh on remount).
 * AI standfirsts cached in stat_of_week_copy (Anthropic Claude Sonnet 4.5,
 * weekly cron). Falls back to deterministic template when cache empty.
 *
 * PGA-only by data limitation. When the page tour selector is non-PGA,
 * a "PGA TOUR LEADERS" sub-label is shown beneath the gamified title to
 * make the data scope explicit.
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

const AMBER = '#F7931E';
const INK = '#0F172A';
const SLATE_400 = '#94A3B8';
const SLATE_500 = '#64748B';
const SLATE_600 = '#475569';
const SLATE_200 = 'rgba(15,23,42,0.10)';

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
    // Try to split off a unit suffix like "32 events" or "12 cuts"
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
  catKey: string,
  marginDisplay: string | null,
  surname: string,
  isLargestMargin: boolean,
): string | null {
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

export const StatOfTheWeek = memo(function StatOfTheWeek() {
  const navigate = useNavigate();
  const { entries, isLoading } = useGamifiedLeaderboards();
  const { data: standfirstMap } = useStatOfWeekCopy();
  const { selectedTour } = useTourSelection();

  const [activeKey, setActiveKey] = useState<string>(pickRandomCategoryKey);
  const [sheetOpen, setSheetOpen] = useState(false);

  const isPga = (selectedTour ?? 'pga').toLowerCase() === 'pga';

  // Resolve the active category + entry; fall back to first available if active has no data
  const { category, entry, marginRank } = useMemo(() => {
    const activeCat = LEADER_CATEGORIES.find((c) => c.key === activeKey) ?? LEADER_CATEGORIES[0];
    let resolvedEntry = entries.get(activeCat.key);

    // If active has no data yet, pick the first category with data
    if (!resolvedEntry || resolvedEntry.players.length === 0) {
      for (const c of LEADER_CATEGORIES) {
        const e = entries.get(c.key);
        if (e && e.players.length > 0) {
          return { category: c, entry: e, marginRank: 0 };
        }
      }
      return { category: activeCat, entry: undefined, marginRank: 0 };
    }

    // Compute whether this entry has the largest margin across all categories
    // (so we can claim "widest gap of any 2026 statistical category")
    let widestMargin = 0;
    let widestKey = '';
    entries.forEach((e, key) => {
      // Only stat categories with comparable margins (skip world_rank, events, cuts, top10 — non-uniform units)
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

  // ── Loading state ──
  if (isLoading && entries.size === 0) {
    return (
      <section className="px-4" aria-label="Stat of the Week">
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(247,147,30,0.05) 0%, transparent 75%)',
            borderRadius: 20,
            padding: '20px 18px 18px',
            minHeight: 360,
          }}
        >
          <div className="h-3 w-32 rounded bg-muted/40 animate-pulse mb-4" />
          <div className="h-16 w-44 rounded bg-muted/40 animate-pulse mb-4" />
          <div className="h-8 w-full rounded bg-muted/40 animate-pulse mb-3" />
          <div className="h-3 w-3/4 rounded bg-muted/40 animate-pulse" />
        </div>
      </section>
    );
  }

  if (!entry || entry.players.length === 0) return null;

  const leader = entry.players[0];
  const split = splitDisplay(leader.display);
  const Icon = category.icon;

  // ── Standfirst: AI-cached or fallback template ──
  const cachedStandfirst = standfirstMap?.get(category.key);
  const standfirst =
    cachedStandfirst ??
    `${leader.lastName} leads ${category.gamifiedTitle} with ${leader.display}.`;

  const subDetail = buildSubDetail(
    category.key,
    entry.marginDisplay,
    leader.lastName,
    marginRank === 1,
  );

  const chasers = entry.players.slice(1, 4);

  return (
    <>
      <section className="px-4" aria-label="Stat of the Week">
        <div
          style={{
            position: 'relative',
            background:
              'linear-gradient(180deg, rgba(247,147,30,0.05) 0%, transparent 75%)',
            borderRadius: 20,
            padding: '20px 18px 18px',
            border: '1px solid rgba(15,23,42,0.05)',
          }}
        >
          {/* ── Title eyebrow row (tappable) ── */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
              marginBottom: isPga ? 14 : 4,
            }}
            aria-label={`Change category. Current: ${category.gamifiedTitle}`}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: 'rgba(247,147,30,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={13} color={AMBER} strokeWidth={2.5} />
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: AMBER,
                letterSpacing: '0.14em',
                whiteSpace: 'nowrap',
              }}
            >
              {category.gamifiedTitle}
            </span>
            <ChevronDown size={12} color={AMBER} strokeWidth={2.5} />
            <div
              style={{
                flex: 1,
                height: 1,
                background: 'linear-gradient(90deg, rgba(247,147,30,0.3), transparent)',
              }}
            />
            <span
              style={{
                fontSize: 9,
                fontWeight: 900,
                color: SLATE_400,
                letterSpacing: '0.12em',
              }}
            >
              CHANGE
            </span>
          </button>

          {/* ── PGA TOUR LEADERS sub-label (non-PGA only) ── */}
          {!isPga && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: SLATE_500,
                letterSpacing: '0.12em',
                marginBottom: 14,
                marginLeft: 30,
              }}
            >
              PGA TOUR LEADERS
            </div>
          )}

          {/* ── Hero number ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 0,
              marginBottom: 10,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span
              style={{
                fontSize: 62,
                fontWeight: 900,
                color: INK,
                letterSpacing: '-0.04em',
                lineHeight: 0.95,
              }}
            >
              {split.whole}
            </span>
            {split.rest && (
              <span
                style={{
                  fontSize: 38,
                  fontWeight: 900,
                  color: AMBER,
                  letterSpacing: '-0.025em',
                  lineHeight: 1,
                  paddingBottom: 4,
                }}
              >
                {split.rest}
              </span>
            )}
          </div>

          {/* ── Standfirst (AI) ── */}
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: INK,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginBottom: 8,
            }}
          >
            {standfirst}
          </div>

          {/* ── Sub-detail (template-driven) ── */}
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

          {/* ── Player row (top + bottom border) ── */}
          <button
            type="button"
            onClick={() => navigate(`/tourhub/player/${leader.playerId}`)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderTop: `1px solid ${SLATE_200}`,
              borderBottom: `1px solid ${SLATE_200}`,
              padding: '12px 0',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                padding: 2,
                background: AMBER,
                flexShrink: 0,
              }}
            >
              <PlayerAvatar
                playerId={leader.playerId}
                playerName={leader.fullName}
                tourCode="pga"
                size="sm"
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  color: INK,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {leader.fullName}
              </div>
            </div>
          </button>

          {/* ── Chasers grid ── */}
          {chasers.length > 0 && (
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
                    background: '#ffffff',
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
                      marginBottom: 2,
                    }}
                  >
                    #{idx + 2}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: INK,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: 2,
                    }}
                  >
                    {p.lastName}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: SLATE_600,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {p.display}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── CTA to Leaders page ── */}
          <button
            type="button"
            onClick={() => navigate(`/tourhub?tab=leaderboards&category=${category.key}`)}
            style={{
              marginTop: 14,
              width: '100%',
              padding: 12,
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              background: AMBER,
              color: INK,
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '-0.1px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 2px 12px rgba(247,147,30,0.25)',
            }}
          >
            <span>See all</span>
            <ChevronRight size={14} strokeWidth={3} />
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
