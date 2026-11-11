/** Uses the same active-list inputs and viewer rating read as the comparison; no additional reads. */
import { Button } from '@/components/ui/button';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { ordinal } from '@/lib/text/numbers';
import { MIN_RATINGS, type ArgumentInput } from './theArgument';
import { shortenCourseName } from './Top100CompareChart';

export function oneRatingAway(inputs: ArgumentInput[], ratedIds: Set<string>) {
  return inputs.filter(row => row.publishedRank != null && row.ratingCount === MIN_RATINGS - 1 && !ratedIds.has(row.id)).sort((a, b) => Number(a.publishedRank) - Number(b.publishedRank));
}
export function Top100OneRatingAway({ inputs, ratedIds, listLabel, onOpenCourse, onRate }: { inputs: ArgumentInput[]; ratedIds: Set<string>; listLabel: string; onOpenCourse: (id: string) => void; onRate: (id: string) => void }) {
  const rows = oneRatingAway(inputs, ratedIds);
  if (!rows.length) return null;
  return <section className="t100-b-section" data-one-rating-away><div className="t100-b-kicker">ONE RATING AWAY</div><h2 className="t100-b-title">Help decide where these sit</h2><p className="t100-b-sub">{rows.length} {listLabel} courses have two golfer ratings. A third puts each into the comparison.</p>
    <div className="t100-one-rail">{rows.slice(0, 8).map(row => <div className="t100-one-card" key={row.id}>
      <Button variant="ghost" className="t100-one-image" onClick={() => onOpenCourse(row.id)} aria-label={`${row.name}, open course`}><CourseImageFallback courseId={row.id} courseName={row.name} imageUrl={row.imageUrl} style={{ height: '100%', width: '100%' }} /></Button>
      <b>{shortenCourseName(row.name)}</b><small>Officially {ordinal(row.publishedRank ?? 0)} · 2 of 3 ratings</small><Button variant="ghost" className="t100-one-rate" onClick={() => onRate(row.id)} aria-label={`Rate ${row.name}`}>Rate it</Button>
    </div>)}</div>
  </section>;
}