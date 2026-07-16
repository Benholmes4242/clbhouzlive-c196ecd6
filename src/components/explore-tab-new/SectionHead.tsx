import { FONT } from './gamingLightTokens';

// Canonical section header for the Discover Almanac page.
// One implementation. Light + dark surfaces. Optional right-aligned meta.
// Overline: 10.5px 600 letterSpacing 0.06em uppercase.
// Title:    17px 700 letterSpacing -0.02em.
// Meta:     "View all ›" 12px 600 amber, baseline-aligned with the title.

const AMBER = '#F7931E';
const OVERLINE_LIGHT = 'rgba(15,23,42,0.45)';
const OVERLINE_DARK = 'rgba(255,255,255,0.55)';
const TITLE_LIGHT = '#0F172A';
const TITLE_DARK = '#FFFFFF';

interface Props {
  overline: string;
  subline?: string;
  title?: string;
  meta?: string;
  onMeta?: () => void;
  surface?: 'light' | 'dark';
  paddingX?: number;
  paddingBottom?: number;
  paddingTop?: number;
}

const SUBLINE_LIGHT = 'rgba(15,23,42,0.4)';
const SUBLINE_DARK = 'rgba(255,255,255,0.55)';

export function SectionHead({
  overline,
  subline,
  title,
  meta,
  onMeta,
  surface = 'light',
  paddingX = 16,
  paddingBottom = 10,
  paddingTop = 0,
}: Props) {
  const overlineColor = surface === 'dark' ? OVERLINE_DARK : OVERLINE_LIGHT;
  const sublineColor = surface === 'dark' ? SUBLINE_DARK : SUBLINE_LIGHT;
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
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: overlineColor,
              lineHeight: 1,
            }}
          >
            {overline}
          </div>
          {subline ? (
            <div
              style={{
                marginTop: 2,
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: sublineColor,
                lineHeight: 1,
              }}
            >
              {subline}
            </div>
          ) : null}
          {title ? (
            <div
              style={{
                marginTop: 6,
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: '-0.02em',
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
              fontSize: 12,
              fontWeight: 600,
              fontFamily: FONT,
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
