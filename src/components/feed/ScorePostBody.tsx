/**
 * ScorePostBody — THE STANDARD NEW SCORE POST BODY (FN1/FN1.5).
 *
 * Extracted from ExploreCard's scoreLed branch so the Featured round /
 * Round of the week card (FEATURED_ROUND_OPTION_A) renders the SAME body
 * rather than a rebuilt one: the big NET with to-par and the NET label,
 * GROSS (with to-par), HANDICAP and AWARDS when present, the course name,
 * and the animated net line (RoundTilePlot: net only, never gross; not
 * drawn when the round cannot be netted) with the HoleMarks row and
 * OUT/IN totals.
 *
 * Net rules are FN1: nettable requires a course handicap and, once the hole
 * shape has settled, a computable per-hole allowance. No net row = no NET
 * cell, no line; GROSS, HANDICAP (if known) and AWARDS still show.
 * Engagement is NOT part of this body — FeedCard appends the shared
 * media-first footer on score posts; FeaturedRoundCard renders its own
 * actions row.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SANS, NUMF } from '@/components/explore-tab-new/courseled/tokens';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';
import { FEED_CARD_SURFACE } from '@/lib/tokens/surfaces';
import { formatDisplayedHcp } from '@/lib/whs/format';
import { toParLabel } from '@/features/explore-magazine/exploreCopy';
import { AwardCluster } from '@/features/explore-magazine/AwardCluster';
import type { RoundMedalCounts } from '@/features/explore-magazine/useBatchRoundMedals';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { RoundTilePlot } from './roundTilePlot';

const FIGS: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums', fontFeatureSettings: '"kern" 1, "liga" 1' };

export function ScorePostBody({ net, gross, coursePar, courseHandicap, grossToPar, shape, received, scoreId, medals, course, surfaceColor = FEED_CARD_SURFACE, showPlot = true }: {
  net: number | null;
  gross: number | null;
  coursePar: number | null;
  courseHandicap: number | null;
  grossToPar: number | null;
  shape: HoleShape | null | undefined;
  received: readonly number[] | null;
  scoreId: string | null;
  medals?: RoundMedalCounts | null;
  course: string | null;
  /** AwardCluster surface — the card canvas the marks sit on. */
  surfaceColor?: string;
  /** ExploreCard's scoreLed branch draws a photo instead when feedPlot is
   *  off; the featured card always draws the plot. Default true. */
  showPlot?: boolean;
}) {
  const { t } = useTranslation();
  const nettable = courseHandicap != null && (shape ? received != null : true);
  const grossToParText = toParLabel(grossToPar);
  const netShown = nettable && net != null;
  const netToPar = netShown && coursePar != null ? net - coursePar : null;
  const netToParText = toParLabel(netToPar);
  /* CB111.1 — the card's existing to-par rule: UNDER par is TOPAR_UNDER_DARK
     red, level or over is A.MUTE. Never red over par. */
  const toParColor = (v: number | null) => (v ?? 0) < 0 ? TOPAR_UNDER_DARK : A.MUTE;
  const hasAwards = !!medals && (medals.gold > 0 || medals.silver > 0 || medals.bronze > 0);
  const cellLabel: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.DIM };
  return (
    <>
      <span data-round-score-block="true" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '14px 14px 0', fontFamily: SANS, color: A.INK, ...FIGS }}>
        {netShown ? (
          <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <span data-round-score-net="true" style={{ ...FIGS, fontSize: 46, fontWeight: 700, letterSpacing: 0, lineHeight: 1, color: A.INK, whiteSpace: 'nowrap' }}>
              {String(net)}
              {netToParText ? <span data-round-score-net-topar="true" style={{ ...NUMF, fontSize: 17, fontWeight: 600, color: toParColor(netToPar), marginLeft: 6 }}>{netToParText}</span> : null}
            </span>
            <span style={{ ...cellLabel, marginTop: 6 }}>{t('amateur.stream.stat.net', 'Net')}</span>
          </span>
        ) : gross != null ? (
          <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <span data-round-score-gross="true" style={{ ...FIGS, fontSize: 46, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: A.INK, whiteSpace: 'nowrap' }}>
              {String(gross)}
              {grossToParText ? <span data-round-score-gross-topar="true" style={{ ...NUMF, fontSize: 17, fontWeight: 600, color: toParColor(grossToPar), marginLeft: 6 }}>{grossToParText}</span> : null}
            </span>
            <span style={{ ...cellLabel, marginTop: 6 }}>{t('amateur.stream.stat.gross', 'Gross')}</span>
          </span>
        ) : <span />}
        <span style={{ display: 'flex', gap: hasAwards ? 18 : 22, paddingBottom: 16, flex: '0 0 auto' }}>
          {netShown && gross != null ? (
            <span data-round-score-gross="true" style={{ textAlign: 'center' }}>
              <span style={{ ...FIGS, fontSize: 17, fontWeight: 700, color: A.INK, whiteSpace: 'nowrap' }}>
                {String(gross)}
                {grossToParText ? <span data-round-score-gross-topar="true" style={{ ...NUMF, fontSize: 12, fontWeight: 600, color: toParColor(grossToPar), marginLeft: 3 }}>{grossToParText}</span> : null}
              </span>
              <span style={{ ...cellLabel, marginTop: 5 }}>{t('amateur.stream.stat.gross', 'Gross')}</span>
            </span>
          ) : null}
          {nettable ? (
            <span data-round-score-handicap="true" style={{ textAlign: 'center' }}>
              <span style={{ ...FIGS, fontSize: 17, fontWeight: 700, color: A.INK, whiteSpace: 'nowrap' }}>{formatDisplayedHcp(Math.round(courseHandicap))}</span>
              <span style={{ ...cellLabel, marginTop: 5 }}>{t('amateur.stream.stat.handicap', 'Handicap')}</span>
            </span>
          ) : null}
          {hasAwards && medals ? (
            <span data-round-score-awards="true" style={{ textAlign: 'center', flex: 'none' }}>
              <AwardCluster gold={medals.gold} silver={medals.silver} bronze={medals.bronze} surfaceColor={surfaceColor} figureSize={17} />
              <span style={{ ...cellLabel, marginTop: 5 }}>{t('amateur.stream.stat.awards', 'Awards')}</span>
            </span>
          ) : null}
        </span>
      </span>
      {course ? (
        <span data-feed-round-course="true" style={{ display: 'block', padding: '12px 14px 0', fontFamily: SANS, fontSize: 14, fontWeight: 600, color: A.MUTE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {course}
        </span>
      ) : null}
      {showPlot && shape && received ? <RoundTilePlot shape={shape} received={received} scoreId={scoreId} /> : null}
    </>
  );
}

export default ScorePostBody;
