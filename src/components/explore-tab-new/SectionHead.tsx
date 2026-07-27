import { FONT } from './gamingLightTokens';

// Canonical section header for the Discover Almanac page.
// One implementation. Light + dark surfaces. Optional right-aligned meta.
// Kicker:   10px 700 letterSpacing 0.16em uppercase, deep amber.
// Title:    17px 700 letterSpacing -0.02em.
// Meta:     "View all ›" 12.5px 700 deep amber, baseline-aligned with the title.

const AMBER_DEEP = '#B45309';
const OVERLINE_LIGHT = AMBER_DEEP;
const OVERLINE_DARK = '#F7931E';
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
