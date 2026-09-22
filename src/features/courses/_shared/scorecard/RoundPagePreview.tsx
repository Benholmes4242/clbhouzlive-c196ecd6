/**
 * BRIEF_ROUND_SHEET_PEEK §1 — THE NEIGHBOUR, VISIBLE DURING THE SWIPE.
 *
 * A sideways drag used to slide the round away and leave the sheet empty until
 * release. This draws the round the finger is bringing in, edge to edge beside
 * the current page, so both are on screen at once.
 *
 * IT IS NOT A SECOND SHEET AND NOT A LOOK-ALIKE. It renders the SAME
 * RoundSummaryHead and the SAME <Nine> the sheet itself renders (scorecardParts),
 * from a SEED the stream already read. NOTHING HERE FETCHES: no query, no
 * reaction, no comment count, no "at this course" section, no stats observer.
 * That is what makes it free to mount and unmount inside a drag, and it is why
 * the swap at commit is invisible — the real sheet draws the same seed at the
 * same position before the preview unmounts.
 */

import React from 'react';

import { roundCoursePar } from '@/lib/whs/api';
import { useTranslation } from 'react-i18next';

import type { RoundDetailSeed } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { fmtDateEyebrow } from '@/components/profile/handicap/whs/sections/round-detail/roundDateEyebrow';
import { FIGS } from '@/features/courses/components/holes/analytical/tokens';
import {
  Nine, NotPlayedLine, RoundSummaryHead, SANS, ScorecardSection,
  SyncingMiddle, UnavailableMiddle,
} from './scorecardParts';

export interface RoundPagePreviewProps {
  /** The neighbour's seed. NULL still draws the summary-less fallback middle. */
  seed: RoundDetailSeed | null;
  /** The viewer's own round — the one case the member's name is amber. */
  isOwner?: boolean;
  /**
   * A neighbour with no hole data shows the middle the sheet would show, never
   * a blank. 'syncing' is the honest default: the rows have not arrived yet.
   */
  emptyVariant?: 'syncing' | 'unavailable';
}

/* Memoised: the host translates this by the finger every frame, and a redraw
   per frame for a movement that is pure transform would be wasted work. */
export const RoundPagePreview: React.FC<RoundPagePreviewProps> = React.memo(({
  seed, isOwner = false, emptyVariant = 'syncing',
}) => {
  const { t } = useTranslation(['courses']);

  const holes = (seed?.holes ?? [])
    .slice()
    .sort((a, b) => a.holeNo - b.holeNo)
    .map((h) => ({
      holeNo: h.holeNo, par: h.par, strokes: h.strokes, fieldAvg: null,
      played: h.played ?? null,
    }));
  const played = holes.filter((h) => h.strokes != null && h.strokes > 0 && h.par != null);
  const hasCard = played.length > 0;
  const out = holes.filter((h) => h.holeNo <= 9);
  const back = holes.filter((h) => h.holeNo > 9);
  const hasUnplayedHole = holes.length > 0 && played.length !== holes.length;
  /**
   * BRIEF_SCORECARD_HEAD_PAR — ONE SOURCE FOR THE ROUND PAR, roundCoursePar.
   * The seed carries no declared length (whs_scores.total_holes) and its rows
   * carry no `played`, so the preview's par is NULL and the head prints none.
   * That is deliberate: inferring the length from the number of seeded rows is
   * the exact fault this rule exists to prevent.
   */
  const shownPar = roundCoursePar(
    holes.map((h) => ({ par: h.par, played: h.played })),
    seed?.totalHoles ?? null,
  );

  return (
    <div
      aria-hidden="true"
      data-round-page-preview="true"
      style={{
        display: 'flex', flexDirection: 'column', fontFamily: SANS,
        height: '100%', minHeight: 0, ...FIGS,
      }}
    >
      <RoundSummaryHead
        courseName={seed?.courseName ?? ''}
        courseLocation={seed?.placeLine ?? null}
        kickerText={fmtDateEyebrow(seed?.playDate ?? null)}
        showScore={seed?.gross != null}
        gross={seed?.gross ?? null}
        toPar={seed?.toPar ?? null}
        shownPar={shownPar}
        playerName={seed?.playerName ?? null}
        playerAvatarUrl={seed?.playerAvatarUrl ?? null}
        isOwner={isOwner}
      />
      <div
        style={{
          flex: 1, minHeight: 0, overflow: 'hidden',
          padding: '12px 14px calc(env(safe-area-inset-bottom, 0px) + 24px)',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >
        {hasCard ? (
          <ScorecardSection kicker={t('courses:scorecard.theCard')} flat>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Nine rows={out} label={t('courses:scorecard.out')} />
              {back.length > 0 && <Nine rows={back} label={t('courses:scorecard.in')} />}
              {hasUnplayedHole && <NotPlayedLine />}
            </div>
          </ScorecardSection>
        ) : emptyVariant === 'unavailable' ? (
          <UnavailableMiddle />
        ) : (
          <SyncingMiddle />
        )}
      </div>
    </div>
  );
});
RoundPagePreview.displayName = 'RoundPagePreview';

export default RoundPagePreview;
