import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { AMBER, INK, INK_FAINT } from '@/features/courses/_shared/tokens';
import type { ClaimingBusiness } from '@/hooks/useCourseClaim';

interface Props {
  business: ClaimingBusiness;
}

const ClaimedCourseProfileLink: React.FC<Props> = ({ business }) => {
  const navigate = useNavigate();
  const target = `/business/${business.slug ?? business.id}`;

  return (
    <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: '#F1F5F9',
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {business.logo_url ? (
          <img
            src={business.logo_url}
            alt={business.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: 14, fontWeight: 800, color: INK_FAINT }}>
            {business.name.slice(0, 1)}
          </span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: INK,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {business.name}
          </span>
          {business.is_verified && <VerifiedBadge size="sm" />}
        </div>
        <div style={{ fontSize: 11, color: INK_FAINT, marginTop: 2 }}>
          Manages this course
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate(target)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '8px 16px',
          borderRadius: 20,
          background: 'transparent',
          border: `1.5px solid ${AMBER}`,
          fontSize: 12,
          fontWeight: 700,
          color: AMBER,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Visit profile →
      </button>
    </div>
  );
};

export default ClaimedCourseProfileLink;
