// CreateSheetV2 - the create chooser reached from the bottom-nav (+).
// Two options: Post (fires the native media picker from THIS component so the
// tap that opens the OS source menu is its own user activation) and Course
// review (opens the review wizard). The hidden file input lives here on
// purpose: it travels with the tap that fires it.
//
// Picker outcomes:
//   files chosen -> openPostStudio({ media }) -> StageComposer lands on page 1
//   cancelled    -> openPostStudio()          -> StageComposer lands on page 2
// Cancellation is detected via the input's 'cancel' event, with a
// window-focus + timeout fallback for WebViews that never fire it.

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ImagePlus } from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import BottomSheet from './BottomSheet';
import CourseTagSheet from './CourseTagSheet';
import { CT } from '@/features/_shared/composerTokens';

interface Props {
  open: boolean;
  onClose: () => void;
  returnPath?: string;
}

export default function CreateSheetV2({ open, onClose, returnPath }: Props) {
  const { profile } = useProfileData();
  const navigate = useNavigate();
  const openPostStudio = usePostStudioStore((s) => s.openPostStudio);
  const [courseOpen, setCourseOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Guards a single picker session: whichever signal lands first wins.
  const pendingRef = useRef(false);

  const settle = useCallback((files: File[]) => {
    if (!pendingRef.current) return;
    pendingRef.current = false;
    openPostStudio(files.length > 0 ? { media: files, returnPath } : { returnPath });
  }, [openPostStudio, returnPath]);

  const handleReview = () => {
    setCourseOpen(true);
  };

  const handlePost = () => {
    // Close the sheet and fire the picker SYNCHRONOUSLY in the same tap —
    // never behind the close animation or a setTimeout (iOS swallows it).
    pendingRef.current = true;
    onClose();
    inputRef.current?.click();
  };

  // Cancel detection. 'cancel' is the correct signal (WebKit 16.4+); the
  // focus fallback covers WebViews that don't fire it.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onCancel = () => settle([]);
    el.addEventListener('cancel', onCancel);

    let timer: ReturnType<typeof setTimeout> | null = null;
    const onFocus = () => {
      if (!pendingRef.current) return;
      if (timer) clearTimeout(timer);
      // Give the change event a beat to land before assuming a cancel.
      timer = setTimeout(() => settle([]), 900);
    };
    window.addEventListener('focus', onFocus);
    return () => {
      el.removeEventListener('cancel', onCancel);
      window.removeEventListener('focus', onFocus);
      if (timer) clearTimeout(timer);
    };
  }, [settle]);

  return (
    <>
      <BottomSheet open={open && !courseOpen} title="Create" onClose={onClose}>
        <div style={{ padding: '4px 12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <OptionRow
            glyph={<ImagePlus size={22} color={CT.ink} />}
            title="Post"
            subtitle="Share photos, video or words"
            onClick={handlePost}
          />
          <OptionRow
            glyph={<Star size={22} color={CT.amber} />}
            title="Course review"
            subtitle="Rate and review a course you've played"
            onClick={handleReview}
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
          setCourseOpen(false);
          onClose();
          navigate(`/courses/${c.id}/rate`);
        }}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          settle(files);
        }}
      />
    </>
  );
}

function OptionRow({ glyph, title, subtitle, onClick }: { glyph: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px',
        background: CT.ghost,
        border: '1px solid rgba(15,23,42,0.08)',
        borderRadius: CT.cardRadius,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: CT.cardBg,
          border: '1px solid rgba(15,23,42,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        {glyph}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: CT.ink, letterSpacing: -0.1 }}>{title}</div>
        <div style={{ fontSize: 12, color: CT.secondary, marginTop: 2 }}>{subtitle}</div>
      </div>
    </button>
  );
}
