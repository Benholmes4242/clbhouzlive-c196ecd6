/**
 * COMMUNITY SKELETON — flat block placeholders (Dispatch skeleton canon): no
 * shimmer, no cards. It holds the SHAPE the rebuilt page settles into —
 * featured film 16:9, the 3-up clips grid, two landscape video rows, the photo
 * mosaic, the club rail — so the first paint does not jump.
 *
 * The masthead is real from the first frame, so it is not drawn here.
 */

const BLOCK = '#EDF0F3';

function Block({ h, w = '100%', r = 8 }: { h: number; w?: number | string; r?: number }) {
  return <div style={{ height: h, width: w, borderRadius: r, background: BLOCK }} />;
}

/** Heading shell: glyph square then the 15.5px title line. */
function HeadingShell({ w = 130 }: { w?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 16px 9px' }}>
      <div style={{ width: 15, height: 15, borderRadius: 3, background: BLOCK }} />
      <Block h={14} w={w} r={2} />
    </div>
  );
}

export function CommunitySkeleton() {
  return (
    <div aria-hidden style={{ paddingBottom: 24 }}>
      {/* Featured film, 16:9 full width. */}
      <div style={{ padding: '0 16px 22px' }}>
        <div style={{ aspectRatio: '16 / 9', background: BLOCK, borderRadius: 10 }} />
      </div>

      {/* Clips: 3-up grid of verticals. */}
      <div style={{ marginBottom: 26 }}>
        <HeadingShell w={64} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            padding: '0 16px',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ aspectRatio: '9 / 16', background: BLOCK, borderRadius: 14 }} />
          ))}
        </div>
      </div>

      {/* Latest videos: landscape rows. */}
      <div style={{ marginBottom: 26 }}>
        <HeadingShell w={112} />
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 16px' }}
        >
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} style={{ aspectRatio: '16 / 9', background: BLOCK, borderRadius: 10 }} />
          ))}
        </div>
      </div>

      {/* Photos mosaic. */}
      <div style={{ marginBottom: 26 }}>
        <HeadingShell w={72} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
            padding: '0 16px',
          }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ aspectRatio: '1 / 1', background: BLOCK, borderRadius: 14 }} />
          ))}
        </div>
      </div>

      {/* Browse by club. */}
      <div>
        <HeadingShell w={120} />
        <div style={{ display: 'flex', gap: 8, paddingLeft: 16, overflow: 'hidden' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ flex: 'none', width: 118 }}>
              <Block h={118} w={118} r={12} />
              <div style={{ marginTop: 6 }}>
                <Block h={12} w={96} r={2} />
              </div>
              <div style={{ marginTop: 4 }}>
                <Block h={11} w={54} r={2} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CommunitySkeleton;
