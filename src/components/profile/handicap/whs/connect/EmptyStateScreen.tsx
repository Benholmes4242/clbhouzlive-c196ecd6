import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHomeClubStatus } from '@/features/home-club/useHomeClubStatus';
import { openHomeClubPicker } from '@/features/home-club/homeClubPickerStore';
import { ABOUT_KICKER } from '@/components/courses/course-detail/about/AboutSection';
import { courseBucketShares } from '@/features/courses/components/holes/analytical/HoleRowV2';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { useConnectIntroCourse, stripClubSuffix, type ConnectIntroCourse } from './useConnectIntroCourse';
import { IntroHoleChart } from './IntroHoleChart';
import { ScoringBand } from './ScoringBand';
import { MUTE, DIM, INK, AMBER, NUM } from './designTokens';
import { PrimaryButton, Action, FooterBar, Stage } from './Primitives';

interface Props {
  onPickCountry: () => void;
  onDecline?: () => void;
}

const PROMISES = ['analyse', 'leaderboards', 'topTen', 'community'] as const;

/** Row hairline on the stage-1 canvas (brief-specified weight). */
const PROMISE_RULE = 'rgba(255,255,255,0.11)';

/**
 * STAGE 1 - INTRO, THE EVIDENCE SCREEN. Resolves a real course through
 * useConnectIntroCourse (which reads useHomeClubStatus context and calls
 * get_course_hole_analysis) and draws it with the app's own How it plays
 * panel plus the connect-only IntroHoleChart. It never prints a round count.
 *
 * The four-promise screen below is the FALLBACK for when no course
 * qualifies, and is unchanged.
 *
 * The flow container paints flat SURFACE here, not WASH (CE).
 */
const TAIL_CSS = `
.ci-change { margin-top: 16px }
@media (max-height: 740px) { .ci-lead { display: none } .ci-change { margin-top: 0 } }
`;

