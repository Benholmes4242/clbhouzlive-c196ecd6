/** BRIEF_REVIEW_COURSE_SEARCH — the Review a course sheet
 * (review-course-search-signed-off.html). Opened from the Post or review
 * sheet; a pick hands the course id back so ComposerFlowSheet's close-first
 * navigation owns the route. List rules live in reviewCourseSearchRules.ts,
 * reads in hooks/useReviewCourseSearch.ts. The field never autofocuses.
 * Content-height sizing belongs here: the first nonempty edit captures the
 * current content height before results change; clearing/closing releases it.
 * The shared sheet owns the viewport cap and keyboard behaviour. */
import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import KeyboardSearchSheet from './KeyboardSearchSheet';
import { openRequestCourseSheet } from '@/components/courses/requestCourseSheetStore';
import { useTop100Config } from '@/hooks/top100/useTop100Config';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useReviewCourseIdle, useReviewCourseResults } from './hooks/useReviewCourseSearch';
import { highlightParts, placeLine, rightState, SEARCH_MIN_CHARS, thresholdExplainer, type PickList, type ReviewCourseRow } from './reviewCourseSearchRules';
import './review-course-search.css';

interface Props {
  open: boolean;
  userId: string | null;
  onClose: () => void;
  onPick: (courseId: string) => void;
  /** Called before the request-a-course sheet opens, so this sheet can close. */
  onBeforeRequest?: () => void;
}

export default function ReviewCourseSearchSheet({ open, userId, onClose, onPick, onBeforeRequest }: Props) {
  const { t } = useTranslation('composerFlow');
  const [q, setQ] = useState('');
  const { subscoreMinRatings: min } = useTop100Config();
  const idle = useReviewCourseIdle(open, userId, min);
  const results = useReviewCourseResults(open, userId, q);
  const opened = useRef(false);
  useEffect(() => {
    if (open && !opened.current) { opened.current = true; analyticsEvents.track('review_search_opened', {}); }
    if (!open) { opened.current = false; setQ(''); }
  }, [open]);

  const searching = q.trim().length >= SEARCH_MIN_CHARS;
  const pick = (row: ReviewCourseRow, list: PickList) => {
    analyticsEvents.track('review_search_pick', { list, reviewed: row.mine != null });
    onPick(row.id);
  };
  const ask = () => {
    analyticsEvents.track('review_course_request_tap', {});
    onBeforeRequest?.();
    const name = q.trim();
    setTimeout(() => openRequestCourseSheet(name || undefined), 0);
  };
  const lists = idle.isError ? null : idle.data;
  const rows = results.isError ? [] : results.data ?? [];
  const ready = searching && results.term === q.trim() && results.isSuccess;

  return (
    <KeyboardSearchSheet open={open} onClose={onClose} query={q} onQueryChange={setQ} testId="review-course-search"
      title={t('reviewSearch.title', { defaultValue: 'Review a course' })} closeLabel={t('close', { defaultValue: 'Close' })}
      clearLabel={t('reviewSearch.clear', { defaultValue: 'Clear search' })} placeholder={t('reviewSearch.placeholder', { defaultValue: 'Search 23,000 courses' })}>
          {searching ? (ready && <>
            {rows.length > 0 && <>
              <div className="rcs-count" data-testid="rcs-count">{`${rows.length} ${rows.length === 1 ? 'course' : 'courses'}`}</div>
              <div className="rcs-results" data-list="search">{rows.map(r => <CourseRow key={r.id} row={r} list="search" min={min} q={q} onPick={pick} />)}</div>
            </>}
            <button type="button" className="rcs-ask" data-alone={rows.length === 0} onClick={ask}><Plus size={16} aria-hidden="true" />{t('reviewSearch.ask', { defaultValue: 'Not here? Ask us to add it' })}</button>
          </>) : lists && <>
            <Section list="recent" title={t('reviewSearch.recent', { defaultValue: 'Looked at recently' })} rows={lists.recent} min={min} onPick={pick} />
            <Section list="threshold" title={t('reviewSearch.threshold', { defaultValue: 'One review from its full scores' })} explainer={thresholdExplainer(min)} rows={lists.threshold} min={min} onPick={pick} />
            <Section list="popular" title={t('reviewSearch.popular', { defaultValue: 'Most reviewed this month' })} rows={lists.popular} min={min} onPick={pick} />
          </>}
    </KeyboardSearchSheet>
  );
}

function Section({ list, title, explainer, rows, min, onPick }: { list: PickList; title: string; explainer?: string; rows: ReviewCourseRow[]; min: number; onPick: (r: ReviewCourseRow, l: PickList) => void }) {
  if (!rows.length) return null;
  return (
    <section className="rcs-section" data-list={list}>
      <h2>{title}</h2>
      {explainer && <p>{explainer}</p>}
      <div className="rcs-rows">{rows.map(r => <CourseRow key={r.id} row={r} list={list} min={min} onPick={onPick} />)}</div>
    </section>
  );
}

function CourseRow({ row, list, min, q, onPick }: { row: ReviewCourseRow; list: PickList; min: number; q?: string; onPick: (r: ReviewCourseRow, l: PickList) => void }) {
  const right = rightState(row, list, min);
  return (
    <button type="button" className="rcs-row" data-course={row.id} onClick={() => onPick(row, list)}>
      <span className="rcs-thumb">{row.thumbnail && <img src={row.thumbnail} alt="" />}</span>
      <span className="rcs-text">
        <span className="rcs-name" data-testid="rcs-name">{q ? highlightParts(row.name, q).map((p, i) => <span key={i} className={p.match ? 'rcs-hit' : 'rcs-miss'}>{p.text}</span>) : row.name}</span>
        <span className="rcs-place"><span className="rcs-place-text">{placeLine(row, list === 'search' ? 'search' : 'idle')}</span>{row.rank && <span className="rcs-rank" data-testid="rcs-rank">{row.rank}</span>}</span>
      </span>
      <span className="rcs-right" data-state={right.kind}>
        {right.kind === 'mine' && <><b className="rcs-mine">{right.score}</b><small className="rcs-yours">YOURS · EDIT</small></>}
        {right.kind === 'scored' && <><b className="rcs-score">{right.score}</b><small>{right.count}</small></>}
        {right.kind === 'bethe' && <><b className="rcs-be">{right.label}</b><small>{right.count}</small></>}
        {right.kind === 'first' && <b className="rcs-be">Be the first</b>}
      </span>
    </button>
  );
}
