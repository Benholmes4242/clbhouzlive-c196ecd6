/**
 * clbhouz — web app download gate.
 *
 * Three states, resolved from the path (see gateRoutes.ts):
 *   invite   /i/:code, /join   — leads with WHO, makes the case with the CIRCLE
 *   profile  /profile/:username — names the member, shows the product artefact
 *   none     everything else gated
 *
 * `/post/:postId` never reaches here — PostDeepLinkPage is a real logged-out
 * preview and is strictly better than a wall. The gate is a stopgap for the
 * profile case; a public profile preview is the right destination.
 *
 * Every figure on this page is real: the circle, the index, the round and
 * course counts come from the gate RPCs; the course total is the live
 * golf_courses count. The round card is the one illustrative element and is
 * labelled as an example — the name on it belongs to no member.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { resolveGateState } from './gate/gateRoutes';
import { useGateContext, useGateCourseCount, type GateCircleMember } from './gate/useGateContext';
import { safeLocalStorage } from '@/utils/safeLocalStorage';

const SHEET = '#F8FAFC';
const PANEL = '#FFFFFF';
const INK = '#0E1216';
const BODY = '#3A424C';
const MUTE = '#68707B';
const DIM = '#A2A9B2';
const HAIR = '#E9EDF2';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C2620A';
const UNDER = '#D2222D';
const OVER = '#0F172A';
const FIELD = '#C6CFD8';

const SANS =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif';
const FIGS: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums' };
const LABEL: React.CSSProperties = {
  fontSize: 8.5,
  fontWeight: 700,
  letterSpacing: '0.17em',
  textTransform: 'uppercase',
};

const APP_STORE_URL = 'https://apps.apple.com/app/id6752538886';

const fmtIndex = (v: number | null | undefined) =>
  typeof v === 'number' ? v.toFixed(1) : '—';
const fmtInt = (v: number | null | undefined) =>
  typeof v === 'number' ? v.toLocaleString('en-GB') : '—';

/* ── the artefact: an example round, drawn with the app's own tokens ─── */
const HOLES = [0, -1, 0, 0, 1, -1, 0, 0, 0, -1, 0, 1, 0, 0, -1, 0, 0, 0];
const FIELD_HOLES = [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0];
const cum = (a: number[]) =>
  a.reduce<number[]>((acc, h) => [...acc, (acc[acc.length - 1] ?? 0) + h], [0]);
const P = cum(HOLES);
const F = cum(FIELD_HOLES);

const W = 300, H = 78, PADX = 8;
const lo = Math.min(0, ...P) - 0.6;
const hi = Math.max(...P, ...F) + 0.6;
const x = (n: number) => PADX + (n / (P.length - 1)) * (W - PADX * 2);
const y = (v: number) => ((hi - v) / (hi - lo)) * H;
const ZERO = y(0);
const wentUnder = Math.min(...P) < 0;

