import { SPACE } from '@/lib/spacing';
import { FONT } from './gamingLightTokens';

interface Props {
  eyebrow: string;
  title?: string;
  linkLabel?: string;
  onLinkClick?: () => void;
}

// Editorial light-mode header: eyebrow + optional title + optional right link.
export function DiscoverSectionHeader({ eyebrow, title, linkLabel, onLinkClick }: Props) {
  return (
    <div
      style={{
        padding: `0 ${SPACE.pagePadX}px ${SPACE.sectionHeaderContent}px`,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#94A3B8',
            lineHeight: 1,
          }}
        >
          {eyebrow}
        </span>
        <span style={{ flex: 1 }} />
        {linkLabel && onLinkClick ? (
          <button
            type="button"
            onClick={onLinkClick}
            style={{
              border: 'none',
              background: 'none',
              fontSize: 12,
              fontWeight: 800,
              color: '#94A3B8',
              cursor: 'pointer',
            }}
          >
            {linkLabel} ›
          </button>
        ) : null}
      </div>
      {title ? (
        <div
          style={{
            marginTop: 4,
            fontSize: 18,
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
      ) : null}
    </div>
  );
}

export default DiscoverSectionHeader;
