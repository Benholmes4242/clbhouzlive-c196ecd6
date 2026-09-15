import React from 'react';
import { useTranslation } from 'react-i18next';

/* THE PANEL IS THE ANALYTICAL PANEL. Its ground and its muted ink come from the
   analytical token file the brief names, not from the card module, so there is
   one definition of this surface and not a second copy of it. */
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';
import { r } from '@/lib/radius';

import type { AchievementCallout } from './cardTreatment';
import { standingOrdinal } from './ordinal';
import {
  BirdieCountIcon,
  CALLOUT_ICON,
  CrownIcon,
  RankUpIcon,
  ShieldCheckIcon,
  StarIcon,
} from './achievementIcons';

/**
 * THE ACHIEVEMENT CALLOUT PANEL (BRIEF_EXPLORE_TWO_SHAPES §5).
 *
 * A SPECIAL ROUND IS MARKED, NEVER ENLARGED. The card keeps its shape and this
 * panel sits between the photograph and the kicker — Strava's model — so the
 * page stays one readable rhythm and the achievement still lands.
 *
 * THE PANEL IS THE EXISTING ANALYTICAL PANEL TOKEN (A.PANEL), slightly lighter
 * than the canvas, with NO border: separation is a panel edge, not a rule.
 *
 * SUBLINES ONLY FROM FACTS THE ITEM CARRIES. Every subline below is guarded on
 * the fact that produces it; there is no branch that invents a hole, a previous
 * holder or a margin.
 */
export function AchievementCalloutPanel({
  callout,
  locale,
}: {
  callout: AchievementCallout;
  locale: string;
}) {
  const { t } = useTranslation('courses');
  const ordHole = (hole: number) => standingOrdinal(hole, locale);

  const { icon, title, subline } = ((): {
    icon: React.ReactNode;
    title: string;
    subline: string | null;
  } => {
    switch (callout.kind) {
      case 'record':
        return {
          icon: <CrownIcon />,
          title: t('amateur.stream.callout.record', 'Course record'),
          subline: null,
        };
      case 'rank_up':
        return {
          icon: <RankUpIcon />,
          title:
            callout.rank != null
              ? t('amateur.stream.callout.rankUpTo', 'Up to {{ord}} here', {
                  ord: ordHole(callout.rank),
                })
              : t('amateur.stream.callout.rankUp', 'Moved up the board'),
          subline: null,
        };
      case 'ace':
        return {
          icon: <StarIcon />,
          title: t('amateur.stream.callout.ace', 'Hole in one'),
          subline:
            callout.hole != null
              ? t('amateur.stream.callout.onHole', 'on the {{ord}}', { ord: ordHole(callout.hole) })
              : null,
        };
      case 'albatross':
        return {
          icon: <StarIcon />,
          title: t('amateur.stream.callout.albatross', 'Albatross'),
          subline:
            callout.hole != null
              ? t('amateur.stream.callout.onHole', 'on the {{ord}}', { ord: ordHole(callout.hole) })
              : null,
        };
      case 'eagle':
        return {
          icon: <StarIcon />,
          title: t('amateur.stream.callout.eagle', 'Eagle'),
          subline:
            callout.hole != null
              ? t('amateur.stream.callout.onHole', 'on the {{ord}}', { ord: ordHole(callout.hole) })
              : null,
        };
      case 'birdies':
        return {
          icon: <BirdieCountIcon count={callout.count} />,
          title: t('amateur.stream.callout.birdies', '{{n}} birdies', { n: callout.count }),
          subline: null,
        };
      case 'clean':
        return {
          icon: <ShieldCheckIcon />,
          title: t('amateur.stream.callout.bogeyFree', 'Bogey-free'),
          subline: t('amateur.stream.callout.bogeyFreeSub', 'Par or better on every hole'),
        };
    }
  })();

  return (
    <span
      data-explore-callout={callout.kind}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        boxSizing: 'border-box',
        marginTop: 10,
        marginBottom: 10,
        padding: '10px 12px',
        borderRadius: r.md,
        background: A.PANEL,
        minWidth: 0,
      }}
    >
      <span aria-hidden style={{ display: 'flex', flex: `0 0 ${CALLOUT_ICON}px` }}>
        {icon}
      </span>
      <span style={{ display: 'block', minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontFamily: SANS,
            fontSize: 13.5,
            fontWeight: 700,
            color: '#FFFFFF',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
        {subline ? (
          <span
            style={{
              display: 'block',
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 600,
              color: A.MUTE,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subline}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export default AchievementCalloutPanel;
