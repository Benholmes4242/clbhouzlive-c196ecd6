/**
 * The review composer's fixed header (BRIEF_REVIEW_STEP_ONE §1, hero form
 * BRIEF_REVIEW_STEP_ONE_COURSE_HERO).
 *
 * TWO FORMS, ONE ELEMENT. `photo` is the course page's hero, shorter: the
 * full-bleed photograph under the course page's 18% wash, fading into the page
 * with no hard edge, with the course page's own CourseMasthead over it and one
 * reference line under the hairline. `compact` is the long-standing bar. The
 * element keeps one ref so the composer's spacer measures its bottom edge in
 * both forms and follows the 200ms fold (a snap under reduced motion). The
 * composer owns the empty rule and its stickiness; this file only draws.
 *
 * The photo form's reads (Top 100 standing, tee reference line) live in the
 * PhotoHero subcomponent so the compact form never fires them.
 */
import React, { forwardRef, Fragment } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RV2 } from '../tokens';
import { SURFACE } from '@/lib/tokens/surface';
import { ReviewCourseHero } from './ReviewCourseHero';
import { useHeroReferenceLine } from '@/components/courses/course-detail/about/useHeroReferenceLine';
import type { ReviewHeaderFacts } from '../hooks/useReviewHeaderFacts';
import { headerScore } from '../hooks/useReviewHeaderFacts';
import './reviewComposerHeader.css';

interface Props {
  form: 'photo' | 'compact';
  name: string | null | undefined;
  region: string;
  thumbnail: string | null | undefined;
  facts: ReviewHeaderFacts;
  /** The photo hero's masthead reads: raw course fields for the shared kicker rule. */
  courseId: string | undefined;
  courseRegion: string | null | undefined;
  subCountry: string | null | undefined;
  country: string | null | undefined;
  leadingIsClose: boolean;
  onBack: () => void;
  isEditMode: boolean;
  onDelete: () => void;
}

// Photo hero: the photograph fills one block of safe-area inset + 246px.
export const PHOTO_HEADER_H_CSS = 'calc(env(safe-area-inset-top, 0px) + 246px)';

/** The reference line's " · " separator, drawn as CourseTitleOverlay draws it. */
const RefSep = () => <span style={{ fontWeight: 500, color: SURFACE.dark.dim }}>{' · '}</span>;

function PhotoHero({
  courseId, courseRegion, subCountry, country, name, thumbnail, facts, backLabel, glyph, onBack,
}: {
  courseId: string | undefined;
  courseRegion: string | null | undefined;
  subCountry: string | null | undefined;
  country: string | null | undefined;
  name: string | null | undefined;
  thumbnail: string | null | undefined;
  facts: ReviewHeaderFacts;
  backLabel: string;
  glyph: string;
  onBack: () => void;
}) {
  const { t } = useTranslation('courses');
  // null rounds: the expensive stats read stays off this page.
  const referenceLine = useHeroReferenceLine(courseId ?? null, null);
  const score = headerScore(facts);
  const fromMembers = score ? t('review.wizard.stepOne.fromMembers', { count: score.count }) : '';
  const refParts = referenceLine ? referenceLine.split(' · ') : [];
  const hasReference = !!score || refParts.length > 0;

  return (
    <ReviewCourseHero courseId={courseId} courseRegion={courseRegion} subCountry={subCountry} country={country} name={name} thumbnail={thumbnail} reference={hasReference ? (
      <div data-header-reference className="tabular-nums lining-nums" style={{ fontSize: 13, fontWeight: 600, color: SURFACE.dark.body }}>
        {score && <><b style={{ fontWeight: 700, color: '#F8FAFC' }}>{score.avg}</b> {fromMembers}{refParts.length > 0 && <RefSep />}</>}
        {refParts.map((part, i) => <Fragment key={i}>{i > 0 && <RefSep />}{part}</Fragment>)}
      </div>
    ) : null}>
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        style={{
          position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 6px)', left: 14,
          width: 36, height: 36, borderRadius: 999, border: 'none', background: 'var(--review-header-back)',
          color: RV2.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 21, lineHeight: 1, cursor: 'pointer',
        }}
      >
        {glyph}
      </button>
    </ReviewCourseHero>
  );
}

export const ReviewComposerHeader = forwardRef<HTMLElement, Props>(function ReviewComposerHeader(
  { form, name, region, thumbnail, facts, courseId, courseRegion, subCountry, country, leadingIsClose, onBack, isEditMode, onDelete },
  ref,
) {
  const { t } = useTranslation('courses');
  const photo = form === 'photo';
  const score = headerScore(facts);
  const backLabel = leadingIsClose ? t('review.wizard.closeA11y') : t('review.wizard.backA11y');
  const glyph = leadingIsClose ? '×' : '‹';
  const fromMembers = score ? t('review.wizard.stepOne.fromMembers', { count: score.count }) : '';

  return (
    <header
      ref={ref}
      data-header-form={form}
      className={`rv2-fold-header rv2-header--${form}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        margin: '0 auto',
        width: '100%',
        maxWidth: 480,
        zIndex: 50,
        overflow: 'hidden',
        background: RV2.canvas,
        borderBottom: photo ? 'none' : `1px solid ${RV2.hairline}`,
        boxSizing: 'border-box',
      }}
    >
      {photo ? (
        <PhotoHero
          courseId={courseId}
          courseRegion={courseRegion}
          subCountry={subCountry}
          country={country}
          name={name}
          thumbnail={thumbnail}
          facts={facts}
          backLabel={backLabel}
          glyph={glyph}
          onBack={onBack}
        />
      ) : (
        <div style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 10px' }}>
            <span style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <button
                type="button"
                onClick={onBack}
                aria-label={backLabel}
                style={{
                  width: 36, height: 36, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  fontSize: 21, lineHeight: 1, color: RV2.ink,
                }}
              >
                {glyph}
              </button>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.015em', color: RV2.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
              </div>
              <div data-compact-meta style={{ fontSize: 12, color: RV2.secondary }}>
                {score ? `${region} · ${score.avg} ${fromMembers}` : region}
              </div>
            </div>
            {isEditMode && (
              <button
                type="button"
                onClick={onDelete}
                aria-label={t('review.wizard.deleteA11y')}
                style={{ width: 44, height: 44, borderRadius: 10, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: RV2.danger }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
});
