// CreateSheetV2 - the create chooser reached from the bottom-nav (+).
// Two options: Post (opens the post wizard on page 1 in its designed empty
// state) and Course review (opens the review wizard).
//
// The mount-time OS picker is GONE by brief: page 1 owns both pick paths
// ("Take photo or video" / "Choose from library"), so auto-firing an input here
// stacked the iOS source menu on top of the very buttons that trigger it.

import { useState } from 'react';
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
  const handleReview = () => {
    setCourseOpen(true);
  };

  const handlePost = () => {
    // Open the wizard on page 1 in its empty state. No picker fires here.
    openPostStudio({ awaitingMedia: true, returnPath });
    onClose();
  };

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
        border: '1px solid rgba(255,255,255,0.10)',
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
          border: '1px solid rgba(255,255,255,0.08)',
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