function mono(series: number[]) {
  const pts = series.map((v, n) => [x(n), y(v)] as [number, number]);
  const n = pts.length;
  const dx: number[] = [], dy: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    dy[i] = pts[i + 1][1] - pts[i][1];
    m[i] = dy[i] / dx[i];
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) { t[i] = 0; continue; }
    const w1 = 2 * dx[i] + dx[i - 1], w2 = dx[i] + 2 * dx[i - 1];
    t[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i]);
  }
  t[n - 1] = m[n - 2];
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const c = dx[i] / 3;
    d += ` C${(pts[i][0] + c).toFixed(1)},${(pts[i][1] + t[i] * c).toFixed(1)}`
      + ` ${(pts[i + 1][0] - c).toFixed(1)},${(pts[i + 1][1] - t[i + 1] * c).toFixed(1)}`
      + ` ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}
const PPATH = mono(P), FPATH = mono(F);
const AREA = `${PPATH} L${x(P.length - 1).toFixed(1)},${ZERO.toFixed(1)} L${x(0).toFixed(1)},${ZERO.toFixed(1)} Z`;

const RoundCard: React.FC = () => (
  <div style={{
    background: PANEL, borderRadius: 20, overflow: 'hidden',
    border: `1px solid ${HAIR}`, boxShadow: '0 18px 44px -22px rgba(14,18,22,0.30)',
  }}>
    <div style={{ position: 'relative', height: 108, background: 'linear-gradient(150deg,#8CA3B6 0%,#55697C 55%,#31414F 100%)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,10,14,0.82) 0%, rgba(6,10,14,0.14) 54%, rgba(6,10,14,0) 100%)' }} />
      <div style={{ position: 'absolute', top: 10, left: 13 }}>
        <span style={{ ...LABEL, fontSize: 7.5, color: 'rgba(255,255,255,0.62)' }}>Example round</span>
      </div>
      <div style={{ position: 'absolute', left: 13, right: 13, bottom: 10 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'baseline', gap: 7, padding: '6px 11px', borderRadius: 11,
          background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)',
          backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        }}>
          <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.05em', color: '#FFF', lineHeight: 1, ...FIGS }}>68</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.92)', ...FIGS }}>−2</span>
          <span style={{ ...LABEL, fontSize: 7.5, color: 'rgba(255,255,255,0.66)' }}>Par 70</span>
        </div>
        <div style={{
          color: '#FFF', fontSize: 12.5, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 7,
          textShadow: '0 1px 8px rgba(0,0,0,0.5)',
        }}>Broadstone Golf Club</div>
      </div>
    </div>

    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <clipPath id="gateAb"><rect x="0" y="0" width={W} height={Math.max(ZERO, 0)} /></clipPath>
        <clipPath id="gateBe"><rect x="0" y={ZERO} width={W} height={Math.max(H - ZERO, 0)} /></clipPath>
        <linearGradient id="gateFo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={OVER} stopOpacity="0.22" /><stop offset="100%" stopColor={OVER} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="gateFu" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={UNDER} stopOpacity="0.28" /><stop offset="100%" stopColor={UNDER} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={AREA} fill="url(#gateFo)" clipPath="url(#gateAb)" />
      {wentUnder && <path d={AREA} fill="url(#gateFu)" clipPath="url(#gateBe)" />}
      {wentUnder && <line x1="0" y1={ZERO} x2={W} y2={ZERO} stroke={DIM} strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />}
      <path d={FPATH} fill="none" stroke={FIELD} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <path d={PPATH} fill="none" stroke="#FFF" strokeWidth="5.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />
      <path d={PPATH} fill="none" stroke={OVER} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" clipPath="url(#gateAb)" />
      {wentUnder && <path d={PPATH} fill="none" stroke={UNDER} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" clipPath="url(#gateBe)" />}
      {HOLES.map((v, n) => (v < 0 ? <circle key={n} cx={x(n + 1)} cy={y(P[n + 1])} r="3.4" fill={UNDER} stroke="#FFF" strokeWidth="1.5" /> : null))}
    </svg>

    <div style={{ display: 'flex', gap: 12, padding: '7px 13px 0' }}>
      <span style={{ ...LABEL, color: UNDER }}>● 4 birdies</span>
      <span style={{ ...LABEL, color: DIM, marginLeft: 'auto' }}>vs field avg</span>
    </div>
    <div style={{ padding: '9px 13px 13px' }}>
      <div style={{ fontSize: 12, color: BODY, lineHeight: 1.4 }}>
        Three under through fifteen, one dropped coming home
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 10, paddingTop: 10, borderTop: `1px solid ${HAIR}`,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>Sam Fairway</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: AMBER, fontSize: 12, fontWeight: 700, ...FIGS }}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill={AMBER}>
            <path d="M12 21s-7.5-4.6-9.6-9A5.4 5.4 0 0 1 12 6.3a5.4 5.4 0 0 1 9.6 5.7C19.5 16.4 12 21 12 21z" />
          </svg>2
        </span>
      </div>
    </div>
  </div>
);

const initials = (name: string) =>
  name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

/* ── the invite artefact: the CIRCLE, not a single round ────────────── */
const CircleCard: React.FC<{ title: string; members: GateCircleMember[] }> = ({ title, members }) => (
  <div style={{
    background: PANEL, borderRadius: 20, overflow: 'hidden',
    border: `1px solid ${HAIR}`, boxShadow: '0 18px 44px -22px rgba(14,18,22,0.30)',
    padding: '15px 16px 16px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <span style={{ ...LABEL, color: INK, fontSize: 9.5, letterSpacing: '0.19em' }}>{title}</span>
      <span style={{ ...LABEL, color: DIM }}>Handicap index</span>
    </div>

    {members.map((m, n) => (
      <div key={`${m.name}-${n}`} style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '11px 0', borderBottom: `1px solid ${HAIR}`,
      }}>
        <span style={{
          width: 30, height: 30, borderRadius: 11, flex: '0 0 30px',
          background: n === 0 ? INK : '#E7EBF0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: n === 0 ? '#FFF' : MUTE,
        }}>{initials(m.name)}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: INK, display: 'block' }}>{m.name}</span>
          <span style={{ ...LABEL, color: DIM, fontSize: 8, marginTop: 3, display: 'block', ...FIGS }}>
            {fmtInt(m.rounds)} rounds
          </span>
        </span>
        <span style={{ fontSize: 17, fontWeight: 700, color: INK, letterSpacing: '-0.035em', ...FIGS }}>
          {fmtIndex(m.handicap_index)}
        </span>
      </div>
    ))}

    {/* the empty seat — the entire pitch in one row */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 0 0' }}>
      <span style={{
        width: 30, height: 30, borderRadius: 11, flex: '0 0 30px',
        border: `1.5px dashed ${DIM}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke={AMBER_DEEP} strokeWidth="2.4">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: AMBER_DEEP, display: 'block' }}>You</span>
        <span style={{ ...LABEL, color: DIM, fontSize: 8, marginTop: 3, display: 'block' }}>
          Connect your handicap
        </span>
      </span>
      <span style={{ fontSize: 17, fontWeight: 700, color: '#D4DAE1', letterSpacing: '-0.035em' }}>—</span>
    </div>
  </div>
);

