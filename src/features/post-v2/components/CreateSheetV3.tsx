// CreateSheetV3 — what the bottom-nav (+) opens onto.
//
// Replaces the two-option "Post or Review?" chooser. The sheet opens on WHAT
// THE MEMBER DID: their recent rounds as real cards, each carrying only the
// actions that round still needs, then two plain rows for everything else.
//
// Both composers are untouched — this changes the door, not the rooms. The
// review wizard still opens on its step 1 and the post wizard still opens on
// its own pages; they just arrive with the course already resolved.
//
// WINDOW / RANK / CAP live in useRecentRoundsForCreate, at selection time.
//
// NO AMBER. Every round here belongs to the viewing member, so amber would be
// on everything and mean nothing. The filled pill is INK.

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { afterSheetHistorySettled } from '@/components/ui/sheetHistory';
import { useProfileData } from '@/hooks/useProfileData';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { analyticsEvents } from '@/utils/analyticsEvents';
import BottomSheet from './BottomSheet';
import CourseTagSheet from './CourseTagSheet';
import { CT } from '@/features/_shared/composerTokens';
import { useRecentRoundsForCreate, type CreateSheetRound } from '@/hooks/create/useRecentRoundsForCreate';

const T = {
  panel: '#1B1E27',
  ink: CT.ink,
  mute: 'rgba(248,250,252,0.62)',
  dim: 'rgba(248,250,252,0.42)',
  hair: 'rgba(255,255,255,0.10)',
  canvas: CT.canvas,
};

const NUM: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  fontFeatureSettings: '"kern" 1, "liga" 1',
};

interface Props {
  open: boolean;
  onClose: () => void;
  returnPath?: string;
}

export default function CreateSheetV3({ open, onClose, returnPath }: Props) {
  const { profile } = useProfileData();
  const navigate = useNavigate();
  const openPostStudio = usePostStudioStore((s) => s.openPostStudio);
  const openPostStudioForCourse = usePostStudioStore((s) => s.openPostStudioForCourse);
  const openPostStudioForEdit = usePostStudioStore((s) => s.openPostStudioForEdit);
  const [courseOpen, setCourseOpen] = useState(false);

  const { data: rounds = [] } = useRecentRoundsForCreate(open);
  const has = rounds.length > 0;

  /* NAVIGATING AWAY FROM THIS SHEET — ORDER AND OWNERSHIP.
     This sheet holds a sheet-history marker, and closing it unwinds that marker
     with history.back(). A handler that closed the sheet and then navigated in
     the same tick pushed its route BEFORE that back landed, so the back ate the
     push and the member was returned to the page they started on. That was the
     RATE IT symptom exactly; the two composer actions survived only because they
     open an overlay through a store rather than navigating.
     THE SHEET CLOSES FIRST, ITS ENTRY IS RELEASED, AND ONLY THEN DO WE NAVIGATE.
     The target is parked here, the close releases the marker during commit, and
     afterSheetHistorySettled runs the navigation once that unwind has landed. NOT
     A DELAY — with nothing outstanding it runs on the next microtask. */
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


  // "Add photos" / "Add more" — the media lands ON the existing round post.
  const addToPost = (round: CreateSheetRound, files: File[]) => {
    if (!round.postId || files.length === 0) return;
    analyticsEvents.track('create_sheet_action', { action: 'add_photos', has_media: round.postHasMedia });
    openPostStudioForEdit({ postId: round.postId, media: files, returnPath });
    onClose();
  };

  const rateIt = (round: CreateSheetRound) => {
    if (!round.courseId) return;
    analyticsEvents.track('create_sheet_action', { action: 'rate_it' });
    /* SAME ROUTE AND SAME PARAM SHAPE as the venue band's RATE THIS COURSE row —
       one way in to the review composer, not a second. courseId here is a
       golf_courses.id (the hook joins golf_courses to resolve name and image), and
       a round whose course does not resolve carries no courseId, so no RATE IT
       pill renders for it and this cannot route to a broken page. */
    navigateAfterClose(`/courses/${round.courseId}/rate`);
  };

  const saySomething = (round: CreateSheetRound) => {
    analyticsEvents.track('create_sheet_action', { action: 'say_something' });
    if (round.courseId) {
      openPostStudioForCourse({ course: { id: round.courseId, name: round.courseName }, returnPath });
    } else {
      openPostStudio({ awaitingMedia: true, returnPath });
    }
    onClose();
  };

  return (
    <>
      <BottomSheet open={open && !courseOpen} onClose={onClose}>
        <div style={{ padding: '4px 16px 22px' }}>
          {has && (
            <>
              <Heading text={rounds.length > 1 ? 'Your last rounds' : 'Your last round'} />
              {rounds.map((r) => (
                <RoundCard
                  key={r.whsScoreId}
                  round={r}
                  onFiles={(files) => addToPost(r, files)}
                  onRate={() => rateIt(r)}
                  onSay={() => saySomething(r)}
                />
              ))}
              <div style={{ height: 6 }} />
            </>
          )}

          <Heading
            text={has ? 'Something else' : 'What would you like to do?'}
            style={{ margin: has ? '10px 0 2px' : '0 0 2px' }}
          />

          <PlainRow
            title="New post"
            sub="Photos or video, from anywhere"
            onPick={() => {
              analyticsEvents.track('create_sheet_action', { action: 'new_post' });
              openPostStudio({ awaitingMedia: true, returnPath });
              onClose();
            }}
          />
          <PlainRow
            title="Rate a course"
            sub="Any course you have played"
            last
            onPick={() => {
              analyticsEvents.track('create_sheet_action', { action: 'rate_a_course' });
              setCourseOpen(true);
            }}
          />
        </div>
      </BottomSheet>

      <CourseTagSheet
        open={courseOpen}
        title="Choose a course"
        selectionMode="single"
        onClose={() => { setCourseOpen(false); onClose(); }}
        selected={[]}
        userId={profile?.id ?? null}
        excludeReviewedForUserId={profile?.id ?? null}
        onDone={(cs) => {
          const c = cs[0];
          if (!c) return;
          // Same close-then-navigate order as RATE IT: two markers are released
          // here (this sheet and the course picker) and the navigation waits for
          // both to land.
          setCourseOpen(false);
          navigateAfterClose(`/courses/${c.id}/rate`);
        }}
      />
    </>
  );
}

