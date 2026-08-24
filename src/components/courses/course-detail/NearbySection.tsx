import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useNearbyBusinesses } from '@/hooks/useNearbyBusinesses';
import { getActorRouteByType } from '@/types/actor';
import { getBusinessCategoryIcon } from '@/constants/businessCategories';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { formatDistanceKm } from '@/utils/formatDistance';
import { A } from '@/features/courses/components/holes/analytical/tokens';

interface NearbySectionProps {
  lat?: number | null;
  lng?: number | null;
}

const NearbySection: React.FC<NearbySectionProps> = ({ lat, lng }) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { data } = useNearbyBusinesses(lat, lng);

  if (!lat || !lng) return null;
  if (!data || data.length === 0) return null;

  return (
    <section>
      <SectionHeader
        role="section"
        kicker={t('courseDetail.nearby.kicker')}
        title={t('courseDetail.nearby.title')}
        paddingX={16}
      />
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          padding: '0 16px 4px',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {data.map((biz) => {
          const Icon = getBusinessCategoryIcon(biz.category);
          const route = getActorRouteByType('business', biz.id, biz.slug);
          return (
            <button
              key={biz.id}
              onClick={() => navigate(route)}
              style={{
                flex: '0 0 150px',
                width: 150,
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                padding: 0,
                scrollSnapAlign: 'start',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {biz.logo_url ? (
                  <img
                    src={biz.logo_url}
                    alt=""
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Icon size={40} color={A.DIM} strokeWidth={1.5} />
                )}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: A.INK,
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {biz.name}
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 11,
                  color: A.MUTE,
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {biz.category} · {formatDistanceKm(biz.distance_km)}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default NearbySection;
