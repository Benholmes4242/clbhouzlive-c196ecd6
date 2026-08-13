/**
 * COMMUNITY SKELETON — flat row/block placeholders (Dispatch skeleton canon):
 * no shimmer, no cards, no rounded pills beyond the chip row's own shape. It
 * holds the SHAPE the settled page takes (featured lead, three rails, the club
 * rail, the grid's first rows) so the first paint does not jump.
 *
 * The header itself is real from the first frame, so it is not drawn here — only
 * the body below it.
 */

const BLOCK = '#EDF0F3';

function Block({ h, w = '100%', r = 8 }: { h: number; w?: number | string; r?: number }) {
  return <div style={{ height: h, width: w, borderRadius: r, background: BLOCK }} />;
}

/** One rail shell: heading line then a run of true-aspect-ish tiles. */
function RailShell({ widths }: { widths: number[] }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ padding: '0 16px 9px' }}>
        <Block h={13} w={140} r={2} />
      </div>
      <div style={{ display: 'flex', gap: 6, paddingLeft: 16, overflow: 'hidden' }}>
        {widths.map((w, i) => (
          <div key={i} style={{ flex: 'none' }}>
            <Block h={200} w={w} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CommunitySkeleton() {
  return (
    <div aria-hidden style={{ paddingBottom: 24 }}>
      {/* Featured lead. */}
      <div style={{ padding: '0 16px 22px' }}>
        <Block h={320} r={10} />
      </div>

      <RailShell widths={[150, 112, 200, 150]} />
      <RailShell widths={[112, 200, 150, 112]} />
      <RailShell widths={[200, 150, 112, 200]} />

      {/* Browse by club. */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ padding: '0 16px 9px' }}>
          <Block h={13} w={120} r={2} />
        </div>
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

      {/* Everything grid. */}
      <div style={{ padding: '0 16px 9px' }}>
        <Block h={13} w={92} r={2} />
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
