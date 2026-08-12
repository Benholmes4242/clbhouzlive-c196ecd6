import React from 'react';
import { adminTheme as t } from '../theme';
import EmptyState from './EmptyState';
import type { FunnelView } from '../hooks/useFunnels';

interface Props {
  view: FunnelView;
  loading?: boolean;
}

export default function FunnelCard({ view, loading }: Props) {
  const base = view.steps[0]?.count ?? 0;

  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.line}`,
      borderRadius: 22, boxShadow: t.shadowCard, padding: 20,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div>
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>{view.title}</div>
        <div style={{ color: t.inkMuted, fontSize: 12, marginTop: 2 }}>{view.subtitle}</div>
      </div>

      {loading ? (
        <div style={{ height: 160, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
      ) : view.isEmpty ? (
        <EmptyState title={`No ${view.title.toLowerCase()} activity in this period.`} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {view.steps.map((s, i) => {
            const pctOfBase = base > 0 ? Math.max(0, Math.min(100, (s.count / base) * 100)) : 0;
            return (
              <React.Fragment key={s.key}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{
                      color: t.ink, fontSize: 13, fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1,
                    }}>{s.label}</div>
                    <div style={{
                      color: t.ink, fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                      flexShrink: 0,
                    }}>{s.count.toLocaleString()}</div>
                  </div>
                  <div style={{
                    height: 8, background: t.canvas, borderRadius: 999, overflow: 'hidden',
                    border: `1px solid ${t.line}`,
                  }}>
                    <div style={{
                      width: `${pctOfBase}%`, height: '100%', background: t.brand,
                      borderRadius: 999, transition: 'width 240ms ease',
                    }} />
                  </div>
                </div>
                {i < view.steps.length - 1 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0 6px 0',
                  }}>
                    <span style={{
                      color: t.inkMuted, fontSize: 11.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                      textTransform: 'uppercase', letterSpacing: 0.4,
                    }}>
                      {(view.steps[i + 1]?.convFromPrev ?? 0).toFixed(1)}% continue
                    </span>
                    <span style={{
                      color: t.inkFaint, fontSize: 11, fontVariantNumeric: 'tabular-nums',
                    }}>
                      -{(view.steps[i + 1]?.dropFromPrev ?? 0).toLocaleString()} drop
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
