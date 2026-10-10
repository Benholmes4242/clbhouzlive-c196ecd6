import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PAGE_CANVAS, inkWithAlpha } from '@/lib/tokens/surfaces';
import wordmark from '@/assets/clbhouz-wordmark.png.asset.json';

const AMBER = '#F7931E';
const INK = '#F8FAFC';
const INK_62 = inkWithAlpha(INK, 0.62);
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const FALLBACK_URL = 'https://apps.apple.com/app/id6752538886';
const MARK = '/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png';
// Until Ben supplies public/join/screen-feed.png, the frame shows the OG card.
const SCREEN = '/og-card-v2.png';

async function fetchDownloadUrl(): Promise<string> {
  try {
    const { data } = await supabase
      .from('app_config' as any)
      .select('value')
      .eq('key', 'app_download_url')
      .maybeSingle();
    const val = (data as any)?.value;
    if (typeof val === 'string' && val.startsWith('http')) return val;
    if (val && typeof val === 'object' && typeof val.url === 'string') return val.url;
  } catch {
    // fall through
  }
  return FALLBACK_URL;
}

export default function JoinLandingPage() {
  const [params] = useSearchParams();
  const [href, setHref] = useState<string>(FALLBACK_URL);
  const ref = params.get('ref');

  useEffect(() => {
    document.title = 'Join clbhouz | stay in play.';
    if (ref) {
      try {
        localStorage.setItem('clbhouz_invite_ref', ref);
      } catch {
        // ignore
      }
    }
    fetchDownloadUrl().then(setHref);
  }, [ref]);

  return <PublicLanding href={href} inviteRef={ref ?? undefined} />;
}

const REASONS: Array<[string, string]> = [
  ['Nothing to type in', 'Connect your England Golf handicap and every round arrives by itself.'],
  ['Records to chase', 'Course records, leaderboards and the Top 100, against the golfers you play with.'],
  ['23,000 courses, measured from real rounds', 'How each one plays, hole by hole, and what the golfers who played it made of it.'],
];

function GetApp({ href, style }: { href: string; style?: React.CSSProperties }) {
  return (
    <a
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 56,
        borderRadius: 28,
        background: AMBER,
        color: PAGE_CANVAS,
        fontSize: 17,
        fontWeight: 700,
        textDecoration: 'none',
        ...style,
      }}
    >
      Get the app
    </a>
  );
}

export function PublicLanding({
  href,
  eyebrow,
  eyebrowNote,
  inviteRef,
}: {
  href: string;
  eyebrow?: string;
  eyebrowNote?: string;
  inviteRef?: string;
}) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!inviteRef) return;
    let live = true;
    (supabase.rpc as any)('get_inviter_first_name', { p_ref: inviteRef })
      .then(({ data }: { data: unknown }) => {
        if (live && typeof data === 'string' && data.trim()) setName(data.trim());
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [inviteRef]);

  const fallbackLine = eyebrow ?? eyebrowNote;
  const showLine = !!name || !!fallbackLine;

  return (
    <div style={{ minHeight: '100dvh', background: PAGE_CANVAS, color: INK, fontFamily: FONT, overflowX: 'hidden' }}>
      <div
        style={{
          maxWidth: 390,
          margin: '0 auto',
          padding: '56px 24px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <img src={wordmark.url} alt="clbhouz" width={118} style={{ display: 'block', width: 118, height: 'auto', filter: 'invert(1)' }} />

        {showLine && (
          <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            {name && (
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#1E1E23',
                  border: `1px solid ${inkWithAlpha(INK, 0.12)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: inkWithAlpha(INK, 0.72),
                }}
              >
                {name.charAt(0).toUpperCase()}
              </span>
            )}
            {name ? (
              <span>
                <span style={{ color: INK, fontWeight: 600 }}>{name}</span>
                <span style={{ color: INK_62 }}> invited you</span>
              </span>
            ) : (
              <span style={{ color: INK_62 }}>{fallbackLine}</span>
            )}
          </div>
        )}

        <h1
          style={{
            margin: `${showLine ? 18 : 40}px 0 0`,
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            textWrap: 'balance' as any,
          }}
        >
          Every round you play, scored hole by hole.
        </h1>
        <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.5, color: INK_62, maxWidth: 320 }}>
          Connect your official handicap once. Your rounds arrive on their own, measured against the course you played them on.
        </p>

        <GetApp href={href} style={{ marginTop: 26 }} />
        <div style={{ marginTop: 10, fontSize: 12, color: inkWithAlpha(INK, 0.42) }}>Free on the App Store</div>

        <div style={{ position: 'relative', marginTop: 36, width: 300, height: 440 }}>
          <img
            src={MARK}
            alt=""
            aria-hidden
            width={520}
            height={520}
            loading="eager"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 520,
              height: 520,
              maxWidth: 'none',
              transform: 'translate(-50%, -46%)',
              opacity: 0.1,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'relative',
              width: 300,
              height: 440,
              borderRadius: 36,
              border: `1px solid ${inkWithAlpha(INK, 0.14)}`,
              overflow: 'hidden',
              boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
              background: PAGE_CANVAS,
            }}
          >
            <img
              src={SCREEN}
              alt="The clbhouz feed"
              width={300}
              height={440}
              loading="eager"
              {...({ fetchpriority: 'high' } as any)}
              style={{ display: 'block', width: 300, height: 'auto' }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 120,
                background: `linear-gradient(to bottom, ${inkWithAlpha(PAGE_CANVAS, 0)}, ${PAGE_CANVAS})`,
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 36, width: '100%', borderTop: `1px solid ${inkWithAlpha(INK, 0.08)}`, textAlign: 'left' }}>
          {REASONS.map(([title, body]) => (
            <div
              key={title}
              style={{
                display: 'flex',
                gap: 14,
                padding: '16px 2px',
                borderBottom: `1px solid ${inkWithAlpha(INK, 0.08)}`,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: AMBER, marginTop: 7, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
                <div style={{ fontSize: 13, lineHeight: 1.45, color: INK_62 }}>{body}</div>
              </div>
            </div>
          ))}
        </div>

        <GetApp href={href} style={{ marginTop: 28 }} />

        <div style={{ marginTop: 44, fontSize: 15, fontWeight: 600 }}>
          stay in play<span style={{ color: AMBER }}>.</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: inkWithAlpha(INK, 0.35) }}>clbhouz.co.uk</div>
      </div>
    </div>
  );
}
