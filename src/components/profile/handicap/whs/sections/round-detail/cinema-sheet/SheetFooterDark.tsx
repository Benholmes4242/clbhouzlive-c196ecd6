import React from 'react';
import { ExternalLink } from 'lucide-react';

interface Props {
  currentIndex: number | null;
  previousIndex: number | null;
  /** Negative = improvement, positive = worsened. */
  delta: number | null;
  /** External link href to MyEG round permalink, or null to hide button. */
  myegHref: string | null;
}

const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';


export const SheetFooterDark: React.FC<Props> = ({
  currentIndex,
  previousIndex,
  delta,
  myegHref,
}) => {
  const showDelta = delta != null && Math.abs(delta) >= 0.05;
  const showStrikethrough = showDelta && previousIndex != null;
  const hasIndex = currentIndex != null;
  const hasAction = myegHref != null;

  if (!hasIndex && !hasAction) return null;

  return (
    <div
      style={{
        borderTop: '0.5px solid var(--hcp-line)',
        padding: '12px 14px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: hasIndex ? 'space-between' : 'flex-end',
        gap: 12,
        background: 'var(--hcp-bg-0)',
        flexShrink: 0,
        fontFamily: FONT,
      }}
    >
      {hasIndex && (
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--hcp-t-40)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 3,
            }}
          >
            {showStrikethrough ? 'Index after this round' : 'Current index'}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              fontFamily: FONT,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--hcp-t-100)',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {currentIndex!.toFixed(1)}
            </span>
            {showStrikethrough && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--hcp-t-60)',
                  textDecoration: 'line-through',
                }}
              >
                {previousIndex!.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      )}

      {hasAction && (
        <a
          href={myegHref!}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '9px 16px',
            borderRadius: 999,
            background: '#FFFFFF',
            border: 'none',
            color: '#0F172A',
            fontWeight: 800,
            fontSize: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            textDecoration: 'none',
            fontFamily: FONT,
            flexShrink: 0,
          }}
        >
          Open in MyEG
          <ExternalLink size={13} strokeWidth={2.4} />
        </a>
      )}
    </div>
  );
};

export default SheetFooterDark;
