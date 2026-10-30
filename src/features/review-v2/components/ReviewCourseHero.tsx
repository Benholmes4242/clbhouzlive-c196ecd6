/** Photo/wash/fade/masthead have one owner. Only the composer's photo form
 * supplies the reference slot; receipt never imports the reference-line read. */
import type { ReactNode } from 'react';
import { CourseMasthead } from '@/components/courses/CourseMasthead';
import { HERO_CANON_WASH } from '@/features/tourhub/_shared/heroGradient';
import { courseMastheadKicker } from '@/features/courses/_shared/courseRankLabels';
import { useCourseTop100Standing } from '@/hooks/useCourseTop100Standing';
import './reviewCourseHero.css';
interface Props { courseId?: string; courseRegion?: string | null; subCountry?: string | null; country?: string | null; name?: string | null; thumbnail?: string | null; height?: string; children?: ReactNode; reference?: ReactNode }
export function ReviewCourseHero({ courseId, courseRegion, subCountry, country, name, thumbnail, height = '100%', children, reference }: Props) {
  const { data: standing } = useCourseTop100Standing(courseId);
  const kicker = courseMastheadKicker({ sub_country: subCountry, region: courseRegion, country }, standing);
  return <div data-photo-header className="rv2-photo review-course-hero" style={{ height }}>
    {thumbnail ? <img src={thumbnail} alt="" /> : <div className="review-course-photo-fallback" />}
    <div className="review-course-wash" aria-hidden style={{ background: HERO_CANON_WASH }} />
    <div className="review-course-fade" aria-hidden />
    {children}
    <div className="review-course-masthead"><CourseMasthead as="div" nameClamp={2} kicker={kicker} name={name ?? ''} place={country || null}>{reference}</CourseMasthead></div>
  </div>;
}