import React from 'react';
import { useNavigate } from 'react-router-dom';

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
      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
        Own or manage this course?
      </div>
      <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 14px', lineHeight: 1.5 }}>
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
          border: '1.5px solid #F7931E',
          fontSize: 13,
          fontWeight: 700,
          color: '#F7931E',
          cursor: 'pointer',
        }}
      >
        Claim this course →
      </button>
    </div>
  );
};

export default ClaimCourseCTA;
