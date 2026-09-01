/**
 * clbhouz — web download gate. BRIEF_WEB_GATE_REDESIGN.
 *
 * The web never mounts the app shell. Every gated path lands here on the
 * same dark canvas the app holds on cold start (#15171F), so a member who
 * taps a link and then installs sees one continuous frame.
 *
 * THREE BANDS DISTRIBUTED OVER THE FULL HEIGHT:
 *   band 1  identity   mark, wordmark            (top, fixed)
 *   band 2  statement  headline, support, figures (centred, flexes)
 *   band 3  action     badges, signature, legal   (bottom, fixed)
 *
 * COPY LAW:
 *   - The signature is "stay in play." with an AMBER full stop, at the foot.
 *     "the home of golf" was an earlier draft and appears nowhere.
 *   - No state opens with "Get the app to…". Support lines state, never
 *     instruct.
 *
 * FIGURE LAW:
 *   - The only figures allowed are the three from get_platform_reach() via
 *     usePlatformReach(). Nothing is ever hardcoded, nothing counted here.
 *   - THE ZERO TRAP: the hook coerces a null row to zeros, so a failed or
 *     empty RPC would tell a stranger clbhouz has 0 courses. If the query
 *     errored, or coursesTotal is 0, the WHOLE block is suppressed.
 *   - Pending is not absent: the block holds its own height in flight so the
 *     headline does not jump when the figures land.
 *
 * BootHold mirrors band 1 and this canvas exactly; both must move together or
 * the app flashes on every launch.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resolveGateState } from './gate/gateRoutes';
import { useGateContext } from './gate/useGateContext';
import { usePlatformReach } from '@/hooks/usePlatformReach';
import { supabase } from '@/integrations/supabase/client';
import { safeLocalStorage } from '@/utils/safeLocalStorage';
import { GREEN } from '@/components/manage/ui';
import wordmark from '@/assets/clbhouz-wordmark.png.asset.json';

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

/** app_config.app_download_url, https-guarded. Never a hardcoded store link. */
function useStoreUrl(): string {
  const [href, setHref] = React.useState(FALLBACK_STORE_URL);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('app_config' as any)
          .select('value')
          .eq('key', 'app_download_url')
          .maybeSingle();
        const val = (data as any)?.value;
        const url =
          typeof val === 'string'
            ? val
            : val && typeof val === 'object' && typeof val.url === 'string'
              ? val.url
              : null;
        if (alive && url && url.startsWith('https://')) setHref(url);
      } catch {
        // fallback stands
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  return href;
}

function fmt(n: number, locale: string): string {
  try {
    return n.toLocaleString(locale);
  } catch {
    return n.toLocaleString('en');
  }
}

