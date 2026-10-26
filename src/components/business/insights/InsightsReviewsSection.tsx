/**
 * CB89 — Insights section 7 "Reviews". Replaces "Reviews & reputation" for
 * club-linked businesses. Draws nothing until the first read settles, nothing
 * if it fails or the server says the business is not linked; period switches
 * keep the previous card. Every figure (averages, ranks, unreplied) is the
 * server's, displayed as given. Rating/score figures of SUB_SCORE_GREEN_MIN
 * and above read A.GREEN, as on the reviews page. Course rows name the course
 * inside the club with courseNameWithinClub, as the reviews page does, so a
 * multi-course club reads "East Course", not the stored full name.
 */
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import { courseNameWithinClub } from '@/features/courses/_shared/courseLabel';
import { A, SUB_SCORE_GREEN_MIN } from '@/features/courses/components/holes/analytical/tokens';
import { useBusinessReviewSummary, type BusinessReviewSummary, type ReviewSummaryScore } from '@/hooks/useBusinessReviewSummary';

type K = (key: string, o?: Record<string, unknown>) => string;
type Linked = Extract<BusinessReviewSummary, { linked: true }>;

const INK = '#F8FAFC';
export const ratingTone = (v: number | null | undefined) => (v != null && v >= SUB_SCORE_GREEN_MIN ? A.GREEN : INK);
/** Server values arrive at one decimal; this only prints them (9 → "9.0"). */
export const fig = (v: number) => v.toFixed(1);

export function ordinal(n: number): string {
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
}

/** Lowest/highest of the shown scores; null on a tie for either or < 2 shown. */
export function lowestOf(scores: ReviewSummaryScore[]): null | { low: ReviewSummaryScore; high: ReviewSummaryScore; gap: string } {
  const shown = scores.filter(s => s.avg != null) as (ReviewSummaryScore & { avg: number })[];
  if (shown.length < 2) return null;
  const min = Math.min(...shown.map(s => s.avg));
  const max = Math.max(...shown.map(s => s.avg));
  const lows = shown.filter(s => s.avg === min);
  const highs = shown.filter(s => s.avg === max);
  if (lows.length !== 1 || highs.length !== 1) return null;
  return { low: lows[0], high: highs[0], gap: (Math.round((max - min) * 10) / 10).toFixed(1) };
}

const bolded = (s: string) => s.split(/<b>(.*?)<\/b>/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part));

