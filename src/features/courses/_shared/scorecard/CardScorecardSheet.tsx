import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Table } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { TrajectoryLine } from './TrajectoryLine';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import {
  TREND_UP, TREND_DOWN,
  TOPAR_UNDER_LIGHT, TOPAR_OVER_LIGHT, TOPAR_EVEN_LIGHT,
} from '@/features/tourhub/_shared/tokens';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { formatHcp } from '@/lib/formatHcp';
import { formatOrdinal } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import {
  A, SANS, FIGS, NUM, LABEL, KICKER, TITLE, Panel, StatRow, Action,
  toParParts, type StatItem,
} from '@/features/courses/components/holes/analytical/tokens';

const CAPTION: React.CSSProperties = { fontSize: 12.5, lineHeight: 1.5, color: A.MUTE, margin: 0 };
/**
 * A PLAYER'S SCORE AGAINST PAR — under par is RED (good in golf), over par is
 * INK, even par is muted. One source of truth with the tour surfaces
 * (`tourhub/_shared/scoreColor`), so a member card and a tour card colour the
 * same score identically. Course DIFFICULTY (red harder / green easier) is a
 * different semantic surface and does not appear on a scorecard.
 */
const EVEN_GRAY = TOPAR_EVEN_LIGHT;

export interface CardScorecardHole {
  holeNo: number;
  par: number | null;
  strokes: number | null;
  /** Optional field average for the hole — member course field or tour field. */
  fieldAvg?: number | null;
}

export interface CardScorecardRounds {
  available: number[];
  active: number;
  onSelect: (r: number) => void;
}

/** Member-only enrichment from `get_round_course_context`. Defaults off. */
export interface CardScorecardCourseContext {
  yourAvgToPar?: number | null;
  roundsHere?: number | null;
  rankHere?: number | null;
}

export interface CardScorecardSheetProps {
  open: boolean;
  onClose: () => void;
  // HEADER (course-first)
  eyebrowText: string;
  courseName: string;
  courseLocation?: string | null;
  coursePar?: number | null;
  courseSlope?: number | null;
  // MIDDLE
  holes: CardScorecardHole[];
  nineHole?: boolean;
  rounds?: CardScorecardRounds;
  heroMuted?: boolean;
  emptyMessage?: string;
  loading?: boolean;
  emptyVariant?: 'syncing' | 'nohbh' | 'unavailable';
  emptyGross?: number | null;
  emptyToPar?: number | null;

  /** 'member' (default) or 'tour'. Changes copy and stat labels only. */
  surface?: 'member' | 'tour';
  /** Member enrichment — omitted for a pro, who has no history at the venue. */
  courseContext?: CardScorecardCourseContext | null;

  // IDENTITY BLOCK (below scorecard)
  playerName: string;
  playerAvatarUrl?: string | null;
  playerHcp?: number | null;
  playerHcpDelta?: number | null;
  playerUserId?: string | null;
  /** Tour: shows a position ("T4") in place of the handicap index. */
  identityStat?: { label: string; value: string } | null;
  // FOOTER
  onViewProfile?: () => void;
  onViewCourse?: () => void;
  /** C3 — shown only for the viewer's own round; opens the composer pre-filled. */
  onShareRound?: () => void;
}

/** Integer to-par: rounds first, then branches. Never `-0`. */
function fmtRel(n: number | null): string {
  if (n == null) return '\u2014';
  const r = Math.round(n);
  return r === 0 ? 'E' : r < 0 ? `\u2212${Math.abs(r)}` : `+${r}`;
}

function toParColor(n: number | null): string {
  if (n == null || Math.round(n) === 0) return EVEN_GRAY;
  return getScoreColor(Math.round(n), 'light');
}

/* --------------------------------------------------------------- the card */

const NINE_GRID = '26px repeat(9, minmax(0, 1fr)) 32px';

