import { GAM } from '../../../gam/tokens';
import React from 'react';
import { Crown } from 'lucide-react';

interface ChampionsListRowProps {
  rank: number;
  name: string;
  photoUrl: string | null;
  valueDisplay: string;
  unitLabel: string;
  isSelf: boolean;
  isChampion: boolean;
  gapToChampion: string | null;
  holdDuration: string | null;
}

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

export const ChampionsListRow: React.FC<ChampionsListRowProps> = ({
  rank,
  name,
  photoUrl,
  valueDisplay,
  unitLabel,
  isSelf,
  isChampion,
  gapToChampion,
  holdDuration,
}) => {
  const rowBg = isSelf
    ? 'rgba(247,147,30,0.10)'
    : isChampion
      ? 'var(--hcp-bg-2)'
      : 'var(--hcp-bg-1)';
  const photoBg = photoUrl
    ? `url(${photoUrl}) center/cover`
    : 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)';

  const avatar = isChampion ? (
    <div style={{ width: 40, height: 40, position: 'relative', flexShrink: 0 }} aria-hidden>
      <div style={{ position: 'absolute', inset: 0, background: photoBg, ...squircleMaskStyle }} />
      <div style={{ position: 'absolute', inset: 0, ...squircleMaskStyle, boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.08)' }} />
    </div>
  ) : (
    <div
      aria-hidden
      style={{
        width: 40,
        height: 40,
        borderRadius: '34%',
        background: photoBg,
        boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.08)',
        flexShrink: 0,
      }}
    />
  );

  const subText = isChampion
    ? holdDuration
    : gapToChampion
      ? `${gapToChampion.replace('-', '−')} from champion`
      : '';

  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '24px 40px 1fr auto',
        gap: 14,
        alignItems: 'center',
        padding: '10px 16px',
        background: rowBg,
        boxShadow: 'inset 0 -0.5px 0 rgba(15,23,42,0.07)',
      }}
    >
      {isChampion && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: GAM.GOLD,
          }}
        />
      )}
      {rank === 1 ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', lineHeight: 0 }} aria-label="Champion">
          <Crown size={15} strokeWidth={2.5} fill={GAM.GOLD} style={{ color: GAM.DEEP_AMBER, flexShrink: 0 }} />
        </div>
      ) : (
        <div
          style={{
            fontFamily: GAM.FONT_GEIST,
            fontSize: 15,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--hcp-t-30, #b3bdca)',
            lineHeight: 1,
            textAlign: 'right',
          }}
        >
          {rank}
        </div>
      )}

      {avatar}

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: isChampion ? 800 : 600,
            color: isSelf ? GAM.DEEP_AMBER : 'var(--hcp-t-100, ' + GAM.INK + ')',
            letterSpacing: '-0.014em',
            lineHeight: 1.25,
            marginBottom: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--hcp-t-50, #9aa6b2)',
            fontWeight: 500,
            letterSpacing: '-0.003em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {subText}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span
          style={{
            fontFamily: GAM.FONT_GEIST,
            fontSize: 16,
            fontWeight: 700,
            color: isSelf || isChampion ? GAM.DEEP_AMBER : 'var(--hcp-t-100, ' + GAM.INK + ')',
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {valueDisplay}
        </span>
      </div>
    </div>
  );
};

export default ChampionsListRow;
