/**
 * BRIEF_COURSE_TAB_REBUILD §3.3 — ABOUT THIS PLACE.
 *
 * Moved UP the tab: it is the only section that works with no data, and it is
 * what someone deciding whether to play here wants first.
 *
 * No card, no border — the Panel wrapper is gone (Panel itself untouched).
 * Two to three lines of the description at 13px MUTE / 1.55, then READ MORE.
 * The existing i18n keys are reused rather than rewritten (§6).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { analyticsEvents } from '@/utils/analyticsEvents';
import AboutSection from './AboutSection';

/** Preserves the paragraph breaks the description is authored with. */
const renderDescription = (description: string) =>
  description.split('\n').map((line, index, array) => (
    <span key={index}>
      {line}
      {index < array.length - 1 && <br />}
    </span>
  ));

interface AboutThisPlaceProps {
  courseId: string;
  description?: string | null;
  /** Rendered under the copy — the Top 100 standing, when the course has one. */
  footer?: React.ReactNode;
}

const AboutThisPlace: React.FC<AboutThisPlaceProps> = ({ courseId, description, footer }) => {
  const { t } = useTranslation('courses');
  const [expanded, setExpanded] = React.useState(false);

  const text = description?.trim() || '';
  // §3.3 asks for two to three lines collapsed; the toggle only earns its place
  // when there is materially more copy than that.
  const showToggle = text.split(/\s+/).filter(Boolean).length > 40;

  if (!text && !footer) return null;

  const onToggle = () => {
    const next = !expanded;
    setExpanded(next);
    // §7 — instrumented from day one.
    analyticsEvents.track('course_about_read_more', { course_id: courseId, expanded: next });
  };

  return (
    <AboutSection heading={t('courseDetail.sections.aboutThisPlace')}>
      {text ? (
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: A.MUTE,
            fontFamily: SANS,
            ...(expanded
              ? {}
              : {
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                }),
          }}
        >
          {renderDescription(text)}
        </div>
      ) : null}

      {text && showToggle ? (
        <button
          type="button"
          onClick={onToggle}
          style={{
            marginTop: 10,
            padding: 0,
            border: 0,
            background: 'transparent',
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.11em',
            textTransform: 'uppercase',
            color: A.MUTE,
            cursor: 'pointer',
          }}
        >
          {expanded ? t('courseDetail.about.showLess') : t('courseDetail.about.readMore')} ›
        </button>
      ) : null}

      {footer ? <div style={{ marginTop: text ? 14 : 0 }}>{footer}</div> : null}
    </AboutSection>
  );
};

export default AboutThisPlace;
