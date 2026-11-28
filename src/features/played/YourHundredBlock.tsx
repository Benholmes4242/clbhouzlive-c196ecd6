/** Brief 50 Part C1 — "Your hundred" above The list. Counts come from
 * user_top100_progress_view for the active list (via useTop100ProgressForUser);
 * below 5 played (the 29 Jul rule) the figures and bar hide. Signed-in only. */
import React, { useState } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { TickOffSheet, listShortLabel } from './TickOffSheet';
import './played.css';

export const YOUR_HUNDRED_MIN = 5;

export function YourHundredBlock({ memberId, listSlug, played, rated, total }: {
  memberId: string | undefined; listSlug: string; played: number; rated: number; total: number;
}) {
  const [open, setOpen] = useState(false);
  if (!memberId) return null;
  const show = played >= YOUR_HUNDRED_MIN;
  const pct = (n: number) => `${total > 0 ? Math.min(100, (n / total) * 100) : 0}%`;
  return (
    <section data-your-hundred>
      <div className="pl-yh">
        <div className="pl-yh-l">
          {show ? <>
            <div className="pl-eb">YOUR HUNDRED · {listShortLabel(listSlug).toUpperCase()}</div>
            <div className="pl-yhn"><b>{played}</b> played <span className="pl-dot">·</span> <b>{rated}</b> rated</div>
          </> : <div className="pl-yhn" style={{ marginTop: 0 }}>Played any of these?</div>}
        </div>
        <button type="button" className="pl-ghost" onClick={() => { analyticsEvents.track('tick_sheet_open', { list: listSlug }); setOpen(true); }}>Tick off courses</button>
      </div>
      {show ? <div className="pl-bar" data-your-hundred-bar aria-hidden>
        <i data-p style={{ width: pct(played) }} />
        <i data-r style={{ width: pct(rated) }} />
      </div> : null}
      {open ? <TickOffSheet open onClose={() => setOpen(false)} initialList={listSlug} /> : null}
    </section>
  );
}
