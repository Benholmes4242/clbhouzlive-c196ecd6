import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AMBER, INK, INK_FAINT } from '@/features/courses/_shared/tokens';

interface ClaimCourseCTAProps {
  clubId: string;
  clubName: string;
}

const ClaimCourseCTA: React.FC<ClaimCourseCTAProps> = ({ clubId, clubName }) => {
  const navigate = useNavigate();

  const handleClaim = () => {
    const params = new URLSearchParams({
      category: 'golf_club',
      clubId,
      clubName,
    });
    navigate(`/business/create?${params.toString()}`);
  };

  return (
    <div style={{ padding: '8px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 20, marginBottom: 8 }}>🏌️</div>
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
