import React from 'react';
import type { WhsScoreHole } from '@/lib/whs/types';
import CinemaCardMedia from './CinemaCardMedia';
import CinemaCardGlass from './CinemaCardGlass';
import CinemaCardOnPhotoFooter from './CinemaCardOnPhotoFooter';

interface Props {
  imageUrl: string | null;
  playDate: string;
  isCounter: boolean;
  counterRank: number | null;
  courseName: string;
  par: number | null;
  slope: number | null;
  gross: number | null;
  stableford: number | null;
  differential: number | null;
  holes: WhsScoreHole[] | null;
  handicapDelta: number | null;
  onClick: () => void;
}

export const CinemaCard: React.FC<Props> = ({
  imageUrl,
  playDate,
  isCounter,
  counterRank,
  courseName,
  par,
  slope,
  gross,
  stableford,
  differential,
  holes,
  handicapDelta,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: 0,
        margin: 0,
        border: '0.5px solid rgba(15,23,42,0.07)',
        borderRadius: 24,
        overflow: 'hidden',
        background: '#0F172A',
        boxShadow: '0 2px 20px rgba(15,23,42,0.10)',
        cursor: 'pointer',
      }}
    >
      <CinemaCardMedia
        imageUrl={imageUrl}
        playDate={playDate}
        isCounter={isCounter}
        counterRank={counterRank}
      >
        <CinemaCardGlass
          courseName={courseName}
          par={par}
          slope={slope}
          gross={gross}
          stableford={stableford}
          differential={differential}
          holes={holes}
        />
        <CinemaCardOnPhotoFooter
          isCounter={isCounter}
          handicapDelta={handicapDelta}
        />
      </CinemaCardMedia>
    </button>
  );
};

export default CinemaCard;
