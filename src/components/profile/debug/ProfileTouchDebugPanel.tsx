import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useProfileTouchDebug } from './ProfileTouchDebugProvider';

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts);
  }
}

export function ProfileTouchDebugPanel({ className }: { className?: string }) {
  const dbg = useProfileTouchDebug();
  const [open, setOpen] = useState(true);

  const locationStr = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.pathname}${window.location.search}`;
  }, []);

  if (!dbg.enabled) return null;

  return (
    <div
      className={cn(
        'fixed bottom-3 left-3 z-[9999] pointer-events-auto',
        className
      )}
      data-debug-id="profile-debug-panel"
    >
      <div className="rounded-sq-lg border border-border bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-foreground">Profile Touch Debug</div>
            <div className="text-[11px] text-muted-foreground truncate max-w-[280px]">{locationStr}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-[11px] px-2 py-1 rounded-sq-md border border-border bg-background hover:bg-muted"
              onClick={() => dbg.clear()}
            >
              Clear
            </button>
            <button
              type="button"
              className="text-[11px] px-2 py-1 rounded-sq-md border border-border bg-background hover:bg-muted"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {open && (
          <div className="p-3 w-[320px] max-w-[calc(100vw-24px)]">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-sq-md border border-border p-2">
                <div className="text-[11px] text-muted-foreground">Tabs row</div>
                <div className="text-sm font-semibold text-foreground">
                  {(dbg.state.points['tabs_row.pointerdown'] ?? 0) + (dbg.state.points['tabs_row.click'] ?? 0)}
                </div>
              </div>
              <div className="rounded-sq-md border border-border p-2">
                <div className="text-[11px] text-muted-foreground">Profile photo</div>
                <div className="text-sm font-semibold text-foreground">
                  {(dbg.state.points['profile_photo.pointerdown'] ?? 0) + (dbg.state.points['profile_photo.click'] ?? 0)}
                </div>
              </div>
              <div className="rounded-sq-md border border-border p-2">
                <div className="text-[11px] text-muted-foreground">Achievements CTA</div>
                <div className="text-sm font-semibold text-foreground">
                  {(dbg.state.points['achievements.view_all.pointerdown'] ?? 0) + (dbg.state.points['achievements.view_all.click'] ?? 0)}
                </div>
              </div>
              <div className="rounded-sq-md border border-border p-2">
                <div className="text-[11px] text-muted-foreground">Global events</div>
                <div className="text-sm font-semibold text-foreground">
                  {dbg.state.recentGlobalEvents.length}
                </div>
              </div>
            </div>

            <div className="mb-2">
              <div className="text-xs font-semibold text-foreground mb-1">Latest global events (capture phase)</div>
              <div className="max-h-[160px] overflow-auto rounded-sq-md border border-border">
                {dbg.state.recentGlobalEvents.length === 0 ? (
                  <div className="p-2 text-[11px] text-muted-foreground">No events yet — try tapping anywhere.</div>
                ) : (
                  <ul className="divide-y divide-border">
                    {dbg.state.recentGlobalEvents.slice(0, 10).map((e, idx) => (
                      <li key={idx} className="p-2 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{e.eventType}</span>
                          <span className="text-muted-foreground">{formatTime(e.ts)}</span>
                        </div>
                        <div className="text-muted-foreground">target: {e.target}</div>
                        {e.elementFromPoint && (
                          <div className="text-muted-foreground">top: {e.elementFromPoint}</div>
                        )}
                        {e.x != null && e.y != null && (
                          <div className="text-muted-foreground">x,y: {e.x},{e.y}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-foreground mb-1">Latest point logs</div>
              <div className="max-h-[120px] overflow-auto rounded-sq-md border border-border">
                {dbg.state.recentPoints.length === 0 ? (
                  <div className="p-2 text-[11px] text-muted-foreground">No point logs yet.</div>
                ) : (
                  <ul className="divide-y divide-border">
                    {dbg.state.recentPoints.slice(0, 10).map((p, idx) => (
                      <li key={idx} className="p-2 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{p.name}</span>
                          <span className="text-muted-foreground">{formatTime(p.ts)}</span>
                        </div>
                        {p.detail && (
                          <pre className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
                            {JSON.stringify(p.detail, null, 0)}
                          </pre>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-2 text-[11px] text-muted-foreground">
              Tip: add <span className="font-mono">?touchDebug=1</span> to the URL to enable, <span className="font-mono">?touchDebug=0</span> to disable.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
