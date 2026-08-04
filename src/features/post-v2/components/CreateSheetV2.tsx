// CreateSheetV2 - the Course review chooser. The Post path now lives in the
// bottom-nav file picker, so this sheet only opens the review wizard.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
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
  const [courseOpen, setCourseOpen] = useState(false);

  const handleReview = () => {
    setCourseOpen(true);
  };

  return (
    <>
      <BottomSheet open={open && !courseOpen} title="Create" onClose={onClose}>
        <div style={{ padding: '4px 12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
