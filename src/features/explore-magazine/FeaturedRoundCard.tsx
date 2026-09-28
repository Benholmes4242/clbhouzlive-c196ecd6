/**
 * BRIEF_SCORES_FEATURED_ROUND — THE ONE ENLARGED ROUND.
 *
 * AchievementCallout's "a special round is MARKED, NEVER ENLARGED" still governs
 * the FEED. This hero is the one agreed exception (Ben), mounted only in the
 * slot above the All feed. No feed card changes. BRIEF_FEATURED_ROUND_FIXES:
 * the pane is the feed card's photographic treatment (course image_url, the
 * same RoundShape trace) plus a gold frame, a pill and a headline.
 *
 * GOLD, NEVER AMBER, ON THE FRAME. Gold means a rare achievement (eagle chips,
 * ace ring). Amber means the viewing member, so on the viewer's own round only
 * the NAME turns amber and reads "You".
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, ChevronRight } from 'lucide-react';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';
import { SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';
import { MINUS } from './exploreCopy';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { EXPLORE_END_LABEL_BAND, RoundShape } from '@/components/explore-tab-new/courseled/RoundShape';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { FeaturedRound } from './useFeaturedRound';

const GOLD = SC_FILL_GOLD;
const gold = (pct: number) => `color-mix(in srgb, ${GOLD} ${pct}%, transparent)`;
/** BRIEF_FEATURED_ROUND_PANE_V2 §1 — 290, never less. 210 left no room for the
 *  trace and the text block to coexist. The pane may grow if copy wraps. */
const PANE_H = 290;
/** The feed card's std trace band and width. */
const SHAPE_BAND = 52;
const SHAPE_W = 350;
/** V2 §6 — the trace sits in the upper middle on >= 0.5 black; the dark stop
 *  begins at 48%, ABOVE the headline, reaching 0.86 by 60% and 0.94 at the foot,
 *  so the lower-third text holds 4.5:1 over the brightest possible photograph. */
const SCRIM =
  'linear-gradient(180deg, color-mix(in srgb, black 55%, transparent) 0%, color-mix(in srgb, black 50%, transparent) 20%, color-mix(in srgb, black 55%, transparent) 42%, color-mix(in srgb, black 86%, transparent) 60%, color-mix(in srgb, black 94%, transparent) 100%)';
/** V2 §4 — the unit label beside the figure, on its baseline. */
const UNIT: React.CSSProperties = { fontSize: 9, fontWeight: 700, letterSpacing: '0.19em', textTransform: 'uppercase', color: A.INK };
const TEXT_SHADOW = '0 1px 2px color-mix(in srgb, black 45%, transparent)';
const FIG: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums', fontFeatureSettings: '"kern" 1, "liga" 1' };
const BIG: React.CSSProperties = { fontSize: 44, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: A.INK, ...FIG };
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `${MINUS}${Math.abs(n)}` : `${n}`);
const toPar = (n: number | null) => (n == null ? null : n === 0 ? 'E' : signed(n));

function Headline({ r, unit }: { r: FeaturedRound; unit?: string | null }) {
  const { t } = useTranslation('courses');
  const k = (key: string, opts?: Record<string, unknown>) => t(`courseDetail.featured.${key}`, opts);
  const feat = (text: string) => (
    <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: GOLD, lineHeight: 1.05 }}>{text}</span>
  );
  const points = (n: number) => (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
      <span style={BIG}>{n}</span>
      <span style={{ fontSize: 17, fontWeight: 600, color: A.INK }}>{k('stablefordPoints')}</span>
    </span>
  );
  switch (r.tier) {
    case 1:
      return feat((r.holes_in_one ?? 0) > 0 || r.reason === 'hole_in_one' ? k('holeInOne') : k('albatross'));
    case 2:
      return (
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={BIG}>{r.gross}</span>
          {r.to_par != null && r.to_par < 0 ? (
            <span style={{ fontSize: 19, fontWeight: 700, color: TOPAR_UNDER_DARK, ...FIG }}>{toPar(r.to_par)}</span>
          ) : null}
          {unit ? <span style={{ ...UNIT, marginLeft: 2 }}>{unit}</span> : null}
        </span>
      );
    case 3:
      if (r.reason === 'eagle_brace') return <span style={BIG}>{k('eagleBrace', { count: r.eagles })}</span>;
      if (r.reason === 'stableford_45') return points(r.stableford);
      return <span style={{ ...BIG, color: TOPAR_UNDER_DARK }}>{toPar(r.to_par)}</span>;
    case 4:
      if (r.reason === 'stableford_40') return points(r.stableford);
      if (r.reason === 'birdie_haul')
        return <span style={BIG}>{k(r.birdies === 1 ? 'birdieHaul_one' : 'birdieHaul_other', { count: r.birdies })}</span>;
      return <span style={BIG}>{k('cleanCard')}</span>;
    default:
      return (
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10 }}>
          <span style={BIG}>{r.vs_hcp == null ? null : signed(r.vs_hcp)}</span>
          <span style={UNIT}>{k('vsHandicap')}</span>
        </span>
      );
  }
}

