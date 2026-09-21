/**
 * ComposerFlowSheet — STEP 1 of the unified composer, and what the (+) opens.
 *
 * PHASE 1 of BRIEF_THE_UNIFIED_COMPOSER. This screen is new; both tiles hand
 * off to the EXISTING composers untouched. So during phase 1 the step counter
 * is deliberately inconsistent — step 1 says "Step 1 of 3" and the old review
 * composer then shows its own three-step strip. That is the phasing, not a bug,
 * and it resolves when the shared header takes over steps 2 and 3.
 *
 * NAVIGATING AWAY FROM THIS SHEET — ORDER AND OWNERSHIP. Carried over from
 * CreateSheetV3 verbatim, because the August incident lived here: this sheet
 * holds a sheet-history marker and closing it unwinds that marker with
 * history.back(). A handler that closed and navigated in the same tick pushed
 * its route BEFORE the back landed, so the back ate the push and the member was
 * returned to the page they started on. THE SHEET CLOSES FIRST, ITS ENTRY IS
 * RELEASED, AND ONLY THEN DO WE NAVIGATE — afterSheetHistorySettled runs the
 * navigation once the unwind has landed. Not a delay: with nothing outstanding
 * it runs on the next microtask.
 *
 * NO AMBER. Everything on this screen belongs to the viewing member, so amber
 * would be on all of it and mean nothing. The selected marker is INK.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { afterSheetHistorySettled } from '@/components/ui/sheetHistory';
import { useProfileData } from '@/hooks/useProfileData';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { analyticsEvents } from '@/utils/analyticsEvents';
import BottomSheet from '@/features/post-v2/components/BottomSheet';
import CourseTagSheet from '@/features/post-v2/components/CourseTagSheet';
import { CT } from '@/features/_shared/composerTokens';
import { useComposerFlowStore } from './composerFlowStore';
import ComposerStepHeader from './components/ComposerStepHeader';
import {
  useRecentCoursesForComposer,
  type ComposerRecentCourse,
} from './hooks/useRecentCoursesForComposer';

/**
 * The SELECTED fill for a tile or a course row: one step above CT.cardBg, so a
 * chosen block reads as chosen without a second border weight. Declared once
 * here because no shared token carries this value; nothing else may inline it.
 */
const SELECTED_FILL = '#222A34';

type Kind = 'review' | 'post';

interface Props {
  open: boolean;
  onClose: () => void;
  returnPath?: string;
}