function Heading({ text, style }: { text: string; style?: React.CSSProperties }) {
  return (
    <h2 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: T.ink, ...style }}>
      {text}
    </h2>
  );
}

function RoundCard({
  round,
  onFiles,
  onRate,
  onSay,
}: {
  round: CreateSheetRound;
  onFiles: (files: File[]) => void;
  onRate: () => void;
  onSay: () => void;
}) {
  // The picker must fire from THIS pill's own onClick — a route change or an
  // effect loses the user-activation context in the iOS WebView.
  const inputRef = useRef<HTMLInputElement>(null);
  const canAddPhotos = !!round.postId;

  return (
    <div style={{ background: T.panel, borderRadius: 18, padding: 12, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div
          style={{
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: 14,
            overflow: 'hidden',
            background: 'linear-gradient(145deg,#2F5A3C,#16281D)',
          }}
        >
          {round.thumbnail && (
            <img
              src={round.thumbnail}
              alt=""
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: T.ink,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {round.courseName}
          </div>
          <div style={{ marginTop: 2, fontSize: 11.5, fontWeight: 600, color: T.mute, ...NUM }}>
            {round.when}
            {round.gross != null && <> · {round.gross}</>}
            {round.toPar && <span style={{ color: T.dim }}> ({round.toPar})</span>}
            {round.rated && round.yourRating != null && (
              <>
                <span style={{ color: T.dim }}> · </span>
                <span style={{ color: T.mute }}>you rated {round.yourRating}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {canAddPhotos && !round.postHasMedia && (
        <div style={{ marginTop: 9, fontSize: 11, fontWeight: 600, color: T.dim, lineHeight: 1.35 }}>
          Already in the Clubhouse with no photos yet.
        </div>
      )}

      <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
        {canAddPhotos && (
          <div style={{ flex: '1 1 0', minWidth: 0, position: 'relative' }}>
            <ActionPill
              label={round.postHasMedia ? 'Add more' : 'Add photos'}
              tone={round.postHasMedia ? 'quiet' : 'lead'}
              onPick={() => inputRef.current?.click()}
            />
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none' }}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                onFiles(files);
              }}
            />
          </div>
        )}
        {!round.rated && !!round.courseId && <ActionPill label="Rate it" tone="lead" onPick={onRate} />}
        <ActionPill label="Say something" onPick={onSay} />
      </div>
    </div>
  );
}

function ActionPill({ label, onPick, tone = 'quiet' }: { label: string; onPick: () => void; tone?: 'lead' | 'quiet' }) {
  const filled = tone === 'lead';
  return (
    <button
      type="button"
      onClick={onPick}
      style={{
        flex: '1 1 0',
        width: '100%',
        minWidth: 0,
        cursor: 'pointer',
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: '-0.005em',
        padding: '9px 10px',
        borderRadius: 14,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        background: filled ? T.ink : 'transparent',
        color: filled ? T.canvas : T.ink,
        border: filled ? '1px solid transparent' : `1px solid ${T.hair}`,
      }}
    >
      {label}
    </button>
  );
}

function PlainRow({ title, sub, onPick, last }: { title: string; sub: string; onPick: () => void; last?: boolean }) {
  return (
    <button
      type="button"
      onClick={onPick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 2px',
        background: 'transparent',
        border: 'none',
        borderBottom: last ? 'none' : `1px solid ${T.hair}`,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: T.ink, letterSpacing: '-0.01em' }}>
          {title}
        </span>
        <span style={{ display: 'block', marginTop: 2, fontSize: 11.5, fontWeight: 600, color: T.dim }}>{sub}</span>
      </span>
      <span style={{ flexShrink: 0, color: T.dim, fontSize: 15, fontWeight: 700 }}>›</span>
    </button>
  );
}
