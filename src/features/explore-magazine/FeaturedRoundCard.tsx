/**
 * BRIEF_SCORES_FEATURED_ROUND — THE ONE ENLARGED ROUND.
 *
 * AchievementCallout's "a special round is MARKED, NEVER ENLARGED" still governs
 * the FEED. This hero is the one agreed exception (Ben), mounted only in the
 * slot above the Scores feed. No feed card changes.
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
import type { FeaturedRound } from './useFeaturedRound';

const GOLD = SC_FILL_GOLD;
const gold = (pct: number) => `color-mix(in srgb, ${GOLD} ${pct}%, transparent)`;
const SCRIM =
  'linear-gradient(180deg, color-mix(in srgb, black 45%, transparent) 0%, color-mix(in srgb, black 5%, transparent) 34%, color-mix(in srgb, black 88%, transparent) 100%)';
const FIG: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums', fontFeatureSettings: '"kern" 1, "liga" 1' };
const BIG: React.CSSProperties = { fontSize: 44, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: A.INK, ...FIG };
const toPar = (n: number) => (n === 0 ? 'E' : n > 0 ? `+${n}` : `${n}`);

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
      return feat(r.holes_in_one > 0 || r.reason === 'hole_in_one' ? k('holeInOne') : k('albatross'));
    case 2:
      return (
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
          <span style={BIG}>{r.gross}</span>
          {r.to_par < 0 ? (
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
          <span style={BIG}>{r.vs_hcp > 0 ? `+${r.vs_hcp}` : r.vs_hcp}</span>
        </span>
      );
  }
}

export const FeaturedRoundCard: React.FC<{ round: FeaturedRound; viewerId?: string; onOpen: () => void }> = ({
  round: r,
  viewerId,
  onOpen,
}) => {
  const { t } = useTranslation('courses');
  const k = (key: string, opts?: Record<string, unknown>) => t(`courseDetail.featured.${key}`, opts);
  const mine = !!viewerId && r.user_id === viewerId;
  const image = r.photo_url || r.image_url;

  // KICKER, ALWAYS: gross and to-par, plus one more fact. The score is never lost.
  const extra =
    r.tier === 2
      ? r.joint_with
        ? k('courseRecordJoint', { names: r.joint_with })
        : k('courseRecord')
      : r.tier === 5 && r.net_score != null
        ? `Net ${r.net_score}`
        : null;
  const kicker = [`${r.gross}`, toPar(r.to_par), extra].filter(Boolean).join(' · ');

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
      <div style={{ position: 'relative', height: 290 }}>
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
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: mine ? A.AMBER : A.INK, marginBottom: 8 }}>
            {mine ? 'You' : r.display_name}
            <span style={{ fontWeight: 600, color: A.MUTE }}> · {r.course_name}</span>
          </div>
          <Headline r={r} />
          <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 600, color: A.MUTE, ...FIG }}>{kicker}</div>
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
