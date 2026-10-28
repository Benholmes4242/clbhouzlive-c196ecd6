/**
 * ComposerFlowSheet — direct Post or Review entry, not a numbered step.
 * File inputs belong to their buttons and click in the user-activation tick.
 * Suggestion/read ownership lives in useReviewSuggestions; handoff remains shared.
 *
 * NAVIGATING AWAY FROM THIS SHEET — ORDER AND OWNERSHIP. This is the August
 * incident, and the rule below is carried over verbatim from the create sheet
 * this screen replaced, because the incident lived there first: this sheet
 * holds a sheet-history marker and closing it unwinds that marker with
 * history.back(). A handler that closed and navigated in the same tick pushed
 * its route BEFORE the back landed, so the back ate the push and the member was
 * returned to the page they started on. THE SHEET CLOSES FIRST, ITS ENTRY IS
 * RELEASED, AND ONLY THEN DO WE NAVIGATE — afterSheetHistorySettled runs the
 * navigation once the unwind has landed. Not a delay: with nothing outstanding
 * it runs on the next microtask.
 *
 */
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { afterSheetHistorySettled } from '@/components/ui/sheetHistory';
import { useProfileData } from '@/hooks/useProfileData';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { analyticsEvents } from '@/utils/analyticsEvents';
import BottomSheet from '@/features/post-v2/components/BottomSheet';
import ReviewCourseSearchSheet from './ReviewCourseSearchSheet';
import { MAX_MEDIA } from '@/features/post-v2/hooks/useStageComposer';
import { useComposerFlowStore } from './composerFlowStore';
import { useReviewSuggestions } from './hooks/useReviewSuggestions';
import './post-or-review.css';

interface Props { open: boolean; onClose: () => void; returnPath?: string }
export default function ComposerFlowSheet({ open, onClose, returnPath }: Props) {
  const { t } = useTranslation('composerFlow');
  const { profile } = useProfileData();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const openPostStudio = usePostStudioStore(s => s.openPostStudio);
  const beginHandoff = useComposerFlowStore(s => s.beginHandoff);
  const [courseOpen, setCourseOpen] = useState(false);
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);
  const suggestions = useReviewSuggestions(open);
  const courses = suggestions.isError ? [] : suggestions.data ?? [];
  const pendingNav = useRef<string | null>(null);
  const navigateAfterClose = (to: string) => { pendingNav.current = to; onClose(); };
  useEffect(() => {
    if (open) return;
    setCourseOpen(false);
    const to = pendingNav.current;
    if (!to) return;
    pendingNav.current = null;
    afterSheetHistorySettled(() => navigate(to));
  }, [open, navigate]);
  const review = (id: string) => {
    beginHandoff(returnPath ?? pathname);
    navigateAfterClose(`/courses/${id}/rate`);
  };
  const post = (source: 'camera' | 'library', e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files ?? []).slice(0, MAX_MEDIA);
    e.currentTarget.value = '';
    if (!files.length) return;
    analyticsEvents.track('composer_post_source', { source, count: files.length });
    beginHandoff(returnPath ?? pathname);
    openPostStudio({ media: files, returnPath });
    onClose();
  };
  return <>
    <BottomSheet open={open && !courseOpen} onClose={onClose} surfaceClassName="post-or-review-surface">
      <div className="post-or-review">
        <header className="post-or-review-header">
          <h1>{t('title')}</h1>
          <Button variant="ghost" size="icon" className="post-or-review-close" aria-label={t('close')} onClick={onClose}><X size={17} strokeWidth={2.2} /></Button>
        </header>
        <div className="post-or-review-body">
          <ChoiceBox icon="image" title={t('post.title')} line={t('post.line')}>
            <div className="post-or-review-actions">
              <div className="post-or-review-input-owner">
                <Button variant="ghost" className="post-or-review-camera" onClick={() => camera.current?.click()}><ChoiceIcon name="camera" size={16} />{t('post.camera')}</Button>
                <input ref={camera} type="file" accept="image/*,video/*" capture="environment" hidden onChange={e => post('camera', e)} />
              </div>
              <div className="post-or-review-input-owner">
                <Button variant="ghost" className="post-or-review-library" onClick={() => library.current?.click()}><ChoiceIcon name="library" size={16} />{t('post.library')}</Button>
                <input ref={library} type="file" accept="image/*,video/*" multiple hidden onChange={e => post('library', e)} />
              </div>
            </div>
          </ChoiceBox>
          <div className="post-or-review-divider" aria-hidden="true"><span /><b>{t('or')}</b><span /></div>
          <ChoiceBox icon="star" title={t('review.title')} line={t('review.line')}>
            <Button variant="ghost" className="post-or-review-search" onClick={() => setCourseOpen(true)}><Search size={18} /><span>{t('review.search')}</span></Button>
            {courses.length > 0 && <div className="post-or-review-suggestions">
              {courses.map(c => <Button key={c.courseId} variant="ghost" className="post-or-review-suggestion" onClick={() => {
                analyticsEvents.track('composer_course_source', { source: 'suggested', reason: c.reasonKind });
                review(c.courseId);
              }}>
                <span className="post-or-review-thumbnail">{c.thumbnail && <img src={c.thumbnail} alt="" />}</span>
                <span className="post-or-review-course"><strong>{c.courseName}</strong><small>{c.reason}</small></span>
                <span className="post-or-review-pill">{t('review.cta')}</span>
              </Button>)}
            </div>}
          </ChoiceBox>
        </div>
      </div>
    </BottomSheet>
    <ReviewCourseSearchSheet open={courseOpen} userId={profile?.id ?? null} onClose={() => setCourseOpen(false)}
      onBeforeRequest={() => setCourseOpen(false)}
      onPick={id => {
        setCourseOpen(false);
        analyticsEvents.track('composer_course_source', { source: 'search' });
        review(id);
      }} />
  </>;
}
function ChoiceBox({ icon, title, line, children }: { icon: 'image' | 'star'; title: string; line: string; children: ReactNode }) {
  return <section className="post-or-review-box">
    <div className="post-or-review-box-head"><span className="post-or-review-icon"><ChoiceIcon name={icon} size={20} strokeWidth={1.9} /></span><div><h2>{title}</h2><p>{line}</p></div></div>
    {children}
  </section>;
}
function ChoiceIcon({ name, size, strokeWidth = 2 }: { name: 'image' | 'star' | 'camera' | 'library'; size: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'image' && <><path d="M3 5h18v14H3z" /><path d="m3 16 5-5 4 4 3-3 6 6" /><circle cx="15.5" cy="9" r="1.5" /></>}
    {name === 'star' && <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />}
    {name === 'camera' && <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" /><circle cx="12" cy="13" r="3.5" /></>}
    {name === 'library' && <><path d="M4 4h12v12H4z" /><path d="M8 20h12V8" /></>}
  </svg>;
}
