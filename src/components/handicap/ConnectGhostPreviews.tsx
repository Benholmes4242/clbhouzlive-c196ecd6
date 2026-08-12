/**
 * ConnectGhostPreviews — lightweight visual approximations of the sections
 * the user would unlock. Rendered blurred inside ConnectGhostPrompt (aria-hidden).
 *
 * These do not import the real feature components — the ghost only needs to
 * convey shape and hierarchy through the blur. Faked numbers are deliberate
 * and MUST be treated as decorative (parent sets aria-hidden).
 */
import React from 'react';

const INK = '#0F172A';
const INK_60 = '#64748B';
const INK_45 = '#94A3B8';
const AMBER = '#F7931E';
const RED = '#DC2626';
const GREEN = '#16A34A';
const WARN = '#F59E0B';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const Ring: React.FC<{ pct: number; color: string; label: string }> = ({ pct, color, label }) => {
  const r = 34;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: FONT }}>
      <div style={{ position: 'relative', width: 84, height: 84 }}>
        <svg width={84} height={84}>
          <circle cx={42} cy={42} r={r} stroke="rgba(15,23,42,0.10)" strokeWidth={7} fill="none" />
          <circle
            cx={42} cy={42} r={r}
            stroke={color} strokeWidth={7} fill="none" strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            transform="rotate(-90 42 42)"
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 700, color: INK }}>
          {pct}%
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK_60 }}>
        {label}
      </div>
    </div>
  );
};

/** Holes: scoring breakdown - "+8.5 over par" + 3 leak rows + 3 rings. */
export const HolesGhost: React.FC = () => (
  <div style={{ fontFamily: FONT }}>
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_60 }}>
      Your scoring breakdown
    </div>
    <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700, color: INK, letterSpacing: '-0.02em' }}>
      +8.5 shots over par in an average round
    </div>
    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[
        { hole: 18, over: '+1.4' },
        { hole: 7, over: '+1.2' },
        { hole: 15, over: '+0.9' },
      ].map((r) => (
        <div key={r.hole} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 44, fontSize: 12, fontWeight: 700, color: INK }}>Hole {r.hole}</div>
          <div style={{ flex: 1, height: 8, background: 'rgba(15,23,42,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${60 + r.hole % 20}%`, height: '100%', background: RED, borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: RED, minWidth: 32, textAlign: 'right' }}>{r.over}</div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-around' }}>
      <Ring pct={57} color={GREEN} label="Par or better" />
      <Ring pct={33} color={WARN} label="Bogey" />
      <Ring pct={10} color={RED} label="Double+" />
    </div>
  </div>
);

/** About: 4-row comparison — You, Members, Friends, Course record. */
export const AboutGhost: React.FC = () => {
  const rows = [
    { label: 'You', value: 82, pct: 78, color: AMBER, ink: AMBER },
    { label: 'Members', value: 84, pct: 72, color: 'rgba(15,23,42,0.35)', ink: INK },
    { label: 'Friends', value: 79, pct: 86, color: 'rgba(15,23,42,0.35)', ink: INK },
    { label: 'Course record', value: 62, pct: 100, color: 'rgba(15,23,42,0.35)', ink: INK },
  ];
  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_60 }}>
        How you compare here
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((r) => (
          <div key={r.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: r.ink }}>{r.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: r.ink, fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(15,23,42,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${r.pct}%`, height: '100%', background: r.color, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Profile: index card (amber squircle + big number + trendline + 3 stat tiles). */
export const ProfileGhost: React.FC = () => (
  <div style={{ fontFamily: FONT }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 66, height: 66, borderRadius: 22,
          background: `linear-gradient(135deg, ${AMBER} 0%, #E07F0E 100%)`,
          color: '#FFF', display: 'grid', placeItems: 'center',
          fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em',
        }}
      >
        12.4
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK_60 }}>
          Handicap Index
        </div>
        <div style={{ fontSize: 44, fontWeight: 300, color: INK, letterSpacing: '-0.03em', lineHeight: 1 }}>
          12.4
        </div>
      </div>
    </div>
    <svg viewBox="0 0 240 40" width="100%" height={40} style={{ marginTop: 10 }}>
      <polyline
        points="0,28 30,22 60,26 90,18 120,20 150,14 180,16 210,10 240,12"
        fill="none" stroke={GREEN} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {[
        { k: 'Rounds', v: '42' },
        { k: 'Courses', v: '11' },
        { k: 'Best', v: '76' },
      ].map((t) => (
        <div key={t.k} style={{ border: `1px solid ${HAIRLINE}`, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: INK }}>{t.v}</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK_60, marginTop: 2 }}>
            {t.k}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Champions: Crown Cabinet with 7 empty (dashed) slots + 0/7 chip. */
export const ChampionsGhost: React.FC = () => {
  const crowns = ['Birdie', 'Rounds', 'Gross', 'Stableford', 'Ace', 'Eagle', 'Streak'];
  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_60 }}>
          Crown cabinet
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 999, background: 'rgba(15,23,42,0.06)', color: INK_60 }}>
          0 / 7
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {crowns.map((c) => (
          <div
            key={c}
            style={{
              aspectRatio: '1 / 1',
              border: `1.5px dashed rgba(15,23,42,0.18)`,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 4,
              color: INK_45,
            }}
          >
            <div style={{ fontSize: 20 }}>♛</div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em' }}>{c}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
