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
/** Feed card std photo height (ExploreCard PHOTO_H.std). The pane grows only if
 *  its copy needs more, exactly as the feed's on-photo card does. */
const PANE_H = 210;
/** The feed card's std trace band and width. */
const SHAPE_BAND = 52;
const SHAPE_W = 350;
/** §5 — the dark stop begins at 22%, ABOVE the headline, so the whole text block
 *  (headline, kicker, who line) and the trace sit on >= 0.72 black. */
const SCRIM =
  'linear-gradient(180deg, color-mix(in srgb, black 45%, transparent) 0%, color-mix(in srgb, black 20%, transparent) 14%, color-mix(in srgb, black 72%, transparent) 22%, color-mix(in srgb, black 90%, transparent) 100%)';
const TEXT_SHADOW = '0 1px 2px color-mix(in srgb, black 45%, transparent)';
const FIG: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums', fontFeatureSettings: '"kern" 1, "liga" 1' };
const BIG: React.CSSProperties = { fontSize: 44, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: A.INK, ...FIG };
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `${MINUS}${Math.abs(n)}` : `${n}`);
const toPar = (n: number | null) => (n == null ? null : n === 0 ? 'E' : signed(n));

function Headline({ r }: { r: FeaturedRound }) {
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
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
          <span style={BIG}>{r.gross}</span>
          {r.to_par != null && r.to_par < 0 ? (
            <span style={{ fontSize: 19, fontWeight: 700, color: TOPAR_UNDER_DARK, ...FIG }}>{toPar(r.to_par)}</span>
          ) : null}
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
        <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.19em', textTransform: 'uppercase', color: A.MUTE }}>
            {k('vsHandicap')}
          </span>
          <span style={BIG}>{r.vs_hcp == null ? null : signed(r.vs_hcp)}</span>
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
  const { t } = useTranslation('courses');
  const k = (key: string, opts?: Record<string, unknown>) => t(`courseDetail.featured.${key}`, opts);
  const mine = !!viewerId && r.user_id === viewerId;

  const image = r.image_url;
  const gross = r.gross == null ? null : `${r.gross}`;
  const par = toPar(r.to_par);

  // §4 THE KICKER CARRIES WHAT THE HEADLINE DOES NOT. No figure in both.
  let parts: (string | null)[];
  if (r.tier === 2) {
    parts = [
      (r.joint_count ?? 0) >= 2
        ? k('courseRecordJoint_other', { count: r.joint_count })
        : r.joint_count === 1 && r.joint_name
          ? k('courseRecordJoint_one', { name: r.joint_name })
          : k('courseRecord'),
    ];
  } else if (r.tier === 3 && r.reason !== 'eagle_brace' && r.reason !== 'stableford_45') {
    parts = [gross]; // headline already showed the to-par
  } else if (r.tier >= 5) {
    parts = [gross, par, r.net_score != null ? k('netFact', { net: r.net_score }) : null];
  } else {
    parts = [gross, par];
  }
  const kicker = parts.filter(Boolean).join(' · ');
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
            background: gold(18),
            border: `1px solid ${gold(34)}`,
          }}
        >
          <Trophy size={12} color={GOLD} strokeWidth={2.4} aria-hidden="true" />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.17em', textTransform: 'uppercase', color: GOLD }}>
            {k('label')}
          </span>
        </div>
        {/* The pill lane, then copy at the foot: headline, kicker, who line. */}
        <div style={{ flex: '0 0 48px' }} />
        <div style={{ flex: '1 1 auto' }} />
        <div style={{ position: 'relative', padding: '0 16px', textShadow: TEXT_SHADOW }}>
          <Headline r={r} />
          {kicker ? (
            <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 600, color: A.INK, ...FIG }}>{kicker}</div>
          ) : null}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {/* §1 THE AVATAR IS 30px, EXPLICITLY — it can never fill the pane again. */}
            <span style={{ width: 30, height: 30, flex: '0 0 30px', display: 'inline-flex' }}>
              <SquircleAvatar size={30} src={r.photo_url} alt={r.display_name ?? ''} userId={r.user_id} hairlineRing hideRing={false} />
            </span>
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 700, color: mine ? A.AMBER : A.INK }}>
              {mine ? t('courseDetail.records.you') : r.display_name}
              {r.course_name ? <span style={{ fontWeight: 500, color: A.INK }}> · {r.course_name}</span> : null}
            </span>
          </div>
        </div>
        <div aria-hidden="true" style={{ position: 'relative', height: shape ? SHAPE_BAND + 12 : 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
          {shape ? (
            <RoundShape row={traceRow} shape={shape} width={SHAPE_W} height={SHAPE_BAND - EXPLORE_END_LABEL_BAND}
              showMeta={false} showBaseline baselineColor="rgba(255,255,255,0.34)" strokeWidth={2.2}
              exploreLineOnly endLabels exploreGlow underParFill />
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