const Card = ({ d, days, businessName, businessId, canManage, onNavigate, k }: {
  d: Linked; days: number; businessName: string; businessId: string; canManage: boolean; onNavigate: (p: string) => void; k: K;
}) => {
  if (d.total === 0) {
    return (
      <section className="insights-reviews-card" data-card="reviews" data-state="empty">
        <div className="insights-visits-kicker"><span>{k('kicker')}</span></div>
        <h3 className="insights-reviews-title" data-title="empty">{k('emptyTitle', { business: businessName })}</h3>
        <p className="insights-reviews-line" data-line="empty">{k('emptyLine')}</p>
      </section>
    );
  }
  const one = d.courses.length === 1 ? d.courses[0] : null;
  const ranked = !!one && one.rank != null && one.rank_of != null;
  const rankPart = ranked && one
    ? k('rankLead', { rank: ordinal(one.rank), of: formatNumber(one.rank_of), county: one.county ?? '' })
    : '';
  const newKey = d.new_count === 0 ? `newNone_${days}` : d.new_count === 1 ? `newOne_${days}` : `newMany_${days}`;
  const newPart = k(newKey, { n: formatNumber(d.new_count), avg: d.new_avg != null ? fig(d.new_avg) : '' });
  const shown = d.scores.filter(s => s.avg != null) as (ReviewSummaryScore & { avg: number })[];
  const lowest = lowestOf(d.scores);
  const label = (key: string) => k(`score_${key}`);
  const [pre, post] = k('title', { business: businessName }).split('{avg}');
  const replyTarget = d.unreplied > 0 && canManage ? `/business/${businessId}/reviews?filter=unreplied` : `/business/${businessId}/reviews`;
  return (
    <section className="insights-reviews-card" data-card="reviews" data-state="ready">
      <div className="insights-visits-kicker"><span>{k('kicker')}</span><span data-total={d.total}>{k('count', { count: d.total, n: formatNumber(d.total) })}</span></div>
      <h3 className="insights-reviews-title" data-title="ready">
        {pre}<span data-avg style={{ color: ratingTone(d.avg) }}>{d.avg != null ? fig(d.avg) : ''}</span>{post}
      </h3>
      <p className="insights-reviews-line" data-line="ready" data-rank={ranked ? 'yes' : 'no'} data-new={newKey}>
        {ranked && bolded(rankPart)}{bolded(newPart)}
      </p>
      {d.courses.length >= 2 && (
        <div className="insights-reviews-courses" data-courses>
          {d.courses.map(c => (
            <div key={c.course_id} className="insights-reviews-course" data-course={c.course_id}>
              <div>
                <div className="insights-reviews-course-name">{courseNameWithinClub(c.name)}</div>
                <div className="insights-reviews-course-sub" data-course-rank={c.rank != null && c.rank_of != null ? 'yes' : 'no'}>
                  {k('courseReviews', { count: c.reviews, n: formatNumber(c.reviews) })}
                  {c.rank != null && c.rank_of != null && k('courseRank', { rank: ordinal(c.rank), of: formatNumber(c.rank_of), county: c.county ?? '' })}
                </div>
              </div>
              <div className="insights-reviews-course-avg" data-course-avg style={{ color: ratingTone(c.avg) }}>{fig(c.avg)}</div>
            </div>
          ))}
        </div>
      )}
      {shown.length > 0 && (
        <>
          <div className="insights-visits-kicker insights-reviews-scores-kicker"><span>{k('scoresKicker')}</span></div>
          <div className="insights-reviews-scores" data-scores>
            {shown.map(s => (
              <div key={s.key} className="insights-reviews-score" data-score={s.key}>
                <span className="insights-reviews-score-l" data-lowest={lowest?.low.key === s.key ? 'yes' : undefined} style={lowest?.low.key === s.key ? { color: INK } : undefined}>{label(s.key)}</span>
                <span className="insights-reviews-track"><i data-bar style={{ width: `${Math.min(100, Math.max(0, s.avg * 10))}%`, background: ratingTone(s.avg) }} /></span>
                <span className="insights-reviews-score-v" data-value style={{ color: ratingTone(s.avg) }}>{fig(s.avg)}</span>
              </div>
            ))}
          </div>
          {lowest && (
            <p className="insights-reviews-lowest" data-lowest-sentence={lowest.low.key}>
              {bolded(k('lowest', { score: label(lowest.low.key), gap: lowest.gap, highest: label(lowest.high.key).toLowerCase() }))}
            </p>
          )}
        </>
      )}
      <div className="insights-reviews-reply" data-reply={d.unreplied > 0 ? 'unreplied' : 'all'}>
        <span>{bolded(d.unreplied > 0 ? k('unreplied', { count: d.unreplied, n: formatNumber(d.unreplied) }) : k('allReplied'))}</span>
        <button type="button" data-reply-action={replyTarget.includes('filter=') ? 'reply' : 'see'} onClick={() => onNavigate(replyTarget)}>
          {k(replyTarget.includes('filter=') ? 'reply' : 'seeReviews')}
        </button>
      </div>
      <p className="insights-reviews-fine">{k('fine')}</p>
    </section>
  );
};

export function InsightsReviewsSection({ businessId, businessName, days, canManage, onNavigate }: {
  businessId: string; businessName: string; days: number; canManage: boolean; onNavigate: (p: string) => void;
}) {
  const { t } = useTranslation('common');
  const q = useBusinessReviewSummary(businessId, days);
  if (q.isError || !q.data || !q.data.linked) return null;
  const k: K = (key, options = {}) => t(`business.insights.reviewsCard.${key}`, { ...options, defaultValue: '' });
  return <Card d={q.data} days={days} businessName={businessName} businessId={businessId} canManage={canManage} onNavigate={onNavigate} k={k} />;
}
