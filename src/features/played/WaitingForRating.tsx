/** Brief 50 Part E1 — played-but-unrated courses on the active list. Ticks
 * first (newest), then rounds-only (most rounds). Up to ten cards; See all
 * opens a sheet with every one. Hidden at zero and signed out. */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { usePlayedCourses } from '@/hooks/played/usePlayedCourses';
import { waitingForRating, waitingSubLine } from '@/hooks/played/playedRules';
import { getOptimizedImageUrl } from '@/utils/enhancedImageOptimization';
import { analyticsEvents } from '@/utils/analyticsEvents';
import './played.css';

export interface WaitingCourse { id: string; name: string; imageUrl: string | null; rank: number | null }

const WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
export const waitingTitle = (n: number) => `You've played ${n < 10 ? WORDS[n] : n} you haven't rated`;

export function WaitingForRating({ courses, now }: { courses: Map<string, WaitingCourse>; now?: Date }) {
  const navigate = useNavigate();
  const played = usePlayedCourses();
  const [all, setAll] = useState(false);
  const list = useMemo(() => waitingForRating(played.entries, id => courses.has(id)), [played.entries, courses]);
  if (!played.userId || list.length === 0) return null;
  const rate = (id: string) => {
    analyticsEvents.track('played_rate_tap', { course_id: id, source: 'waiting_rail' });
    navigate(`/courses/${id}/rate`);
  };
  return (
    <section data-waiting-rating>
      <div className="pl-hd">
        <div style={{ minWidth: 0 }}>
          <div className="pl-eb">Waiting for your rating</div>
          <div className="pl-ti">{waitingTitle(list.length)}</div>
        </div>
        <button type="button" className="pl-lk" onClick={() => setAll(true)}>See all ›</button>
      </div>
      <div className="pl-rail">
        {list.slice(0, 10).map(e => {
          const c = courses.get(e.course_id)!;
          return (
            <div className="pl-rc" key={e.course_id} data-waiting-card={e.course_id}>
              <div className="pl-rph">
                {c.imageUrl ? <img src={getOptimizedImageUrl(c.imageUrl, { width: 400 })} alt="" loading="lazy" /> : null}
                {c.rank != null ? <span className="pl-rk">#{c.rank}</span> : null}
              </div>
              <div className="pl-rcb">
                <b>{c.name}</b>
                <small>{waitingSubLine(e, now)}</small>
                <button type="button" className="pl-solid sm" onClick={() => rate(e.course_id)}>Rate it</button>
              </div>
            </div>
          );
        })}
      </div>
      {all ? (
        <BottomSheet open onClose={() => setAll(false)} scrollBody topRadius={26} ariaLabelledBy="pl-wait-title">
          <div style={{ padding: '4px 16px 24px', color: '#F8FAFC' }} data-waiting-sheet>
            <div className="pl-eb">Waiting for your rating</div>
            <div id="pl-wait-title" className="pl-sh-ti">{waitingTitle(list.length)}</div>
            <div style={{ marginTop: 10 }}>
              {list.map(e => {
                const c = courses.get(e.course_id)!;
                return (
                  <div className="pl-wrow" key={e.course_id}>
                    <div className="pl-brn"><b>{c.name}</b><small>{waitingSubLine(e, now)}</small></div>
                    <button type="button" className="pl-solid sm" style={{ marginTop: 0 }} onClick={() => rate(e.course_id)}>Rate it</button>
                  </div>
                );
              })}
            </div>
          </div>
        </BottomSheet>
      ) : null}
    </section>
  );
}
