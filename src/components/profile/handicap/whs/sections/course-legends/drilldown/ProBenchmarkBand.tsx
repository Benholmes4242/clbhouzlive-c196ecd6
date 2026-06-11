import React, { useState } from 'react';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import type { ProProfile } from './_shared/proBenchmark';

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

interface Props {
  pro: ProProfile;
  value: string;
  sub: string;
}

export const ProBenchmarkBand: React.FC<Props> = ({ pro, value, sub }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const headshotUrl = getPlayerHeadshotUrl(pro.full_name, pro.tour_code);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 10,
        alignItems: 'center',
        padding: '10px 13px',
        background: 'var(--hcp-tour-dim)',
        border: '1px dashed var(--hcp-tour-border)',
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      {/* Headshot squircle with initials placeholder fallback */}
      <div style={{ width: 36, height: 36, position: 'relative', flexShrink: 0 }} aria-hidden>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #1e3a8a, #2563EB)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.02em',
            ...squircleMaskStyle,
          }}
        >
          {pro.initials}
        </div>
        {!imgFailed && (
          <img
            src={headshotUrl}
            alt=""
            onError={() => setImgFailed(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              ...squircleMaskStyle,
            }}
          />
        )}
      </div>

      {/* Name + sub */}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: 'var(--hcp-t-100)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.005em',
            }}
          >
            {pro.full_name}
          </span>
          <span
            style={{
              flexShrink: 0,
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: '0.10em',
              color: 'var(--hcp-tour-text)',
              background: 'var(--hcp-tour-tag-bg)',
              padding: '2px 6px',
              borderRadius: 6,
              textTransform: 'uppercase',
            }}
          >
            Tour Pro
          </span>
        </div>
        <span
          style={{
            fontSize: 10,
            color: 'var(--hcp-t-60)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {sub}
        </span>
      </div>

      {/* Value */}
      <span
        style={{
          fontSize: 19,
          fontWeight: 800,
          color: 'var(--hcp-tour-text)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );
};

export default ProBenchmarkBand;