/* ── the profile artefact: the member's own measured figures ───────── */
const ProfileCard: React.FC<{
  name: string; index: number | null | undefined; rounds?: number; courses?: number;
}> = ({ name, index, rounds, courses }) => (
  <div style={{
    background: PANEL, borderRadius: 20, overflow: 'hidden',
    border: `1px solid ${HAIR}`, boxShadow: '0 18px 44px -22px rgba(14,18,22,0.30)',
    padding: '16px 16px 6px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{
        width: 40, height: 40, borderRadius: 14, flex: '0 0 40px', background: INK,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color: '#FFF',
      }}>{initials(name)}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: INK, letterSpacing: '-0.02em', display: 'block' }}>{name}</span>
        <span style={{ ...LABEL, color: DIM, fontSize: 8, marginTop: 4, display: 'block' }}>On clbhouz</span>
      </span>
    </div>

    <div style={{ display: 'flex', marginTop: 16, borderTop: `1px solid ${HAIR}` }}>
      {[
        [typeof index === 'number' ? fmtIndex(index) : '—', 'Index'],
        [fmtInt(rounds), 'Rounds'],
        [fmtInt(courses), 'Courses'],
      ].map(([v, l], i) => (
        <div key={l} style={{
          flex: 1, padding: '14px 0 16px', textAlign: 'center',
          borderLeft: i === 0 ? 'none' : `1px solid ${HAIR}`,
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: INK, letterSpacing: '-0.04em', ...FIGS }}>{v}</div>
          <div style={{ ...LABEL, color: DIM, fontSize: 8, marginTop: 5 }}>{l}</div>
        </div>
      ))}
    </div>
  </div>
);

