/**
 * clbhouz — web download gate, splash language.
 *
 * The web never mounts the app shell. Every gated path lands here on the
 * same dark canvas the app holds on cold start (#15171F), so a member who
 * taps a link and then installs sees one continuous frame.
 *
 * Three bands: brand, copy, store. Nothing else — no artefact, no figures.
 *
 * The three path states (see gateRoutes.ts) only change the copy:
 *   invite   /i/:code, /join      — names the inviter when the RPC finds one
 *   profile  /profile/:username   — names the member
 *   none     everything else gated
 *
 * BootHold mirrors this canvas exactly; both must move together or the app
 * flashes on every launch.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { resolveGateState } from './gate/gateRoutes';
import { useGateContext } from './gate/useGateContext';
import { safeLocalStorage } from '@/utils/safeLocalStorage';

const CANVAS = '#15171F';
const INK = '#FFFFFF';
const BODY = 'rgba(255,255,255,0.66)';
const MUTE = 'rgba(255,255,255,0.42)';

const SANS =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif';
const LABEL: React.CSSProperties = {
  fontSize: 8.5,
  fontWeight: 700,
  letterSpacing: '0.17em',
  textTransform: 'uppercase',
};

const APP_STORE_URL = 'https://apps.apple.com/app/id6752538886';
const MARK = '/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png';

const AppDownloadGate: React.FC = () => {
  const location = useLocation();
  const state = React.useMemo(() => resolveGateState(location.pathname), [location.pathname]);
  const { data: ctx } = useGateContext(state);

  // Invite attribution: stash the code so a later signup can credit the
  // inviter. NOTE: nothing consumes `clbhouz_invite_ref` yet.
  React.useEffect(() => {
    if (state.kind === 'invite' && state.code) {
      safeLocalStorage.set('clbhouz_invite_ref', state.code);
    }
  }, [state]);

  const inviterFirst = ctx?.found ? (ctx.first_name || ctx.display_name || null) : null;
  const profileName = ctx?.found ? (ctx.display_name || ctx.username || null) : null;

  let head = 'the home of golf';
  let sub = 'Get the app to read every round, hole by hole.';

  if (state.kind === 'invite') {
    head = inviterFirst ? `${inviterFirst} invited you` : 'You have been invited';
    sub = 'Get the app to accept the invitation and compare every round.';
  } else if (state.kind === 'profile') {
    head = profileName ? `${profileName} on clbhouz` : 'the home of golf';
    sub = 'Get the app to read their index, their form and every course played.';
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        overflowY: 'auto',
        background: CANVAS,
        fontFamily: SANS,
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <div
        style={{
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          maxWidth: 420,
          margin: '0 auto',
          padding: '48px 24px calc(env(safe-area-inset-bottom, 0px) + 40px)',
          textAlign: 'center',
        }}
      >
        {/* band 1 — brand */}
        <img
          src={MARK}
          alt=""
          width={72}
          height={72}
          style={{ display: 'block', width: 72, height: 72 }}
          draggable={false}
        />
        <img
          src={wordmark.url}
          alt="clbhouz"
          style={{
            display: 'block',
            marginTop: 18,
            height: 26,
            width: 'auto',
            filter: 'invert(1)',
          }}
          draggable={false}
        />

        {/* band 2 — copy */}
        <h1
          style={{
            margin: '30px 0 0',
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.042em',
            lineHeight: 1.12,
            color: INK,
          }}
        >
          {head}
        </h1>
        <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.52, color: BODY 
        }}>{sub}</p>

        {/* band 3 — store */}
        <a
          href={APP_STORE_URL}
          aria-label="Download clbhouz on the App Store"
          style={{ display: 'block', marginTop: 34, lineHeight: 0 }}
        >
          <img
            src="/brand/apple-app-store-badge.svg"
            alt="Download on the App Store"
            style={{ display: 'block', height: 52, width: 'auto' }}
            draggable={false}
          />
        </a>
        <div style={{ ...LABEL, color: MUTE, marginTop: 16 }}>iPhone · Android coming</div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 30 }}>
          <Link to="/terms" style={{ ...LABEL, color: MUTE, textDecoration: 'none' }}>Terms</Link>
          <Link to="/privacy" style={{ ...LABEL, color: MUTE, textDecoration: 'none' }}>Privacy</Link>
        </div>
      </div>
    </div>
  );
};

export default AppDownloadGate;
