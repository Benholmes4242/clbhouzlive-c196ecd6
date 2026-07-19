// CreateSheetV2 - the Post-or-Review chooser opened by the bottom-nav (+).
// House sheet style (grabber, 17/800 title). Two large option rows:
//   1) Post          -> opens the Stage composer via openPostStudio
//   2) Course review -> opens CourseTagSheet search; on pick, navigate to
//                       /courses/<id>/rate (the review Composer).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageIcon, Star } from 'lucide-react';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { useProfileData } from '@/hooks/useProfileData';
import BottomSheet from './BottomSheet';
import CourseTagSheet from './CourseTagSheet';

interface Props {
  open: boolean;
  onClose: () => void;
  returnPath?: string;
}

export default function CreateSheetV2({ open, onClose, returnPath }: Props) {
  const openPostStudio = usePostStudioStore((s) => s.openPostStudio);
  const { profile } = useProfileData();
  const navigate = useNavigate();
  const [courseOpen, setCourseOpen] = useState(false);

  const handlePost = () => {
    onClose();
    openPostStudio({ returnPath });
  };

  const handleReview = () => {
    setCourseOpen(true);
  };

  return (
    <>
      <BottomSheet open={open && !courseOpen} title="Create" onClose={onClose}>
        <div style={{ padding: '4px 12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <OptionRow
            glyph={<ImageIcon size={22} color="#F7931E" />}
            title="Post"
            subtitle="Share photos, clips or words to your feed"
            onClick={handlePost}
          />
          <OptionRow
            glyph={<Star size={22} color="#F7931E" />}
            title="Course review"
            subtitle="Rate and review a course you've played"
            onClick={handleReview}
          />
        </div>
      </BottomSheet>

      <CourseTagSheet
        open={courseOpen}
        title="Choose a course"
        onClose={() => { setCourseOpen(false); onClose(); }}
        selected={[]}
        userId={profile?.id ?? null}
        excludeReviewedForUserId={profile?.id ?? null}
        onSubmit={(cs) => {
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
        background: '#F1F5F9',
        border: '1px solid rgba(15,23,42,0.08)',
        borderRadius: 16,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: '#FFFFFF',
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
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: -0.1 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{subtitle}</div>
      </div>
    </button>
  );
}