/**
 * Result marks — shape AND colour together. Shape survives a colourblind
 * reader and a screenshot; colour makes it scannable. Par is unmarked on
 * purpose: marking every hole marks nothing.
 */
const ScoreCell: React.FC<{ strokes: number | null; par: number | null }> = ({ strokes, par }) => {
  if (strokes == null || strokes <= 0) {
    return <span style={{ ...NUM, fontSize: 13, color: A.DIM }}>{'\u2014'}</span>;
  }
  const d = par == null ? 0 : strokes - par;
  const under = d <= -1;
  const over = d >= 1;
  // Over par carries no colour of its own — the SHAPE carries it, exactly as a
  // paper card works. Only under par is coloured.
  const tone = under ? TOPAR_UNDER_LIGHT : TOPAR_OVER_LIGHT;
  const dbl = d <= -2 || d >= 2;

  return (
    <span
      style={{
        width: '100%', maxWidth: 26, aspectRatio: '1 / 1', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}
    >
      {(under || over) && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, border: `1.5px solid ${tone}`,
            borderRadius: under ? '50%' : 3,
          }}
        />
      )}
      {dbl && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 3, border: `1.5px solid ${tone}`,
            borderRadius: under ? '50%' : 2,
          }}
        />
      )}
      <span style={{ ...NUM, fontSize: 13.5, color: tone, position: 'relative' }}>{strokes}</span>
    </span>
  );
};

const CardRow: React.FC<{
  label: string;
  cells: React.ReactNode[];
  total: React.ReactNode;
  muted?: boolean;
  tone?: string;
}> = ({ label, cells, total, muted, tone }) => (
  <div style={{ display: 'grid', gridTemplateColumns: NINE_GRID, alignItems: 'center', gap: 2, padding: '3px 0' }}>
    <span style={{ ...LABEL, fontSize: 8 }}>{label}</span>
    {cells.map((c, i) => (
      <span key={i} style={{ textAlign: 'center', minWidth: 0 }}>
        {typeof c === 'object' ? c : (
          <span style={{ ...NUM, fontSize: 12, fontWeight: muted ? 600 : 800, color: tone ?? (muted ? A.MUTE : A.INK) }}>
            {c}
          </span>
        )}
      </span>
    ))}
    <span style={{ ...NUM, fontSize: 13, color: A.INK, textAlign: 'center' }}>{total}</span>
  </div>
);

const Nine: React.FC<{
  rows: CardScorecardHole[];
  label: string;
  withField: boolean;
  scoreLabel: string;
}> = ({ rows, label, withField, scoreLabel }) => {
  const { t } = useTranslation(['courses']);
  const par = rows.reduce((s, h) => s + (h.par ?? 0), 0);
  const strokes = rows.reduce((s, h) => s + (h.strokes != null && h.strokes > 0 ? h.strokes : 0), 0);
  const fieldRel = withField
    ? rows.reduce(
        (s, h) => s + (h.fieldAvg != null && h.par != null ? h.fieldAvg - h.par : 0),
        0,
      )
    : null;

  return (
    <div>
      <CardRow label={t('courses:scorecard.hole')} cells={rows.map((h) => h.holeNo)} total={label} muted />
      <CardRow label={t('courses:scorecard.par')} cells={rows.map((h) => h.par ?? '\u2014')} total={par || '\u2014'} muted />
      <CardRow
        label={scoreLabel}
        cells={rows.map((h) => <ScoreCell key={h.holeNo} strokes={h.strokes} par={h.par} />)}
        total={strokes || '\u2014'}
      />

      {withField && (
        <CardRow
          label={t('courses:scorecard.field')}
          cells={rows.map((h) => {
            const d = h.fieldAvg != null && h.par != null ? h.fieldAvg - h.par : null;
            if (d == null) return '';
            const r = Math.round(d * 10) / 10;
            return `${r > 0 ? '+' : r < 0 ? '\u2212' : ''}${Math.abs(r).toFixed(1)}`;
          })}
          total={
            fieldRel != null
              ? `${fieldRel > 0 ? '+' : fieldRel < 0 ? '\u2212' : ''}${Math.abs(Math.round(fieldRel * 10) / 10).toFixed(1)}`
              : ''
          }
          muted
        />
      )}
    </div>
  );
};