/** Two lines at every width: measured, never estimated (brief §2b). */
const FittedHeadline: React.FC<{ line1: string; line2: string }> = ({ line1, line2 }) => {
  const ref = React.useRef<HTMLHeadingElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const MAX = window.innerHeight <= 740 ? 30 : 42;
      el.style.fontSize = `${MAX}px`;
      const spans = Array.from(el.children) as HTMLElement[];
      const widest = Math.max(1, ...spans.map((s) => s.scrollWidth));
      el.style.fontSize = `${Math.min(MAX, (MAX * (el.clientWidth - 2)) / widest)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [line1, line2]);
  return (
    <h1 ref={ref} style={{ margin: 0, fontSize: 42, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.03, color: INK }}>
      <span style={{ display: 'block', whiteSpace: 'nowrap' }}>{line1}</span>
      <span style={{ display: 'block', whiteSpace: 'nowrap' }}>{line2}</span>
    </h1>
  );
};

/** The evidence screen: a real course measured from real rounds. totalRounds is never printed. */
const EvidenceBody: React.FC<{ course: ConnectIntroCourse; hasHomeClub: boolean; onChange: () => void }> = ({
  course,
  hasHomeClub,
  onChange,
}) => {
  const { t } = useTranslation('handicap');
  const { holes } = course;
  const shares = courseBucketShares(holes);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: '1 0 auto' }}>
      <style>{TAIL_CSS}</style>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK, marginBottom: 14 }}>
        {course.source === 'home' ? t('whsConnect.intro.kickerHomeClub') : t('whsConnect.intro.kickerTop100')}
      </div>
      <FittedHeadline line1={`${stripClubSuffix(course.courseName)},`} line2={t('whsConnect.intro.headlineSuffix')} />

      <div style={{ flex: '2 1 0', minHeight: 0, maxHeight: 96 }} />

      <div style={{ flexShrink: 0 }}>
        <IntroHoleChart holes={holes} />
        <div style={{ marginTop: 10, fontSize: 11.5, lineHeight: 1.5, color: A.MUTE }}>{t('whsConnect.intro.chartCaption')}</div>
        {shares ? <ScoringBand shares={shares} /> : null}
      </div>

      <div style={{ flex: '1 1 0', minHeight: 14 }} />

      <div style={{ flexShrink: 0, paddingBottom: 18 }}>
        <div className="ci-lead" style={{ fontSize: 13.5, fontWeight: 400, lineHeight: 1.52, color: A.MUTE }}>
          <Trans t={t} i18nKey="whsConnect.intro.lead" components={{ 1: <span style={{ fontWeight: 700, color: INK }} /> }} />
        </div>
        <div className="ci-change">
          <Action onClick={onChange} color={INK}>
            {hasHomeClub ? t('whsConnect.intro.changeCourse') : t('whsConnect.intro.setHomeClub')}
          </Action>
        </div>
      </div>
    </div>
  );
};

export const EmptyStateScreen: React.FC<Props> = ({ onPickCountry, onDecline }) => {
  const { t } = useTranslation('handicap');
  const qc = useQueryClient();
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const home = useHomeClubStatus(userId);
  const intro = useConnectIntroCourse(home.clubId);
  const pending = home.isLoading || intro.isPending;

  const onChange = () =>
    openHomeClubPicker({
      onSelected: () => {
        qc.invalidateQueries({ queryKey: ['home-club-status', userId] });
        qc.invalidateQueries({ queryKey: ['connect-intro-course'] });
      },
    });

  const footer = (
    <FooterBar>
      <PrimaryButton onClick={onPickCountry}>{t('whsConnect.intro.cta')}</PrimaryButton>
      {onDecline ? (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
          <Action onClick={onDecline} color={MUTE}>
            {t('whsConnect.intro.decline')}
          </Action>
        </div>
      ) : null}
    </FooterBar>
  );

  if (pending) {
    return (
      <>
        <Stage>{null}</Stage>
        {footer}
      </>
    );
  }

  if (intro.data) {
    return (
      <>
        <Stage fill>
          <EvidenceBody course={intro.data} hasHomeClub={home.clubId != null} onChange={onChange} />
        </Stage>
        {footer}
      </>
    );
  }

  /* Neither home club nor fallback qualifies: the original promises screen, unchanged. */
  return (
    <>
      <Stage fill>
        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 0 auto' }}>
          <div style={{ height: 120, flexShrink: 0 }} />
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: AMBER,
              marginBottom: 14,
            }}
          >
            {t('whsConnect.intro.kicker')}
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.02,
              color: INK,
            }}
          >
            <span style={{ display: 'block', whiteSpace: 'nowrap' }}>{t('whsConnect.intro.headlineLine1')}</span>
            <span style={{ display: 'block', whiteSpace: 'nowrap' }}>{t('whsConnect.intro.headlineLine2')}</span>
          </h1>

          <div style={{ marginTop: 'auto', paddingTop: 40, display: 'flex', flexDirection: 'column' }}>
            {PROMISES.map((key, i) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  padding: '16px 0',
                  borderTop: i === 0 ? undefined : `1px solid ${PROMISE_RULE}`,
                }}
              >
                <div
                  style={{
                    ...NUM,
                    width: 24,
                    flexShrink: 0,
                    paddingTop: 4,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: AMBER,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, color: INK }}>
                    {t(`whsConnect.intro.promises.${key}.title`)}
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.42, color: DIM, marginTop: 3 }}>
                    {t(`whsConnect.intro.promises.${key}.line`)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Stage>

      <FooterBar>
        <PrimaryButton onClick={onPickCountry}>{t('whsConnect.intro.cta')}</PrimaryButton>
        {onDecline ? (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <Action onClick={onDecline} color={MUTE}>
              {t('whsConnect.intro.decline')}
            </Action>
          </div>
        ) : null}
      </FooterBar>
    </>
  );
};

export default EmptyStateScreen;
