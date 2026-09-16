import React from 'react';
import { useTranslation } from 'react-i18next';

/* THE PANEL IS THE ANALYTICAL PANEL. Its ground and its muted ink come from the
   analytical token file the brief names, not from the card module, so there is
   one definition of this surface and not a second copy of it. */
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';
import { r } from '@/lib/radius';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';

import type { AchievementCallout } from './cardTreatment';
import { standingOrdinal } from './ordinal';
import {
  BirdieCountIcon,
  CALLOUT_ICON,
  CrownIcon,
  NetRecordIcon,
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
          title: t('amateur.stream.callout.record', 'New course record'),
          subline: null,
        };
      case 'net_record':
        return {
          icon: <NetRecordIcon />,
          title: t('amateur.stream.callout.netRecord', 'New net course record'),
          subline: null,
        };
      case 'rank_up':
        return {
          icon: <RankUpIcon />,
          title:
            callout.rank != null
              ? t('amateur.stream.callout.rankUpTo', 'Up to {{ord}}', {
                  ord: ordHole(callout.rank),
                })
              : t('amateur.stream.callout.rankUp', 'Moved up'),
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

export function vsHandicapLabel(net: number, par: number): string {
  const delta = net - par;
  if (delta === 0) return 'Level';
  return delta < 0 ? `\u2212${Math.abs(delta)}` : `+${delta}`;
}

function FigureCell({ label, value, under }: { label: string; value: string; under?: boolean }) {
  return (
    <span
      data-explore-stat={label.toLowerCase().replace(/\s+/g, '-')}
      style={{
        display: 'flex',
        minWidth: 0,
        minHeight: 52,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        borderLeft: `0.5px solid ${A.HAIRLINE}`,
      }}
    >
      <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, color: A.MUTE, letterSpacing: '0.08em' }}>
        {label}
      </span>
      <span
        data-explore-stat-value={label.toLowerCase().replace(/\s+/g, '-')}
        style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: under ? TOPAR_UNDER_DARK : A.INK }}
      >
        {value}
      </span>
    </span>
  );
}

export function RoundStatStrip({
  callout,
  coursePar,
  net,
  locale,
}: {
  callout: AchievementCallout | null;
  coursePar: number | null;
  net: number | null;
  locale: string;
}) {
  const { t } = useTranslation('courses');
  const hasNet = coursePar != null && net != null;
  if (!callout && !hasNet) return null;

  const ord = callout?.kind === 'rank_up' && callout.rank != null
    ? standingOrdinal(callout.rank, locale)
    : null;
  const achievement = callout ? (() => {
    switch (callout.kind) {
      case 'record': return {
        icon: <CrownIcon />,
        tag: t('amateur.stream.callout.tagNew', 'NEW'),
        label: t('amateur.stream.callout.courseRecord', 'Course record'),
      };
      case 'net_record': return {
        icon: <NetRecordIcon />,
        tag: t('amateur.stream.callout.tagNew', 'NEW'),
        label: t('amateur.stream.callout.netCourseRecord', 'Net course record'),
      };
      case 'rank_up': return {
        icon: <RankUpIcon />,
        tag: ord ? t('amateur.stream.callout.tagMovedUp', 'MOVED UP') : null,
        label: ord
          ? t('amateur.stream.callout.nowRank', 'Now {{ord}}', { ord })
          : t('amateur.stream.callout.movedUpBoard', 'Moved up the board'),
      };
      case 'ace': return { icon: <StarIcon />, tag: null, label: t('amateur.stream.callout.ace', 'Hole in one') };
      case 'albatross': return { icon: <StarIcon />, tag: null, label: t('amateur.stream.callout.albatross', 'Albatross') };
      case 'eagle': return { icon: <StarIcon />, tag: null, label: t('amateur.stream.callout.eagle', 'Eagle') };
      case 'birdies': return {
        icon: <BirdieCountIcon count={callout.count} />,
        tag: null,
        label: t('amateur.stream.callout.birdies', '{{n}} birdies', { n: callout.count }),
      };
      case 'clean': return { icon: <ShieldCheckIcon />, tag: null, label: t('amateur.stream.callout.bogeyFree', 'Bogey-free') };
    }
  })() : null;

  return (
    <span
      data-explore-stat-strip="round"
      data-explore-stat-layout={achievement && hasNet ? 'achievement-and-figures' : achievement ? 'achievement-only' : 'figures-only'}
      style={{
        display: 'grid',
        gridTemplateColumns: achievement && hasNet ? 'minmax(0, 2.3fr) repeat(3, minmax(0, 0.7fr))' : hasNet ? 'repeat(3, minmax(0, 1fr))' : 'minmax(0, 1fr)',
        width: '100%',
        minWidth: 0,
        marginTop: 10,
        marginBottom: 10,
        borderRadius: r.md,
        background: A.PANEL,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {achievement ? (
        <span
          data-explore-stat="achievement"
          data-explore-callout={callout?.kind}
          style={{ display: 'flex', minWidth: 0, minHeight: 52, alignItems: 'center', gap: 8, padding: '8px 10px', boxSizing: 'border-box' }}
        >
          <span aria-hidden style={{ display: 'flex', flex: `0 0 ${CALLOUT_ICON}px` }}>{achievement.icon}</span>
          <span style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, gap: 2 }}>
            {achievement.tag ? (
              <span
                data-explore-achievement-tag="true"
                style={{ fontFamily: SANS, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', lineHeight: 1, textTransform: 'uppercase', color: A.AMBER, whiteSpace: 'nowrap' }}
              >
                {achievement.tag}
              </span>
            ) : null}
            <span
              data-explore-achievement-label="true"
              style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, lineHeight: 1.15, color: A.INK, whiteSpace: 'normal', overflowWrap: 'break-word' }}
            >
              {achievement.label}
            </span>
          </span>
        </span>
      ) : null}
      {hasNet ? (
        <>
          <FigureCell label={t('amateur.stream.stat.par', 'PAR')} value={String(coursePar)} />
          <FigureCell label={t('amateur.stream.stat.net', 'NET')} value={String(net)} under={(net as number) < (coursePar as number)} />
          <FigureCell label={t('amateur.stream.stat.vsHcp', 'VS HCP')} value={vsHandicapLabel(net as number, coursePar as number)} under={(net as number) < (coursePar as number)} />
        </>
      ) : null}
    </span>
  );
}