const Legend: React.FC = () => {
  const { t } = useTranslation(['courses']);
  const keys: { d: number; label: string }[] = [
    { d: -1, label: t('courses:scorecard.legendBirdie') },
    { d: -2, label: t('courses:scorecard.legendEagle') },
    { d: 1, label: t('courses:scorecard.legendBogey') },
    { d: 2, label: t('courses:scorecard.legendDouble') },
  ];
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
      {keys.map((k) => (
        <span key={k.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <ScoreCell strokes={4 + k.d} par={4} />
          <span style={{ ...LABEL, fontSize: 8 }}>{k.label}</span>
        </span>
      ))}
    </div>
  );
};

/* ------------------------------------------------------ round breakdown */

const RoundSplit: React.FC<{ split: { label: string; n: number; tone: string }[] }> = ({ split }) => (
  <div>
    <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
      {split.filter((s) => s.n > 0).map((s) => (
        <i key={s.label} style={{ height: 6, flex: s.n, background: s.tone, borderRadius: 3 }} />
      ))}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${split.length}, minmax(0, 1fr))` }}>
      {split.map((s) => (
        <div key={s.label} style={{ textAlign: 'center' }}>
          <div style={LABEL}>{s.label}</div>
          <div style={{ ...NUM, fontSize: 18, color: s.tone, marginTop: 3 }}>{s.n}</div>
        </div>
      ))}
    </div>
  </div>
);

/* -------------------------------------------- loading and empty middles */

const HandicapChip: React.FC<{ delta: number }> = ({ delta }) => {
  const cut = delta < 0;
  const color = cut ? TREND_UP : TREND_DOWN;
  const arrow = cut ? '\u2193' : '\u2191';
  return (
    <span style={{ ...LABEL, fontSize: 8, color, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <span aria-hidden="true">{arrow}</span>
      {Math.abs(delta).toFixed(1)}
    </span>
  );
};

const SKEL_BG = A.TRACK;
const KEYFRAMES = `
@keyframes cardsheetPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
@keyframes cardsheetSpin { to { transform: rotate(360deg); } }
`;

const SkeletonMiddle: React.FC = () => (
  <div aria-hidden style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <style>{KEYFRAMES}</style>
    {[168, 116].map((h, i) => (
      <div
        key={i}
        style={{
          height: h, borderRadius: 16, background: A.PANEL,
          border: `1px solid ${A.BORDER}`, padding: 16,
        }}
      >
        <div
          style={{
            height: '100%', borderRadius: 10, background: SKEL_BG,
            animation: `cardsheetPulse 1.4s ease-in-out ${i * 0.12}s infinite`,
          }}
        />
      </div>
    ))}
  </div>
);

const SyncingMiddle: React.FC = () => {
  const { t } = useTranslation(['courses']);
  return (
    <Panel style={{ textAlign: 'center' }}>
      <style>{KEYFRAMES}</style>
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 12, padding: '18px 0 6px',
        }}
      >
        <div style={{ position: 'relative', width: 46, height: 46 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${A.TRACK}` }} />
          <div
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '3px solid transparent', borderTopColor: A.AMBER,
              animation: 'cardsheetSpin 0.9s linear infinite',
            }}
          />
          <div
            style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: A.AMBER,
            }}
          >
            <RefreshCw size={16} strokeWidth={2.2} />
          </div>
        </div>
        <div style={TITLE}>{t('courses:scorecard.syncingTitle')}</div>
        <div style={{ ...CAPTION, maxWidth: 250 }}>{t('courses:scorecard.syncingBody')}</div>
      </div>
    </Panel>
  );
};