/** One figure. A ZERO DELTA RENDERS NOTHING — no "+0", no grey dash. */
function Figure({
  total,
  delta,
  label,
  locale,
  lead = false,
}: {
  total: number;
  delta: number;
  label: string;
  locale: string;
  lead?: boolean;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
      <div
        style={{
          fontSize: lead ? 27 : 20,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          color: INK,
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {fmt(total, locale)}
      </div>
      <div
        style={{
          marginTop: 5,
          height: 12,
          fontSize: 10.5,
          fontWeight: 700,
          lineHeight: '12px',
          color: GREEN,
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {delta > 0 ? `\u25B2 +${fmt(delta, locale)}` : ''}
      </div>
      <div style={{ ...LABEL, marginTop: 7, color: MUTE }}>{label}</div>
    </div>
  );
}

const AppDownloadGate: React.FC = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation('common');
  const locale = i18n.language || 'en';
  const state = React.useMemo(() => resolveGateState(location.pathname), [location.pathname]);
  const { data: ctx } = useGateContext(state);
  const storeUrl = useStoreUrl();
  const { data: reach, isPending: reachPending, isError: reachError } = usePlatformReach();

  // Invite attribution: stash the code so a later signup can credit the
  // inviter. NOTE: nothing consumes `clbhouz_invite_ref` yet.
  React.useEffect(() => {
    if (state.kind === 'invite' && state.code) {
      safeLocalStorage.set('clbhouz_invite_ref', state.code);
    }
  }, [state]);

  const inviterFirst = ctx?.found ? (ctx.first_name || ctx.display_name || null) : null;
  const profileName = ctx?.found ? (ctx.display_name || ctx.username || null) : null;

  let headLines: string[] = [
    t('gate.head.line1', { defaultValue: 'Every round you play.' }),
    t('gate.head.line2', { defaultValue: 'Every course you visit.' }),
  ];
  let sub = t('gate.sub.default', {
    defaultValue:
      'Courses measured from the rounds actually played on them, and your golf read hole by hole against them.',
  });

  if (state.kind === 'invite') {
    headLines = [
      inviterFirst
        ? t('gate.head.invite', { name: inviterFirst, defaultValue: '{{name}} invited you' })
        : t('gate.head.inviteAnon', { defaultValue: 'You have been invited' }),
    ];
    sub = t('gate.sub.invite', {
      defaultValue: 'Every round you both play, measured on the same courses.',
    });
  } else if (state.kind === 'profile') {
    headLines = [
      profileName
        ? t('gate.head.profile', { name: profileName, defaultValue: '{{name}} on clbhouz' })
        : t('gate.head.line1', { defaultValue: 'Every round you play.' }),
    ];
    sub = t('gate.sub.profile', {
      defaultValue: 'Their index, their form, and every course they have played.',
    });
  }

  // THE ZERO TRAP. An errored or empty RPC yields zeros — suppress the block.
  const figuresUsable = !reachError && !!reach && reach.coursesTotal > 0;

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
        {/* ───────────────── band 1 — identity ───────────────── */}
        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
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
        </div>

        {/* ───────────────── band 2 — statement ───────────────── */}
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
            {headLines.map((line, i) => (
              <span key={i} style={{ display: 'block' }}>
                {line}
              </span>
            ))}
          </h1>
          <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.52, color: BODY }}>{sub}</p>

          {/* figures — pending holds height, settled-and-empty renders nothing */}
          {reachPending ? (
            <div aria-hidden style={{ height: 96, width: '100%' }} />
          ) : figuresUsable ? (
            <div style={{ width: '100%', marginTop: 34 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  paddingTop: 18,
                  borderTop: `0.5px solid ${HAIR}`,
                }}
              >
                <Figure
                  lead
                  total={reach.coursesTotal}
                  delta={reach.coursesDelta}
                  locale={locale}
                  label={t('gate.figures.courses', { defaultValue: 'Courses' })}
                />
                <Figure
                  total={reach.roundsTotal}
                  delta={reach.roundsDelta}
                  locale={locale}
                  label={t('gate.figures.rounds', { defaultValue: 'Rounds tracked' })}
                />
                <Figure
                  total={reach.reviewsTotal}
                  delta={reach.reviewsDelta}
                  locale={locale}
                  label={t('gate.figures.reviews', { defaultValue: 'Course reviews' })}
                />
              </div>
              <p style={{ margin: '14px 0 0', fontSize: 11.5, lineHeight: 1.45, color: MUTE }}>
                {t('gate.figures.note', {
                  defaultValue: 'Live from the platform. Green is the last 30 days.',
                })}
              </p>
            </div>
          ) : null}
        </div>

        {/* ───────────────── band 3 — action ───────────────── */}
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
            href={storeUrl}
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

          {/* A BADGE, NOT A LINK. No href, no tap target, no cursor. */}
          <div
            aria-disabled
            style={{
              ...LABEL,
              marginTop: 14,
              padding: '9px 14px',
              borderRadius: 8,
              border: `0.5px solid ${HAIR}`,
              color: MUTE,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {t('gate.playSoon', { defaultValue: 'Coming soon to Google Play' })}
          </div>

          {/* the signature — amber full stop */}
          <div
            style={{
              marginTop: 26,
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

export default AppDownloadGate;
