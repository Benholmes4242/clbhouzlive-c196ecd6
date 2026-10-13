/**
 * PlayerPageSkeleton — matches the P1 anatomy: dark hero block + section
 * bones. Canonical shimmer via the base Skeleton (dark variant on the hero band).
 *
 * Eager-imported (used as the Suspense route fallback and as the in-page
 * loading hold) so token values are inlined to keep this off the tourhub
 * chunk.
 */

import { Skeleton } from '@/components/ui/skeleton';
import { MEMBER_PANEL, PAGE_CANVAS } from '@/lib/tokens/surfaces';

const SLATE_50 = PAGE_CANVAS;
const SURFACE = MEMBER_PANEL;
const HAIRLINE_INK_8 = 'rgba(255,255,255,0.10)';

function Bone({ w, h, radius = 6, dark = false }: { w: number | string; h: number; radius?: number; dark?: boolean }) {
  return (
    <Skeleton
      variant={dark ? 'dark' : 'light'}
      style={{ width: w, height: h, borderRadius: radius }}
    />
  );
}

export function PlayerPageSkeleton() {
  return (
    <div style={{ background: SLATE_50, minHeight: '100vh' }}>
      {/* Hero bone — same anatomy as HeroSection: 268px canvas band, 80x84
          squircle pinned right and centred, bottom-aligned text column. */}
      <div style={{ position: 'relative', minHeight: 268, overflow: 'hidden', background: PAGE_CANVAS }}>
        <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
          <Skeleton variant="dark" style={{ width: 80, height: 84, borderRadius: '34%' }} />
        </div>
        <div style={{ position: 'relative', minHeight: 268, padding: '24px 16px 16px', paddingRight: 114, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxSizing: 'border-box' }}>
          <Bone w={200} h={10} dark />
          <div style={{ marginTop: 10 }}><Bone w={220} h={30} dark /></div>
          <div style={{ marginTop: 10 }}><Bone w={260} h={12} dark /></div>
          <div style={{ marginTop: 6 }}><Bone w={180} h={12} dark /></div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.18)', display: 'flex', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><Bone w={36} h={21} dark /><Bone w={48} h={10} dark /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><Bone w={36} h={21} dark /><Bone w={56} h={10} dark /></div>
          </div>
        </div>
      </div>

      {/* Season cards bone */}
      <div style={{ padding: '16px 16px 12px' }}>
        <Bone w={90} h={10} />
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 62,
                borderRadius: 12,
                background: SURFACE,
                border: `0.5px solid ${HAIRLINE_INK_8}`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Tournaments bone */}
      <div style={{ padding: '16px 16px 0', background: SURFACE }}>
        <Bone w={110} h={10} />
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 40 }}>
                <Bone w={28} h={18} />
                <div style={{ marginTop: 4 }}>
                  <Bone w={28} h={8} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <Bone w={'70%'} h={12} />
              </div>
              <Bone w={30} h={14} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