const UnavailableMiddle: React.FC = () => {
  const { t } = useTranslation(['courses']);
  return (
    <Panel style={{ textAlign: 'center' }}>
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 10, padding: '18px 0 6px', color: A.MUTE,
        }}
      >
        <Table size={22} strokeWidth={1.6} />
        <div style={TITLE}>{t('courses:scorecard.unavailableTitle')}</div>
        <div style={{ ...CAPTION, maxWidth: 250 }}>{t('courses:scorecard.unavailableBody')}</div>
      </div>
    </Panel>
  );
};

const NohbhMiddle: React.FC<{ gross: number | null; toPar: number | null }> = ({ gross, toPar }) => {
  const { t } = useTranslation(['courses']);
  return (
    <Panel>
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 10, textAlign: 'center', color: A.MUTE,
        }}
      >
        <Table size={22} strokeWidth={1.6} />
        <div style={TITLE}>{t('courses:scorecard.grossOnlyTitle')}</div>
        <div style={{ ...CAPTION, maxWidth: 250 }}>{t('courses:scorecard.grossOnlyBody')}</div>
      </div>
      {gross != null && (
        <StatRow
          style={{ marginTop: 18 }}
          items={[
            { label: t('courses:scorecard.gross'), value: gross },
            { label: t('courses:scorecard.toPar'), value: fmtRel(toPar), tone: toParColor(toPar) },
          ]}
        />
      )}
    </Panel>
  );
};

/* ------------------------------------------------------------- the sheet */