const AppDownloadGate: React.FC = () => {
  const location = useLocation();
  const state = React.useMemo(() => resolveGateState(location.pathname), [location.pathname]);
  const { data: ctx } = useGateContext(state);
  const { data: courseCount } = useGateCourseCount();

  // Invite attribution: stash the code so a later signup can credit the
  // inviter. NOTE: nothing consumes `clbhouz_invite_ref` yet.
  React.useEffect(() => {
    if (state.kind === 'invite' && state.code) {
      safeLocalStorage.set('clbhouz_invite_ref', state.code);
    }
  }, [state]);

  const inviterFirst = ctx?.found ? (ctx.first_name || ctx.display_name || null) : null;
  const profileName = ctx?.found ? (ctx.display_name || ctx.username || null) : null;
  const circle = (ctx?.circle ?? []).filter((m) => !!m?.name);

  let eyebrow: string;
  let head: string;
  let sub: string;
  let cta: string;
  let artefact: React.ReactNode;

  if (state.kind === 'invite') {
    eyebrow = 'You have been invited';
    head = inviterFirst ? `${inviterFirst} invited you to clbhouz` : 'You have been invited to clbhouz';
    sub = inviterFirst && typeof ctx?.rounds === 'number'
      ? `${inviterFirst} has tracked ${fmtInt(ctx.rounds)} rounds. See how your game measures up.`
      : 'A friend brought you in. Connect your handicap and compare every round.';
    cta = inviterFirst ? `Join ${inviterFirst}'s circle — free` : 'Get clbhouz — free';
    artefact = circle.length
      ? <CircleCard title={inviterFirst ? `${inviterFirst}'s circle` : 'Their circle'} members={circle} />
      : <RoundCard />;
  } else if (state.kind === 'profile') {
    eyebrow = 'Shared with you';
    head = profileName ? `${profileName} on clbhouz` : 'A profile on clbhouz';
    sub = profileName && typeof ctx?.rounds === 'number'
      ? `${fmtInt(ctx.rounds)} rounds across ${fmtInt(ctx.courses)} courses, read hole by hole.`
      : 'Their index, their form, and every course they have played.';
    cta = 'Get clbhouz — free';
    artefact = profileName
      ? <ProfileCard name={profileName} index={ctx?.handicap_index} rounds={ctx?.rounds} courses={ctx?.courses} />
      : <RoundCard />;
  } else {
    eyebrow = 'Golf analytics';
    head = 'Golf, measured properly';
    sub = 'Every round you have ever posted, read hole by hole.';
    cta = 'Get clbhouz — free';
    artefact = <RoundCard />;
  }

  const proof: [string, string][] = [
    [courseCount ? fmtInt(courseCount) : '—', 'Courses'],
    ['Hole', 'By hole'],
    ['WHS', 'Synced'],
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2147483000, overflowY: 'auto',
      background: SHEET, fontFamily: SANS, WebkitFontSmoothing: 'antialiased',
    }}>
      <div style={{ maxWidth: 400, margin: '0 auto', padding: '34px 20px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 30 }}>
          <img
            src="/brand/clbhouz-mark-amber.png"
            alt=""
            style={{ width: 30, height: 30, borderRadius: 10, display: 'block' }}
            draggable={false}
          />
          <span style={{ fontSize: 17, fontWeight: 700, color: INK, letterSpacing: '-0.03em' }}>clbhouz</span>
        </div>

        <div style={{ ...LABEL, color: AMBER_DEEP, marginBottom: 11 }}>{eyebrow}</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.042em', lineHeight: 1.08, color: INK, margin: 0 }}>
          {head}
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.52, color: BODY, margin: '13px 0 24px' }}>{sub}</p>

        {artefact}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {proof.map(([v, l]) => (
            <div key={l} style={{
              flex: 1, background: PANEL, border: `1px solid ${HAIR}`, borderRadius: 14,
              padding: '13px 10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: INK, letterSpacing: '-0.03em', ...FIGS }}>{v}</div>
              <div style={{ ...LABEL, color: DIM, fontSize: 8, marginTop: 5 }}>{l}</div>
            </div>
          ))}
        </div>

        <a
          href={APP_STORE_URL}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', height: 56, marginTop: 24, borderRadius: 16,
            background: INK, color: '#FFF', fontSize: 16, fontWeight: 700,
            letterSpacing: '-0.02em', textDecoration: 'none',
          }}
        >
          {cta}
        </a>
        <div style={{ ...LABEL, color: DIM, textAlign: 'center', marginTop: 13, fontSize: 8 }}>
          iPhone · Android coming
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 26 }}>
          <Link to="/terms" style={{ ...LABEL, color: MUTE, fontSize: 8, textDecoration: 'none' }}>Terms</Link>
          <Link to="/privacy" style={{ ...LABEL, color: MUTE, fontSize: 8, textDecoration: 'none' }}>Privacy</Link>
        </div>
      </div>
    </div>
  );
};

export default AppDownloadGate;
