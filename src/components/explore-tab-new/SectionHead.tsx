import { FONT } from './gamingLightTokens';

// Canonical section header for the Discover Almanac page.
// One implementation. Light + dark surfaces. Optional right-aligned meta.
// Overline: 10px 800 letterSpacing 0.14em uppercase.
// Title:    19px 800 letterSpacing -0.01em.
// Meta:     "View all ›" 11.5px 800 amber, baseline-aligned with the title.

const AMBER = '#F7931E';
const OVERLINE_LIGHT = 'rgba(15,23,42,0.5)';
const OVERLINE_DARK = 'rgba(255,255,255,0.5)';
const TITLE_LIGHT = '#0F172A';
const TITLE_DARK = '#FFFFFF';

interface Props {
  overline: string;
  title?: string;
  meta?: string;
  onMeta?: () => void;
  surface?: 'light' | 'dark';
  paddingX?: number;
  paddingBottom?: number;
  paddingTop?: number;
}

export function SectionHead({
  overline,
  title,
  meta,
  onMeta,
  surface = 'light',
  paddingX = 16,
  paddingBottom = 10,
  paddingTop = 0,
}: Props) {
  const overlineColor = surface === 'dark' ? OVERLINE_DARK : OVERLINE_LIGHT;
  const titleColor = surface === 'dark' ? TITLE_DARK : TITLE_LIGHT;
  return (
    <div
      style={{
        padding: `${paddingTop}px ${paddingX}px ${paddingBottom}px`,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: overlineColor,
              lineHeight: 1,
            }}
          >
            {overline}
          </div>
          {title ? (
            <div
              style={{
                marginTop: 6,
                fontSize: 19,
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: titleColor,
                lineHeight: 1.15,
              }}
            >
              {title}
            </div>
          ) : null}
        </div>
        {meta && onMeta ? (
          <button
            type="button"
            onClick={onMeta}
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: AMBER,
              fontSize: 11.5,
              fontWeight: 800,
              fontFamily: FONT,
              letterSpacing: '-0.005em',
              whiteSpace: 'nowrap',
            }}
          >
            {meta} ›
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default SectionHead;
