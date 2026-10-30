/** Confirmation owns presentation and upload lifecycle only. Client scores/media
 * snapshot render immediately; receipt figures wait for the RPC. Suggestions
 * reuse the review search's idle lists, never round-derived receipt fields. */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, LineChart, Search, Trophy, Users, X } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useTop100Config } from '@/hooks/top100/useTop100Config';
import ReviewCourseSearchSheet, { CourseRow } from '@/features/composer-flow/ReviewCourseSearchSheet';
import { useReviewCourseIdle } from '@/features/composer-flow/hooks/useReviewCourseSearch';
import { ordinalWord } from '@/features/composer-flow/reviewCourseSearchRules';
import { shortCourseName } from '@/features/courses/_shared/courseLabel';
import { subscribeToReviewPublish, type ReviewPublishState } from '../lib/reviewUploadController';
import { useReviewReceipt } from '../hooks/useReviewReceipt';
import { CALIBRATION_MIN_PEERS } from '../hooks/useMyRatedScores';
import { categoryAverage } from '../lib/categoryAverage';
import { scoreShareKey } from '../lib/scoreStepRules';
import { receiptSuggestions } from '../lib/receiptSuggestions';
import { ReviewCourseHero } from './ReviewCourseHero';
import type { CategoryKey, ReviewV2Course } from '../types';
import './reviewReceipt.css';
interface Props {
  ratingId: string | null; pending?: boolean; course: ReviewV2Course; overall: number | null;
  scores: Record<CategoryKey, number | null>; shareToFeed: boolean; mediaCount?: number; hasText?: boolean; userId?: string | null;
  onClubhouse: () => void; onBack: () => void; onNextCourse: (courseId: string) => void;
  uploadKey?: string | null; onPublished?: (ratingId: string) => void;
}
const CAT_ORDER: CategoryKey[] = ['design', 'condition', 'clubhouse', 'facilities'];
export function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  const rem10 = n % 10;
  if (rem10 === 1) return `${n}st`;
  if (rem10 === 2) return `${n}nd`;
  if (rem10 === 3) return `${n}rd`;
  return `${n}th`;
}