export default function ComposerFlowSheet({ open, onClose, returnPath }: Props) {
  const { t } = useTranslation('composerFlow');
  const { profile } = useProfileData();
  const navigate = useNavigate();
  const openPostStudio = usePostStudioStore((s) => s.openPostStudio);
  const beginHandoff = useComposerFlowStore((s) => s.beginHandoff);

  // TILE A IS SELECTED WHEN THE SCREEN OPENS — a rating is the outcome worth
  // defaulting to, and a plain post is one tap away.
  const [kind, setKind] = useState<Kind>('review');
  const [course, setCourse] = useState<{ id: string; name: string } | null>(null);
  const [courseOpen, setCourseOpen] = useState(false);

  const { data: courses = [] } = useRecentCoursesForComposer(open);
  const hasCourses = courses.length > 0;
  const total = kind === 'review' ? 3 : 2;

  // Re-prime on every open: the sheet is not a resume point in phase 1.
  useEffect(() => {
    if (!open) return;
    setKind('review');
    setCourse(null);
  }, [open]);

  /* THE IMPRESSION EVENT. "Nobody tapped it" and "nobody saw it" have twice
     been indistinguishable here, so the no-rounds card reports that it
     rendered, once per open. */
  const emptyFired = useRef(false);
  useEffect(() => {
    if (!open) { emptyFired.current = false; return; }
    if (kind !== 'review' || hasCourses || emptyFired.current) return;
    emptyFired.current = true;
    analyticsEvents.track('composer_empty_courses', {});
  }, [open, kind, hasCourses]);

  const pendingNav = useRef<string | null>(null);
  const navigateAfterClose = (to: string) => {
    pendingNav.current = to;
    onClose();
  };
  useEffect(() => {
    if (open) return;
    const to = pendingNav.current;
    if (!to) return;
    pendingNav.current = null;
    afterSheetHistorySettled(() => navigate(to));
  }, [open, navigate]);

  const pickKind = (next: Kind) => {
    if (next === kind) return;
    analyticsEvents.track('composer_kind_selected', { kind: next, changed: next !== 'review' });
    setKind(next);
    // Tile B removes the course block from the DOM and clears any choice.
    if (next === 'post') setCourse(null);
  };

  const pickRecent = (c: ComposerRecentCourse) => {
    analyticsEvents.track('composer_course_source', { source: 'recent' });
    setCourse({ id: c.courseId, name: c.courseName });
  };

  const canAdvance = kind === 'post' || !!course;

  const next = () => {
    if (!canAdvance) return;
    beginHandoff(returnPath ?? window.location.pathname);
    if (kind === 'post') {
      openPostStudio({ awaitingMedia: true, returnPath });
      onClose();
      return;
    }
    // THE ROUTE FROM (+) TO A REVIEW. Same route and same param shape as the
    // course page's own RATE THIS COURSE row — one way in, not a second.
    navigateAfterClose(`/courses/${course!.id}/rate`);
  };

  return (
    <>
      <BottomSheet open={open && !courseOpen} onClose={onClose} fullHeight>
        {/* BottomSheet hands its children ONE scrolling box. Step 1 needs a
            pinned footer, so the flow owns the column here and only its middle
            band scrolls — the header and the footer never move. */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <ComposerStepHeader step={1} total={total} onLeft={onClose} />

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '2px 16px 18px' }}>
          <h1
            style={{
              margin: '0 0 14px',
              fontSize: 25,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: CT.ink,
              textWrap: 'balance',
            }}
          >
            {t('step1.title')}
          </h1>

          <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
            <KindTile
              title={t('tiles.review.title')}
              sub={t('tiles.review.sub')}
              selected={kind === 'review'}
              onPick={() => pickKind('review')}
            />
            <KindTile
              title={t('tiles.post.title')}
              sub={t('tiles.post.sub')}
              selected={kind === 'post'}
              onPick={() => pickKind('post')}
            />
          </div>

          {kind === 'review' && (
            <>
              <Label text={t('course.which')} />
              <button
                type="button"
                onClick={() => setCourseOpen(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '13px 14px',
                  background: CT.cardBg,
                  border: `1px solid ${CT.hairline}`,
                  borderRadius: 16,
                  color: CT.ink,
                  fontSize: 14.5,
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <Search size={17} strokeWidth={2.2} style={{ flexShrink: 0, color: CT.secondary }} />
                <span style={{ flex: 1, minWidth: 0 }}>{t('course.searchAll')}</span>
              </button>

              {hasCourses ? (
                <>
                  <Label text={t('course.recent')} />
                  {courses.map((c) => (
                    <CourseRow
                      key={c.courseId}
                      course={c}
                      selected={course?.id === c.courseId}
                      onPick={() => pickRecent(c)}
                    />
                  ))}
                </>
              ) : (
                <div
                  style={{
                    marginTop: 14,
                    background: CT.cardBg,
                    borderRadius: 16,
                    padding: 18,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: CT.ink }}>
                    {t('course.emptyTitle')}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: CT.secondary, lineHeight: 1.45 }}>
                    {t('course.emptyBody')}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ padding: '10px 16px 18px', borderTop: `1px solid ${CT.hairline}` }}>
          <div
            style={{
              minHeight: 17,
              fontSize: 12,
              color: CT.secondary,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {kind === 'review' && !course ? t('footer.pickCourse') : ''}
          </div>
          <button
            type="button"
            onClick={next}
            disabled={!canAdvance}
            style={{
              width: '100%',
              height: 50,
              borderRadius: CT.pillRadius,
              border: 'none',
              background: canAdvance ? CT.ink : CT.disabledFill,
              color: canAdvance ? CT.canvas : CT.muted,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.10em',
              cursor: canAdvance ? 'pointer' : 'default',
            }}
          >
            {t('footer.next')}
          </button>
        </div>
        </div>
      </BottomSheet>

      <CourseTagSheet
        open={courseOpen}
        title={t('course.pickerTitle')}
        selectionMode="single"
        onClose={() => setCourseOpen(false)}
        selected={[]}
        userId={profile?.id ?? null}
        excludeReviewedForUserId={profile?.id ?? null}
        onDone={(cs) => {
          const c = cs[0];
          setCourseOpen(false);
          if (!c) return;
          analyticsEvents.track('composer_course_source', { source: 'search' });
          setCourse({ id: c.id, name: c.name });
        }}
      />
    </>
  );
}

function Label({ text }: { text: string }) {
  return (
    <div
      style={{
        margin: '18px 0 8px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: CT.muted,
      }}
    >
      {text}
    </div>
  );
}

function KindTile({
  title,
  sub,
  selected,
  onPick,
}: {
  title: string;
  sub: string;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      style={{
        flex: '1 1 0',
        minWidth: 0,
        position: 'relative',
        textAlign: 'left',
        background: selected ? SELECTED_FILL : CT.cardBg,
        border: `1px solid ${selected ? CT.ink : CT.hairline}`,
        borderRadius: 16,
        padding: '15px 13px 14px',
        cursor: 'pointer',
      }}
    >
      {selected && (
        <span
          style={{
            position: 'absolute',
            top: 13,
            right: 12,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: CT.ink,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Check size={11} strokeWidth={3.2} color={CT.canvas} />
        </span>
      )}
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: CT.ink,
          paddingRight: 18,
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: 5, fontSize: 12, color: CT.secondary, lineHeight: 1.4 }}>{sub}</div>
    </button>
  );
}

function CourseRow({
  course,
  selected,
  onPick,
}: {
  course: ComposerRecentCourse;
  selected: boolean;
  onPick: () => void;
}) {
  const { t } = useTranslation('composerFlow');
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        marginBottom: 8,
        padding: 10,
        textAlign: 'left',
        background: selected ? SELECTED_FILL : CT.cardBg,
        border: `1px solid ${selected ? CT.ink : CT.hairline}`,
        borderRadius: 16,
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: 11,
          overflow: 'hidden',
          background: 'linear-gradient(145deg,#2F5A3C,#16281D)',
        }}
      >
        {course.thumbnail && (
          <img
            src={course.thumbnail}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: CT.ink,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {course.courseName}
        </span>
        <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: CT.muted }}>
          {t('course.played', { when: course.when })}
        </span>
      </span>
      {selected && <Check size={17} strokeWidth={3} color={CT.success} style={{ flexShrink: 0 }} />}
    </button>
  );
}
