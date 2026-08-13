/**
 * COMMUNITY SKELETON — flat row/block placeholders (Dispatch skeleton canon):
 * no shimmer, no cards, no rounded pills. It holds the SHAPE the page will take
 * (lead, one rail, the grid's first rows) so the first paint does not jump.
 */

const BLOCK = '#EDF0F3';

function Block({ h, w = '100%', r = 8 }: { h: number; w?: number | string; r?: number }) {
  return <div style={{ height: h, width: w, borderRadius: r, background: BLOCK }} />;
}

export function CommunitySkeleton() {
  return (
    <div aria-hidden style={{ paddingBottom: 24 }}>
      <div style={{ padding: '0 16px 20px' }}>
        <Block h={320} />
      </div>

      <div style={{ padding: '0 16px 8px' }}>
        <Block h={10} w={120} r={2} />
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 24px', overflow: 'hidden' }}>
        {[150, 112, 200, 150].map((w, i) => (
          <div key={i} style={{ flex: 'none' }}>
            <Block h={200} w={w} />
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2,
          padding: '0 16px',
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ aspectRatio: '1 / 1', background: BLOCK, borderRadius: 4 }} />
        ))}
      </div>
    </div>
  );
}

export default CommunitySkeleton;
