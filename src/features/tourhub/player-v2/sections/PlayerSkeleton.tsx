/**
 * PlayerSkeleton — matches the P1 anatomy: dark hero block + section
 * bones. No shimmer, no framer-motion — a flat static loading state.
 */

import { HAIRLINE_INK_8, INK_TINT_06, SLATE_50, SURFACE, WHITE_ALPHA_08 } from '../../_shared/tokens';

function Bone({ w, h, radius = 6, dark = false }: { w: number | string; h: number; radius?: number; dark?: boolean }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: dark ? WHITE_ALPHA_08 : INK_TINT_06,
      }}
    />
  );
}

export function PlayerSkeleton() {
  return (
    <div style={{ background: SLATE_50, minHeight: '100vh' }}>
      {/* Hero bone */}
      <div
        style={{
          background: 'linear-gradient(180deg, #2a3542 0%, #0a0e14 100%)',
          paddingTop: 'calc(var(--chrome-total-h, 0px) + 8px)',
          paddingBottom: 16,
        }}
      >
        <div style={{ padding: '10px 16px 0', display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ width: 74, height: 74, borderRadius: '34%', background: WHITE_ALPHA_08 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bone w={100} h={10} dark />
            <Bone w={180} h={22} dark />
            <Bone w={140} h={12} dark />
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
