/**
 * H5 - every approved photograph of a hole, as a horizontal snap rail.
 * Several angles of a hard hole are genuinely useful, so all approved rows
 * are shown here rather than one daily pick. No lightbox, no zoom.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHolePhotos } from '@/hooks/media/useHoleMedia';
import { A } from './analytical/tokens';

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

interface Props {
  courseId?: string;
  holeNo: number;
}

export const HolePhotoGallery: React.FC<Props> = ({ courseId, holeNo }) => {
  const { t } = useTranslation(['courses']);
  const { data } = useHolePhotos(courseId, holeNo);
  const photos = data?.approved ?? [];

  if (!courseId || photos.length === 0) return null;

  return (
    <div
      className="hole-photo-rail"
      style={{
        display: 'flex',
        gap: 10,
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      <style>{'.hole-photo-rail::-webkit-scrollbar{display:none}'}</style>
      {photos.map((p) => (
        <figure
          key={p.id}
          style={{ margin: 0, flex: '0 0 auto', width: 'min(78%, 300px)', scrollSnapAlign: 'center' }}
        >
          <img
            src={p.media_url}
            alt={t('courses:holePhoto.alt', { ordinal: ordinal(holeNo) })}
            loading="lazy"
            style={{
              width: '100%',
              aspectRatio: '4 / 3',
              objectFit: 'cover',
              borderRadius: 12,
              display: 'block',
            }}
          />
          {p.contributorName ? (
            <figcaption style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: A.MUTE }}>
              {t('courses:holePhoto.credit', { name: p.contributorName })}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
};

export default HolePhotoGallery;
