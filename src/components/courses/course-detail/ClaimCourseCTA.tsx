import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import { AMBER, INK, INK_FAINT } from '@/features/courses/_shared/tokens';

interface ClaimCourseCTAProps {
  clubId: string;
  clubName: string;
  sourceCourseId?: string;
}

const ClaimCourseCTA: React.FC<ClaimCourseCTAProps> = ({ clubId, clubName, sourceCourseId }) => {
  const navigate = useNavigate();

  const handleClaim = () => {
    const params = new URLSearchParams({
      category: 'golf_club',
      clubId,
      clubName,
    });
    if (sourceCourseId) params.set('sourceCourseId', sourceCourseId);
    navigate(`/business/create?${params.toString()}`);
  };

  return (
    <div style={{ padding: '8px 16px', textAlign: 'center' }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(247,147,30,0.12)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <BadgeCheck size={20} strokeWidth={2} color={AMBER} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: INK, marginBottom: 4 }}>
        Own or manage this course?
      </div>
      <p style={{ fontSize: 12, color: INK_FAINT, margin: '0 0 14px', lineHeight: 1.5 }}>
        Claim this listing to respond to reviews and update information.
      </p>
      <button
        type="button"
        onClick={handleClaim}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 22px',
          borderRadius: 20,
          background: 'transparent',
          border: `1.5px solid ${AMBER}`,
          fontSize: 13,
          fontWeight: 700,
          color: AMBER,
          cursor: 'pointer',
        }}
      >
        Claim this course →
      </button>
    </div>
  );
};

export default ClaimCourseCTA;
