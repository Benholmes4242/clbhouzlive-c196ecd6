/**
 * BRIEF_ECHO_CADDIE §5.1 — THINKING NAMES ITS SOURCES. Not a spinner.
 *
 * THE SOURCES NAMED MUST BE THE SOURCES ACTUALLY READ. A fabricated progress
 * list is worse than a spinner, so the caller passes only sources it knows the
 * request touched:
 *
 *   "Your rounds here"  — `gam_user_courses` / `get_my_hole_performance`, read
 *                         client-side for the derived panels. Only listed when
 *                         the member actually has rounds at this course.
 *   "The hole data"     — `get_my_hole_performance` returned hole rows.
 *   "Course records"    — echo_get_course_context, only when a course is in play.
 *   "This week on tour" — echo_get_tournament_context, only when the question
 *                         mentions tour/tournament/player.
 *
 * ECHO DOES NOT READ THE FIELD'S ROUNDS. There is no field aggregate in
 * `echo_get_*`, so "the field's rounds" is NEVER listed here. That line in the
 * brief's example is the one thing this state cannot honestly say.
 */

import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { EC, T } from '../tokens';
import { EchoWaveform } from './EchoWaveform';

export const ThinkingSources: React.FC<{ sources: string[] }> = ({ sources }) => {
  const [done, setDone] = useState(0);

  useEffect(() => {
    setDone(0);
    if (sources.length === 0) return;
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setDone(n);
      if (n >= sources.length) window.clearInterval(id);
    }, 520);
    return () => window.clearInterval(id);
  }, [sources.length]);

  return (
    <div className="ec-glass ec-fade-in" style={{ borderRadius: 20, padding: 20, margin: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* The one moment the mark animates. */}
        <EchoWaveform size={28} active />
        <span style={T.EYEBROW}>Reading</span>
      </div>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sources.map((s, i) => {
          const resolved = i < done;
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  display: 'grid',
                  placeItems: 'center',
                  background: resolved ? EC.INK : 'transparent',
                  border: resolved ? 'none' : `1px solid ${EC.INK_3}`,
                  flex: '0 0 auto',
                }}
              >
                {resolved && <Check size={10} strokeWidth={3} color={EC.BLACK} />}
              </span>
              <span
                style={{
                  ...T.ADVICE,
                  fontSize: 15,
                  color: resolved ? EC.INK : EC.INK_3,
                }}
              >
                {s}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