export const FeaturedRoundCard: React.FC<{
  round: FeaturedRound;
  viewerId?: string;
  shape?: HoleShape | null;
  onOpen: () => void;
}> = ({
  round: r,
  viewerId,
  shape = null,
  onOpen,
}) => {
  const { t, i18n } = useTranslation('courses');
  const k = (key: string, opts?: Record<string, unknown>) => t(`courseDetail.featured.${key}`, opts);
  const mine = !!viewerId && r.user_id === viewerId;

  const image = r.image_url;
  const gross = r.gross == null ? null : `${r.gross}`;
  const par = toPar(r.to_par);

  // §4 THE KICKER CARRIES WHAT THE HEADLINE DOES NOT. No figure in both.
  let parts: (string | null)[];
  let unit: string | null = null;
  if (r.tier === 2) {
    parts = [];
    // V2 §4 — the record label is the figure's unit, set beside it.
    unit =
      (r.joint_count ?? 0) >= 2
        ? k('courseRecordJoint_other', { count: r.joint_count })
        : r.joint_count === 1 && r.joint_name
          ? k('courseRecordJoint_one', { name: r.joint_name })
          : k('courseRecord');
  } else if (r.tier === 3 && r.reason !== 'eagle_brace' && r.reason !== 'stableford_45') {
    parts = [gross]; // headline already showed the to-par
  } else if (r.tier >= 5) {
    parts = [gross, par, r.net_score != null ? k('netFact', { net: r.net_score }) : null];
  } else {
    parts = [gross, par];
  }
  const date = r.play_date
    ? new Date(r.play_date).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })
    : null;
  // V2 §5 — the place line: course · the kicker's figures · date.
  const placeLine = [r.course_name, ...parts, date].filter(Boolean).join(' · ');
  const traceRow = { round_id: r.whs_score_id, front_nine_to_par: null, back_nine_to_par: null } as unknown as CircleRoundRow;

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: 0,
        borderRadius: 18,
        border: `1px solid ${gold(26)}`,
        overflow: 'hidden',
        background: A.PANEL,
        fontFamily: SANS,
        cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative', minHeight: PANE_H, display: 'flex', flexDirection: 'column' }}>
        {image ? (
          <img src={image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : null}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: SCRIM }} />
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            borderRadius: 999,
            padding: '5px 11px 5px 8px',
            // V2 §6 — the pill carries its own darkening so gold reads on a bright sky.
            background: `linear-gradient(${gold(18)}, ${gold(18)}), color-mix(in srgb, black 64%, transparent)`,
            zIndex: 1,
            border: `1px solid ${gold(34)}`,
          }}
        >
          <Trophy size={12} color={GOLD} strokeWidth={2.4} aria-hidden="true" />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.17em', textTransform: 'uppercase', color: GOLD }}>
            {k('label')}
          </span>
        </div>
        {/* V2 §2/§3 — pill lane, the trace in the upper middle with air around it,
            then the text block in the lower third. */}
        <div style={{ flex: '0 0 52px' }} />
        <div aria-hidden="true" style={{ position: 'relative', flex: '1 1 auto', minHeight: shape ? SHAPE_BAND + 36 : 24, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0 18px' }}>
          {shape ? (
            <RoundShape row={traceRow} shape={shape} width={SHAPE_W} height={SHAPE_BAND - EXPLORE_END_LABEL_BAND}
              showMeta={false} showBaseline baselineColor="rgba(255,255,255,0.34)" strokeWidth={2.2}
              exploreLineOnly endLabels exploreGlow underParFill />
          ) : null}
        </div>
        <div style={{ position: 'relative', padding: '0 16px 16px', textShadow: TEXT_SHADOW }}>
          <Headline r={r} unit={unit} />
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {/* §1 THE AVATAR IS 30px, EXPLICITLY — it can never fill the pane again. */}
            <span style={{ width: 30, height: 30, flex: '0 0 30px', display: 'inline-flex' }}>
              <SquircleAvatar size={30} src={r.photo_url} alt={r.display_name ?? ''} userId={r.user_id} hairlineRing hideRing={false} />
            </span>
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: mine ? A.AMBER : A.INK }}>
              {mine ? t('courseDetail.records.you') : r.display_name}
            </span>
          </div>
          {placeLine ? (
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 500, color: A.INK, ...FIG }}>{placeLine}</div>
          ) : null}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          background: gold(6),
          fontSize: 13,
          color: A.INK,
        }}
      >
        <span style={{ flex: 1, minWidth: 0 }}>{k('strapline')}</span>
        <ChevronRight size={16} color={A.MUTE} aria-hidden="true" />
      </div>
    </button>
  );
};
