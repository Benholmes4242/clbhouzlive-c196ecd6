import React from 'react';
import { type LucideIcon } from 'lucide-react';

interface ChampionsResultBandProps {
  categoryLabel: string;
  categoryIcon: LucideIcon;
  championName: string;
  championPhotoUrl: string | null;
  valueDisplay: string;
  unitLabel: string;
  isSelf: boolean;
  /** Small grey metadata line beneath the champion name, e.g. "Held 5d · 5 entries" */
  heldMeta: string;
}

const INK = '#0F1822';
const AMBER = '#F7931E';
const GOLD = '#FBBC2E';

// True squircle mask. Inlined SVG path so the component is self-contained.
const SQUIRCLE_MASK_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M40 0h20c22.091 0 40 17.909 40 40v20c0 22.091-17.909 40-40 40H40C17.909 100 0 82.091 0 60V40C0 17.909 17.909 0 40 0z'/%3E%3C/svg%3E\")";

const squircleMaskStyle: React.CSSProperties = {
  WebkitMaskImage: SQUIRCLE_MASK_URL,
  maskImage: SQUIRCLE_MASK_URL,
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
};

const PHOTO_SIZE = 60;
const BORDER = 1;

export const ChampionsResultBand: React.FC<ChampionsResultBandProps> = ({
  categoryLabel,
  categoryIcon: CatIcon,
  championName,
  championPhotoUrl,
  valueDisplay,
  unitLabel,
  isSelf,
  heldMeta,
}) => (
  <>
    <div style={{ height: 1, background: AMBER }} aria-hidden />
    <div
      style={{
        background: INK,
        padding: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'relative',
          width: PHOTO_SIZE,
          height: PHOTO_SIZE,
          flexShrink: 0,
        }}
      >
        {/* Outer amber squircle */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: AMBER,
            ...squircleMaskStyle,
          }}
        />
        {/* Inner photo squircle, inset by BORDER px = visible amber edge */}
        <div
          style={{
            position: 'absolute',
            inset: BORDER,
            background: championPhotoUrl
              ? `url(${championPhotoUrl}) center/cover`
              : 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
            ...squircleMaskStyle,
          }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: AMBER,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            marginBottom: 4,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <CatIcon size={11} strokeWidth={2.4} />
          {categoryLabel}
        </div>
        <div
          style={{
            fontSize: 19,
            fontWeight: 800,
            color: isSelf ? GOLD : '#FFFFFF',
            letterSpacing: '-0.022em',
            lineHeight: 1.0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {championName}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 10,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}
        >
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: AMBER,
              flexShrink: 0,
            }}
          />
          {heldMeta}
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 200,
            color: GOLD,
            letterSpacing: '-0.03em',
            lineHeight: 0.95,
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'right',
          }}
        >
          {valueDisplay}
        </div>
        {unitLabel && (
          <div
            style={{
              fontSize: 10.5,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 700,
              textAlign: 'right',
              marginTop: 4,
            }}
          >
            {unitLabel}
          </div>
        )}
      </div>
    </div>
  </>
);

export default ChampionsResultBand;
