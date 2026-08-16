/**
 * BRIEF_ECHO_CHAT §5 — THINKING, AND IT BRANCHES.
 *
 * 5.1 A DATA QUESTION names its sources as they resolve, each ticking as it
 *     lands. THE SOURCES NAMED MUST BE THE SOURCES ACTUALLY READ — a fabricated
 *     progress list is worse than a spinner, and it is what went wrong last
 *     time. The caller passes only sources it knows fired.
 *
 *     "the field's rounds" IS STRUCK. There is no field aggregate in
 *     echo_get_*, so it can never be listed here.
 *
 * 5.2 A KNOWLEDGE QUESTION NAMES NOTHING: the word "Thinking" and nothing else.
 *
 * 5.3 ONE WAVEFORM, NEVER TWO. The mark lives on <Says>, which wraps this —
 *     this component renders no wave of its own.
 */

import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { EC } from '../tokens';

export const ThinkingSources: React.FC<{ sources: string[]; thinkingLabel: string }> = ({
  sources,
  thinkingLabel,
}) => {
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

  // §5.2 nothing was opened, so nothing is claimed.
  if (sources.length === 0) {
    return <div style={{ fontSize: 13.5, color: EC.INK_3, paddingTop: 1 }}>{thinkingLabel}</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 9 }}>
      {sources.map((s, i) => {
        const resolved = i < done;
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                flex: '0 0 auto',
                display: 'grid',
                placeItems: 'center',
                // §7 ticks are ink, never amber.
                background: resolved ? EC.INK : 'transparent',
                border: resolved ? 'none' : `1.5px solid ${EC.LINE}`,
              }}
            >
              {resolved && <Check size={9} strokeWidth={3.2} color={EC.BLACK} />}
            </span>
            <span style={{ fontSize: 13.5, color: resolved ? EC.INK_2 : EC.INK_3 }}>{s}</span>
          </div>
        );
      })}
    </div>
  );
};