export function ReviewReceipt({ ratingId, pending, course, overall, scores, shareToFeed, mediaCount = 0, hasText = false, userId = null, onClubhouse, onBack, onNextCourse, uploadKey, onPublished }: Props) {
  const { t } = useTranslation('courses');
  const [pub, setPub] = useState<ReviewPublishState | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    setPub(null);
    if (!pending || !uploadKey) return;
    return subscribeToReviewPublish(uploadKey, setPub);
  }, [pending, uploadKey]);
  useEffect(() => { if (pub?.phase === 'published' && pub.ratingId) onPublished?.(pub.ratingId); }, [pub, onPublished]);
  const live = !pending || pub?.phase === 'published';
  const { data: receipt } = useReviewReceipt(pub?.ratingId ?? ratingId);
  const { subscoreMinRatings } = useTop100Config();
  const idle = useReviewCourseIdle(live, userId, subscoreMinRatings);
  const suggestions = receiptSuggestions(idle.isError ? null : idle.data, course.id);
  const viewed = useRef<string | null>(null);
  useEffect(() => {
    if (!live || !receipt || (!idle.isSuccess && !idle.isError) || viewed.current === course.id) return;
    viewed.current = course.id;
    analyticsEvents.track('review_receipt_viewed', { course_id: course.id, unlocked_subscores: !!receipt.subscore_threshold_met, is_top100: receipt.top100_rank != null, next_count: suggestions.length });
  }, [live, receipt, idle.isSuccess, idle.isError, course.id, suggestions.length]);
  const footerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const footer = footerRef.current; const content = contentRef.current;
    if (!footer || !content) return;
    const measure = () => content.style.setProperty('--receipt-footer-height', `${footer.getBoundingClientRect().height}px`);
    measure(); const observer = new ResizeObserver(measure); observer.observe(footer); return () => observer.disconnect();
  }, [live, shareToFeed]);
  const short = shortCourseName(course.name);
  const avg = categoryAverage(scores);
  const score = overall == null ? '—' : overall.toFixed(1);
  const peers = receipt?.your_total_rated == null ? 0 : receipt.your_total_rated - 1;
  const calibration = receipt?.your_rank_of_rated != null && peers >= CALIBRATION_MIN_PEERS
    ? t(`review.wizard.step3.${receipt.your_rank_of_rated === 1 ? 'calibrationFirst' : 'calibration'}`, { ordinal: ordinal(receipt.your_rank_of_rated), count: receipt.your_total_rated }) : null;
  const first = receipt && ((receipt.rating_count ?? 0) <= 1 || receipt.community_avg == null);
  const delta = overall != null && receipt?.community_avg != null ? Math.round(Math.abs(overall - receipt.community_avg) * 10) / 10 : null;
  const action = (which: 'back' | 'close' | 'clubhouse') => { analyticsEvents.track('review_receipt_action', { course_id: course.id, action: which }); if (which === 'clubhouse') onClubhouse(); else onBack(); };
  const key = (name: string) => `review.wizard.receipt.${name}`;
  const bold = { b: <b /> };
  const phase = pub?.phase ?? 'uploading';
  const progress = pending && uploadKey && (phase === 'uploading' || phase === 'publishing');
  const percent = phase === 'publishing' ? 100 : pub?.percent ?? 0;
  const pendingTitle = !uploadKey ? 'pendingTitle' : phase === 'failed' ? 'failedTitle' : phase === 'publishing' ? 'publishingTitle' : 'uploadingTitle';
  const impact = (id: string, icon: ReactNode, title: ReactNode, sub: ReactNode) => <div className="receipt-impact" data-testid={`receipt-${id}`}><span className="receipt-impact-icon" aria-hidden>{icon}</span><div><div className="receipt-impact-title">{title}</div>{sub && <div className="receipt-impact-sub">{sub}</div>}</div></div>;
  return <div className="review-receipt">
    <div className="receipt-content" ref={contentRef}>
      <ReviewCourseHero courseId={course.id} name={course.name} courseRegion={course.region} subCountry={course.sub_country} country={course.country} thumbnail={course.thumbnail_image} height="calc(env(safe-area-inset-top, 0px) + 196px)">
        <Button variant="ghost" className="receipt-close" aria-label={t(key('close'))} onClick={() => action('close')}><X size={17} strokeWidth={2.2} /></Button>
      </ReviewCourseHero>
      {live ? <div className="receipt-status" data-testid="receipt-status"><span className="receipt-check" aria-hidden><Check size={13.2} strokeWidth={3} /></span><div><div className="receipt-status-title">{t(key(shareToFeed ? 'statusPosted' : 'statusSaved'))}</div><div className="receipt-status-sub">{shareToFeed ? t(`review.wizard.step3.${scoreShareKey(mediaCount, hasText)}`, { count: mediaCount }) : t(key('statusSavedSub'))}</div></div></div>
        : <div className="receipt-pending" data-testid="receipt-status"><div className="receipt-pending-head"><span>{t(key(pendingTitle))}</span>{progress && phase === 'uploading' && <span>{t(key('uploadingCount'), { done: pub?.uploaded ?? 0, total: pub?.total ?? mediaCount })}</span>}</div>
          {progress && <div className="receipt-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><div style={{ width: `${percent}%` }} /></div>}
          <p>{t(key(phase === 'failed' ? 'failedBody' : progress ? 'uploadingBody' : 'pendingBody'))}</p></div>}
      <div className="receipt-score-card" data-testid="receipt-score-card"><div className="receipt-score-head"><h2>{t(key('yourScore'))}</h2>{avg != null && <span>{t(key('average'))} <b>{avg.toFixed(1)}</b></span>}</div>
        <div className="receipt-overall"><b>{score}</b><span>/ 10</span></div><div className="receipt-calibration" data-testid="receipt-calibration">{calibration}</div>
        <div className="receipt-categories">{CAT_ORDER.map(category => <div className="receipt-category" key={category} data-category={category}><span>{t(`review.subscore.${category}`)}</span><div className="receipt-category-track"><i style={{ width: `${(scores[category] ?? 0) * 10}%` }} /></div><b data-empty={scores[category] == null}>{scores[category] == null ? '—' : scores[category]?.toFixed(1)}</b></div>)}</div>
      </div>
      {live && receipt && <section className="receipt-did"><h2>{t(key('didEyebrow'))}</h2><div className="receipt-impacts">
        {impact('members', <Users size={15} strokeWidth={2.2} />, <Trans ns="courses" i18nKey={key(first ? 'membersFirst' : 'members')} values={{ course: short, avg: receipt.community_avg?.toFixed(1), count: receipt.rating_count }} components={bold} />, first ? overall != null && t(key('firstSub'), { score }) : delta != null && t(key(delta < 0.1 ? 'deltaEqual' : overall != null && overall > Number(receipt.community_avg) ? 'deltaAbove' : 'deltaBelow'), { score, delta: delta.toFixed(1) }))}
        {receipt.subscore_threshold_met && impact('full-scores', <LineChart size={15} strokeWidth={2.2} />, <Trans ns="courses" i18nKey={key('fullScores')} values={{ ordinal: ordinalWord(subscoreMinRatings) }} components={bold} />, t(key('fullScoresSub')))}
        {receipt.top100_rank != null && impact('top100', <Trophy size={15} strokeWidth={2.2} />, <Trans ns="courses" i18nKey={key('top100')} values={{ rank: receipt.top100_rank, list: receipt.top100_list }} components={bold} />, t(key('top100Sub'), { count: receipt.your_rated_in_list ?? 0 }))}
      </div></section>}
      {live && <section className="receipt-next"><h2>{t(key('nextEyebrow'))}</h2><div className="rcs-rows">{suggestions.map(({ row, list }) => <CourseRow key={row.id} row={row} list={list} min={subscoreMinRatings} onPick={(r, l) => { analyticsEvents.track('review_next_course_tapped', { from_course_id: course.id, to_course_id: r.id, list: l }); onNextCourse(r.id); }} />)}</div><Button variant="ghost" className="receipt-find" onClick={() => setSearchOpen(true)}><Search size={16} strokeWidth={2.2} />{t(key('findAnother'))}</Button></section>}
    </div>
    <div className="receipt-footer" ref={footerRef}><Button variant="ghost" className="receipt-back" onClick={() => action('back')}>{t(key('back'), { course: short })}</Button>{live && shareToFeed && <Button variant="ghost" className="receipt-clubhouse" onClick={() => action('clubhouse')}>{t(key('clubhouse'))}</Button>}</div>
    <ReviewCourseSearchSheet open={searchOpen} userId={userId} onClose={() => setSearchOpen(false)} onBeforeRequest={() => setSearchOpen(false)} onPick={id => { setSearchOpen(false); onNextCourse(id); }} />
  </div>;
}
