import React from 'react';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { FONT, BG_0, T100, T60, AMBER, LINE_2 } from './_shared/tokens';

interface Props {
  scrolled: boolean;
  subtitle: string | null;
  onBack: () => void;
}

export const DossierHeader: React.FC<Props> = ({
  scrolled,
  subtitle,
  onBack,
}) => (
  <div
    style={{
      position: 'sticky',
      top: 0,
      zIndex: 30,
      background: BG_0,
      borderBottom: scrolled
        ? `0.5px solid ${LINE_2}`
        : '0.5px solid transparent',
      transition: 'border-color 200ms ease',
      paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
    }}
  >
    <div
      style={{
        padding: '8px 16px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <button
        type="button"
        aria-label="Back"
        onClick={onBack}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 8,
          marginLeft: -8,
          color: T100,
          cursor: 'pointer',
        }}
      >
        <ChevronLeft size={22} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: AMBER,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontFamily: FONT,
          }}
        >
          Rivalry
        </div>
        <div
          style={{
            color: T100,
            fontSize: scrolled ? 14 : 18,
            fontWeight: 800,
            lineHeight: 1.2,
            fontFamily: FONT,
            transition: 'font-size 200ms ease',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {scrolled && subtitle ? subtitle : 'Dossier'}
        </div>
      </div>
      <button
        type="button"
        aria-label="More"
        style={{
          background: 'transparent',
          border: 'none',
          padding: 8,
          marginRight: -8,
          color: T60,
          cursor: 'pointer',
        }}
      >
        <MoreHorizontal size={20} />
      </button>
    </div>
  </div>
);
