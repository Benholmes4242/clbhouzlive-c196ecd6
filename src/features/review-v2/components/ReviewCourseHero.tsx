/** Photo/wash/fade/masthead have one owner. Only the composer's photo form
 * supplies the reference slot; receipt never imports the reference-line read.
 * Receipt height is CSS-owned via an opt-in photo class; default Step 1 keeps
 * its existing inline 100% height inside the canonical photo header. */
import type { ReactNode } from 'react';
import { CourseMasthead } from '@/components/courses/CourseMasthead';
import { HERO_CANON_WASH } from '@/features/tourhub/_shared/heroGradient';
import { courseMastheadKicker } from '@/features/courses/_shared/courseRankLabels';
import { useCourseTop100Standing } from '@/hooks/useCourseTop100Standing';
import { RV2 } from '../tokens';
interface Props { courseId?: string; courseRegion?: string | null; subCountry?: string | null; country?: string | null; name?: string | null; thumbnail?: string | null; height?: string; className?: string; children?: ReactNode; reference?: ReactNode }
export function ReviewCourseHero({ courseId, courseRegion, subCountry, country, name, thumbnail, height, className, children, reference }: Props) {
  const { data: standing } = useCourseTop100Standing(courseId);
  const kicker = courseMastheadKicker({ sub_country: subCountry, region: courseRegion, country }, standing);
  return <div data-photo-header className={`rv2-photo${className ? ` ${className}` : ''}`} style={{ position: 'relative', height: height ?? (className ? undefined : '100%') }}>
    {thumbnail ? <img src={thumbnail} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%' }} />
      : <div style={{ position: 'absolute', inset: 0, background: 'var(--post-review-photo-fallback)' }} />}
    <div aria-hidden style={{ position: 'absolute', inset: 0, background: HERO_CANON_WASH, pointerEvents: 'none' }} />
    <div aria-hidden style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(22,22,26,0) 40%, rgba(22,22,26,0.72) 72%, ${RV2.canvas} 100%)`, pointerEvents: 'none' }} />
    {children}
    <div style={{ position: 'absolute', left: 20, right: 20, bottom: 14 }}><CourseMasthead as="div" nameClamp={2} kicker={kicker} name={name ?? ''} place={country || null}>{reference}</CourseMasthead></div>
  </div>;
}