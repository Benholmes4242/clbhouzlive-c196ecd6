import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { ordinal } from '@/lib/text/numbers';
import { MIN_RATINGS, shortenCourseName, type ArgumentInput } from './theArgument';
import './top100Compare.css';
export type NearCourse = ArgumentInput & { ratedByYou?: boolean };
export function oneRatingAway(rows: NearCourse[]): NearCourse[] { return rows.filter(c => c.publishedRank != null && c.ratingCount === MIN_RATINGS-1 && !c.ratedByYou).sort((a,b)=>(a.publishedRank ?? 0)-(b.publishedRank ?? 0)); }
export function Top100OneRatingAway({ courses,listLabel,onOpenCourse,onRate }: {courses:NearCourse[];listLabel:string;onOpenCourse:(id:string)=>void;onRate:(id:string)=>void}) {
 const eligible=oneRatingAway(courses); if (!eligible.length) return null;
 return <section className="t100b-section"><div className="t100b-kicker">ONE RATING AWAY</div><div className="t100b-title">Help decide where these sit</div><div className="t100b-sub">{eligible.length} {listLabel} courses have two golfer ratings. A third puts each into the comparison.</div><div className="t100b-near-rail">{eligible.slice(0,8).map(c => <div className="t100b-near-card" key={c.id}><button type="button" className="t100b-image-button" aria-label={`${c.name}, open course`} onClick={() => onOpenCourse(c.id)}><CourseImageFallback courseId={c.id} courseName={c.name} imageUrl={c.imageUrl} className="t100b-image" /></button><div className="t100b-near-name">{shortenCourseName(c.name)}</div><div className="t100b-near-line">Officially {ordinal(c.publishedRank ?? 0)} · 2 of 3 ratings</div><button type="button" className="t100b-rate" onClick={() => onRate(c.id)}>Rate it</button></div>)}</div></section>;
}