export const CardScorecardSheet: React.FC<CardScorecardSheetProps> = ({
  open, onClose, eyebrowText,
  courseName, courseLocation, coursePar, courseSlope,
  holes, nineHole, rounds, heroMuted, emptyMessage, loading,
  emptyVariant, emptyGross, emptyToPar,
  surface = 'member', courseContext,
  playerName, playerAvatarUrl, playerHcp, playerHcpDelta, playerUserId, identityStat,
  onViewProfile, onViewCourse, onShareRound,
}) => {
  const { t } = useTranslation(['courses']);
  void emptyMessage;
  void coursePar;
  void courseSlope;
  void nineHole;

  const isTour = surface === 'tour';
  const { user } = useSupabaseSession();
  /**
   * VOICE — this sheet opens over other members' rounds from the Clubhouse feed
   * as often as over the viewer's own history, so running copy must not claim a
   * stranger's round as theirs. Derived, never passed: a caller that forgets the
   * prop would silently produce the wrong (and worse) reading. When ownership
   * cannot be resolved we fall to the third person.
   */
  const isOwner = !isTour && !!playerUserId && !!user?.id && playerUserId === user.id;
  const firstName = (playerName || '').trim().split(/\s+/)[0] || playerName || '';
  // A first name already ending in s takes a bare apostrophe: "James' average".
  const namePossessive = /s$/i.test(firstName) ? `${firstName}\u2019` : `${firstName}\u2019s`;
  const subject = isOwner ? t('courses:scorecard.voiceYou') : firstName;
  const whose = isOwner ? t('courses:scorecard.voiceYour') : namePossessive;
  const whoseCap = isOwner ? t('courses:scorecard.voiceYourCap') : namePossessive;
  const [showCard, setShowCard] = useState(false);
  useEffect(() => { if (!open) setShowCard(false); }, [open]);

  const played = useMemo(
    () => holes.filter((h) => h.strokes != null && h.strokes > 0 && h.par != null),
    [holes],
  );

  const totals = useMemo(() => {
    let gross = 0;
    let toPar = 0;
    for (const h of played) {
      gross += h.strokes as number;
      toPar += (h.strokes as number) - (h.par as number);
    }
    return { gross, toPar, played: played.length > 0 };
  }, [played]);

  const fieldHoles = useMemo(() => played.filter((h) => h.fieldAvg != null), [played]);
  const withField = fieldHoles.length >= 2;

  const fieldRoundTotal = withField
    ? fieldHoles.reduce((s, h) => s + (h.fieldAvg as number), 0)
    : null;

  const beatFieldOn = withField
    ? fieldHoles.filter((h) => (h.strokes as number) <= (h.fieldAvg as number)).length
    : null;

  // scorecard_opened — has_field_data is the evidence for whether the
  // enrichment is reaching members at all.
  useEffect(() => {
    if (!open) return;
    analyticsEvents.track('scorecard_opened', {
      surface,
      holes: played.length,
      has_field_data: withField,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const statItems: StatItem[] = useMemo(() => {
    const items: StatItem[] = [];
    if (totals.played) {
      items.push({
        label: isTour ? t('courses:scorecard.round') : t('courses:scorecard.gross'),
        value: totals.gross,
      });
      items.push({
        label: t('courses:scorecard.toPar'),
        value: fmtRel(totals.toPar),
        tone: heroMuted ? EVEN_GRAY : toParColor(totals.toPar),
      });
    }
    if (isTour) {
      if (fieldRoundTotal != null) {
        items.push({
          label: t('courses:scorecard.fieldAvg'),
          value: (Math.round(fieldRoundTotal * 10) / 10).toFixed(1),
          sub: t('courses:scorecard.throughN', { n: fieldHoles.length }),
        });
      }
    } else if (courseContext?.yourAvgToPar != null) {
      const avgHere = courseContext.yourAvgToPar;
      const parts = toParParts(avgHere);
      if (parts) {
        items.push({
          label: isOwner
            ? t('courses:scorecard.yourAvgHere')
            : t('courses:scorecard.avgHereOther', { whose: whoseCap }),
          value: parts.text,
          // The member's own scoring average is a PLAYER SCORE, so it takes the
          // to-par rule. The label already says "Your"; amber is not needed to
          // carry the possessive. Amber means the viewing member, so it belongs
          // only on the member's own card.
          tone: isOwner ? A.AMBER_DEEP : toParColor(avgHere),
          sub: courseContext.roundsHere != null
            ? t('courses:scorecard.roundsHere', { count: courseContext.roundsHere })
            : undefined,
        });
      }
    }
    return items;
  }, [totals, isTour, heroMuted, fieldRoundTotal, fieldHoles.length, courseContext, isOwner, whoseCap, t]);

  const captions = useMemo(() => {
    const out: string[] = [];
    if (!isTour && courseContext) {
      const avg = courseContext.yourAvgToPar;
      const roundsHere = courseContext.roundsHere ?? 0;
      // A member's first round here has nothing to compare against.
      if (avg != null && roundsHere > 1 && totals.played) {
        const diff = totals.toPar - avg;
        const d = Math.abs(Math.round(diff * 10) / 10);
        if (d < 0.5) out.push(t('courses:scorecard.vsAvgLevel', { whose }));
        else if (diff < 0) out.push(t('courses:scorecard.vsAvgBetter', { n: d.toFixed(1), whose }));
        else out.push(t('courses:scorecard.vsAvgWorse', { n: d.toFixed(1), whose }));
      }
      if (courseContext.rankHere != null && roundsHere > 0) {
        out.push(t('courses:scorecard.rankHereVoice', {
          whose: whoseCap,
          ordinal: formatOrdinal(courseContext.rankHere),
          count: roundsHere,
        }));
      }
    }
    return out;
  }, [isTour, courseContext, totals, whose, whoseCap, t]);

  const fieldCaption = withField && beatFieldOn != null
    ? t(isTour ? 'courses:scorecard.beatFieldOnTour' : 'courses:scorecard.beatFieldVoice', {
        who: subject,
        beat: beatFieldOn,
        scored: fieldHoles.length,
      })
    : null;

  const split = useMemo(() => {
    const d = (h: CardScorecardHole) => (h.strokes as number) - (h.par as number);
    return [
      { label: t('courses:scorecard.splitBirdie'), n: played.filter((h) => d(h) <= -1).length, tone: TOPAR_UNDER_LIGHT },
      { label: t('courses:scorecard.splitPar'), n: played.filter((h) => d(h) === 0).length, tone: TOPAR_EVEN_LIGHT },
      { label: t('courses:scorecard.splitBogey'), n: played.filter((h) => d(h) === 1).length, tone: A.MUTE },
      { label: t('courses:scorecard.splitDouble'), n: played.filter((h) => d(h) >= 2).length, tone: TOPAR_OVER_LIGHT },
    ];
  }, [played, t]);

  const out = holes.filter((h) => h.holeNo <= 9);
  const back = holes.filter((h) => h.holeNo > 9);
  const totalPar = played.reduce((s, h) => s + (h.par as number), 0);

  // The card column header has no room for a name and the legend above already
  // names the player, so a third-person card marks the column with an em dash.
  const cardScoreLabel = isOwner ? t('courses:scorecard.you') : '\u2014';

  const showChip = playerHcpDelta != null && Math.abs(playerHcpDelta) >= 0.05;
  const showIdentity = !!playerName;
  const hasHoles = holes.length > 0;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="light"
      surfaceColor={A.PANEL}
      style={{ background: A.PANEL, height: '75dvh', maxHeight: '75dvh', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', fontFamily: SANS, background: A.PANEL, flex: 1, minHeight: 0, ...FIGS }}>
        {/* HEADER — course-first */}
        <div style={{ padding: '10px 16px 14px', background: A.PANEL, borderBottom: `1px solid ${A.BORDER}`, flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            {!!eyebrowText && (
              <div style={{ ...KICKER, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {eyebrowText}
              </div>
            )}
            <div
              style={{
                fontSize: 17, fontWeight: 800, color: A.INK, marginTop: 3, lineHeight: 1.22,
                letterSpacing: '-0.01em',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {courseName}
            </div>
            {courseLocation && (
              <div style={{ fontSize: 12.5, color: A.MUTE, marginTop: 2 }}>{courseLocation}</div>
            )}
          </div>
        </div>

        <div
          style={{
            flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            background: A.CANVAS,
            padding: '12px 14px calc(env(safe-area-inset-bottom, 0px) + 24px)',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}
        >
          {/* ROUND SELECTOR */}
          {rounds && rounds.available.length > 1 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {rounds.available.map((r) => {
                const active = r === rounds.active;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => rounds.onSelect(r)}
                    aria-pressed={active}
                    style={{
                      padding: '6px 13px', borderRadius: 999,
                      background: active ? A.INK : A.PANEL,
                      color: active ? A.PANEL : A.INK,
                      border: `1px solid ${active ? A.INK : A.BORDER}`,
                      fontFamily: SANS, fontSize: 11.5, fontWeight: 700,
                      letterSpacing: '0.04em', cursor: 'pointer', whiteSpace: 'nowrap',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    R{r}
                  </button>
                );
              })}
            </div>
          )}

          {loading ? (
            <SkeletonMiddle />
          ) : !hasHoles && emptyVariant === 'unavailable' ? (
            <UnavailableMiddle />
          ) : !hasHoles && emptyVariant === 'nohbh' ? (
            <NohbhMiddle gross={emptyGross ?? null} toPar={emptyToPar ?? null} />
          ) : !hasHoles ? (
            <SyncingMiddle />
          ) : (
            <>
              {/* PANEL 1 — the round */}
              <Panel>
                {statItems.length > 0 && <StatRow items={statItems} size={24} style={{ marginBottom: 20 }} />}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 12 }}>
                  <span style={TITLE}>{t('courses:scorecard.howItUnfolded')}</span>
                  {withField && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ ...LABEL, color: A.AMBER_DEEP }}>{isOwner ? t('courses:scorecard.you') : firstName}</span>
                      <span style={LABEL}>{t('courses:scorecard.field')}</span>
                    </span>
                  )}
                </div>

                <TrajectoryLine holes={holes} />

                {(captions.length > 0 || fieldCaption) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                    {captions.length > 0 && <p style={CAPTION}>{captions.join(' ')}</p>}
                    {fieldCaption && <p style={CAPTION}>{fieldCaption}</p>}
                  </div>
                )}

                <div style={{ paddingTop: 12 }}>
                  <Action
                    label={showCard
                      ? t('courses:scorecard.hideCard')
                      : t('courses:scorecard.seeAllHoles', { count: holes.length })}
                    onClick={() => {
                      setShowCard((v) => {
                        if (!v) {
                          analyticsEvents.track('scorecard_card_expanded', {
                            surface,
                            holes: holes.length,
                          });
                        }
                        return !v;
                      });
                    }}
                  />
                </div>

                {showCard && (
                  <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Nine rows={out} label={t('courses:scorecard.out')} withField={withField} scoreLabel={cardScoreLabel} />
                    {back.length > 0 && (
                      <Nine rows={back} label={t('courses:scorecard.in')} withField={withField} scoreLabel={cardScoreLabel} />
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: NINE_GRID, alignItems: 'center', gap: 2 }}>
                      <span style={{ ...LABEL, fontSize: 8, color: A.INK }}>{t('courses:scorecard.total')}</span>
                      <span style={{ gridColumn: 'span 9', ...NUM, fontSize: 11.5, fontWeight: 700, color: A.MUTE }}>
                        {t('courses:scorecard.parN', { n: totalPar })}
                        <span style={{ color: toParColor(totals.toPar), marginLeft: 8 }}>{fmtRel(totals.toPar)}</span>
                      </span>
                      <span style={{ ...NUM, fontSize: 15, color: A.INK, textAlign: 'center' }}>{totals.gross}</span>
                    </div>

                    <Legend />
                  </div>
                )}
              </Panel>

              {/* PANEL 2 — how the round broke down */}
              <Panel title={t('courses:scorecard.howItBrokeDown')}>
                <RoundSplit split={split} />
              </Panel>
            </>
          )}

          {/* PANEL 3 — identity */}
          {showIdentity && (
            <Panel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <SquircleAvatar
                  src={playerAvatarUrl ?? null}
                  alt={playerName}
                  userId={playerUserId ?? undefined}
                  size={40}
                  hairlineRing
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14.5, fontWeight: 700, color: A.INK,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    {playerName}
                  </div>
                  {(identityStat || playerHcp != null) && (
                    <div style={{ ...LABEL, marginTop: 3 }}>
                      {identityStat ? identityStat.label : t('courses:scorecard.handicapIndex')}
                    </div>
                  )}
                </div>
                {(identityStat || playerHcp != null) && (
                  <div style={{ textAlign: 'center', flex: 'none' }}>
                    <div style={{ ...NUM, fontSize: 20, color: A.INK }}>
                      {identityStat ? identityStat.value : formatHcp(playerHcp as number)}
                    </div>
                    {!identityStat && showChip && <HandicapChip delta={playerHcpDelta as number} />}
                  </div>
                )}
              </div>
            </Panel>
          )}

          {/* FOOTER — quiet actions */}
          {(onShareRound || onViewProfile || onViewCourse) && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 22, flexWrap: 'wrap', paddingTop: 2 }}>
              {onShareRound && <Action label={t('courses:scorecard.shareRound')} onClick={onShareRound} />}
              {onViewProfile && <Action label={t('courses:scorecard.viewProfile')} onClick={onViewProfile} />}
              {onViewCourse && <Action label={t('courses:scorecard.viewCourse')} onClick={onViewCourse} />}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default CardScorecardSheet;
