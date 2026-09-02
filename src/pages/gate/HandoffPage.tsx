/**
 * clbhouz — /go/:target. BRIEF_EMAIL_HANDOFF_PAGE.
 *
 * WHY THIS ROUTE EXISTS. Emails reach a member away from their phone. Sending
 * them at /handicap lands them on the download gate, which drops the
 * destination. /handicap must NOT be gate-exempt — it is a signed-in surface
 * and exempting it would put it on the open web. So the email points at a
 * doormat instead: /go/ holds no data, is exempt by design, and keeps hold of
 * where the member was going.
 *
 * :target IS A SHORT KEY, NEVER A PATH. Only the three keys in TARGETS
 * resolve; anything else falls back to the app root. This page is deliberately
 * reachable with no session, so accepting an arbitrary path or a full URL in
 * the segment would make it an open redirect. Query params pass through so
 * ?src=nudge_whs keeps its attribution.
 *
 * IT RENDERS IMMEDIATELY. The session read is fire-and-forget; the handoff
 * paints on first frame so nothing flashes the gate first.
 */

import React from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import wordmark from '@/assets/clbhouz-wordmark.png.asset.json';

/** Gate tokens, copied deliberately: the two surfaces are one product. */
const CANVAS = '#15171F';
const INK = '#FFFFFF';
const BODY = 'rgba(255,255,255,0.66)';
const MUTE = 'rgba(255,255,255,0.42)';
const HAIR = 'rgba(255,255,255,0.10)';
const AMBER = '#F7931E';
const SANS =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif';
const LABEL: React.CSSProperties = {
  fontSize: 8.5,
  fontWeight: 700,
  letterSpacing: '0.17em',
  textTransform: 'uppercase',
};

const FALLBACK_STORE_URL = 'https://apps.apple.com/app/id6752538886';
const MARK = '/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png';

interface Target {
  route: string;
  /** i18n key + default: names the destination, never instructs. */
  headKey: string;
  head: string;
}

/** THE WHITELIST. Three keys. Nothing is derived from the URL itself. */
const TARGETS: Record<string, Target> = {
  handicap: { route: '/handicap', headKey: 'handoff.head.handicap', head: 'Connect your handicap' },
  profile: { route: '/edit-profile', headKey: 'handoff.head.profile', head: 'Finish your profile' },
  news: { route: '/news', headKey: 'handoff.head.news', head: 'Read the latest' },
};

const HandoffPage: React.FC = () => {
  const { target } = useParams<{ target: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const resolved = (target && TARGETS[target]) || null;
  const destination = `${resolved ? resolved.route : '/'}${location.search}`;

  /**
   * A session means there is nothing to hand off — arrive. Kept out of render
   * so the page never waits on the network to paint.
   */
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (alive && data.session) navigate(destination, { replace: true });
      } catch {
        // no session, or auth unreachable: the handoff below stands.
      }
    })();
    return () => {
      alive = false;
    };
  }, [destination, navigate]);

  /**
   * "Already have the app?" — a same-origin navigation to the destination.
   * On iOS, with the app installed and universal links active, the OS claims
   * this and the app opens at the right place. Without it, the visitor lands
   * on the gate, which is the honest outcome and not a broken tap. There is no
   * custom scheme in this project to try, so nothing pretends otherwise.
   */
  const openHref = destination;

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
          maxWidth: 420,
          margin: '0 auto',
          padding: '48px 24px calc(env(safe-area-inset-bottom, 0px) + 40px)',
          textAlign: 'center',
        }}
      >
        {/* band 1 — identity, mirroring the gate exactly */}
        <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
            style={{ display: 'block', marginTop: 18, height: 26, width: 'auto', filter: 'invert(1)' }}
            draggable={false}
          />
        </div>

        {/* band 2 — where they were headed */}
        <div
          style={{
            flex: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 0',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.042em',
              lineHeight: 1.14,
              color: INK,
            }}
          >
            {resolved
              ? t(resolved.headKey, { defaultValue: resolved.head })
              : t('handoff.head.default', { defaultValue: 'clbhouz' })}
          </h1>
          <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.52, color: BODY }}>
            {t('handoff.sub', {
              defaultValue: 'This lives in the clbhouz app. Open it there to pick up where you left off.',
            })}
          </p>
        </div>

        {/* band 3 — action */}
        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <a
            href={FALLBACK_STORE_URL}
            aria-label={t('gate.appStore', { defaultValue: 'Download clbhouz on the App Store' })}
            style={{ display: 'block', lineHeight: 0 }}
          >
            <img
              src="/brand/apple-app-store-badge.svg"
              alt={t('gate.appStore', { defaultValue: 'Download clbhouz on the App Store' })}
              style={{ display: 'block', height: 52, width: 'auto' }}
              draggable={false}
            />
          </a>

          <a
            href={openHref}
            style={{
              marginTop: 16,
              fontSize: 13,
              fontWeight: 700,
              color: AMBER,
              textDecoration: 'none',
              padding: '10px 4px',
            }}
          >
            {t('handoff.open', { defaultValue: 'Already have the app? Open clbhouz' })}
          </a>

          <div
            style={{
              marginTop: 22,
              paddingTop: 20,
              borderTop: `0.5px solid ${HAIR}`,
              width: '100%',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: INK,
            }}
          >
            stay in play<span style={{ color: AMBER }}>.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 20 }}>
            <Link to="/terms" style={{ ...LABEL, color: MUTE, textDecoration: 'none' }}>
              {t('gate.terms', { defaultValue: 'Terms' })}
            </Link>
            <Link to="/privacy" style={{ ...LABEL, color: MUTE, textDecoration: 'none' }}>
              {t('gate.privacy', { defaultValue: 'Privacy' })}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandoffPage;
