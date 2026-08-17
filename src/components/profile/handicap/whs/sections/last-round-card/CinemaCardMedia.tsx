import React, { useState } from 'react';
import { formatWeekdayLongDayMonthLongGB } from '@/i18n/format';
import FlagSilhouetteOverlay from '@/components/whs/FlagSilhouetteOverlay';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';

const FONT_SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const AMBER = '#F7931E';

interface Props {
  imageUrl: string | null;
  playDate: string;
  isCounter: boolean;
  counterRank: number | null;
  children?: React.ReactNode; // glass tile
}

const FALLBACK_GRADIENT = 'linear-gradient(135deg, #46665a 0%, #2f4a40 100%)';

const ATMOSPHERIC =
  'radial-gradient(ellipse 80% 60% at 50% 90%, rgba(0,0,0,0.55) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 70% 25%, rgba(255,200,140,0.18) 0%, transparent 60%)';

/** Renamed from LEGIBILITY_SCRIM — Tour Hub exports a token of that name and
 *  the two must not be confused (BRIEF_APP_WIDE_SCRIM §4.4). */
const CINEMA_LEGIBILITY = SCRIM_STANDOUT;

export const CinemaCardMedia: React.FC<Props> = ({
  imageUrl,
  playDate,
  isCounter,
  counterRank,
  children,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = !!imageUrl && !imgFailed;

  const dateLabel = (() => {
    try {
      return formatWeekdayLongDayMonthLongGB(playDate);
    } catch {
      return '';
    }
  })();

  const showCounter = isCounter && counterRank != null;

  return (
    <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>
      {/* z=0 image / fallback */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: hasImage
            ? `url(${imageUrl}) center/cover no-repeat`
            : FALLBACK_GRADIENT,
        }}
      />
      {/* Invisible probe to detect broken urls (browser dedupes with the bg request) */}
      {imageUrl && !imgFailed && (
        <img
          src={imageUrl}
          alt=""
          aria-hidden
          onError={() => setImgFailed(true)}
          style={{ display: 'none' }}
        />
      )}
      {!hasImage && <FlagSilhouetteOverlay opacity={0.26} />}
      {/* z=1 atmospheric */}
      <div style={{ position: 'absolute', inset: 0, background: ATMOSPHERIC, pointerEvents: 'none' }} />
      {/* z=2 legibility */}
      <div style={{ position: 'absolute', inset: 0, background: CINEMA_LEGIBILITY, pointerEvents: 'none' }} />

      {/* z=3 eyebrow */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          zIndex: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          fontFamily: FONT_SF,
        }}
      >
        <div>
          {dateLabel && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {dateLabel}
            </div>
          )}
        </div>
        {/* Counter status now signaled via green ring on gross score in glass tile */}
      </div>

      {children}
    </div>
  );
};

export default CinemaCardMedia;
