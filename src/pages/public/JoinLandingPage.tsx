import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AMBER = '#F7931E';
const INK = '#0F172A';
const INK_SOFT = '#475569';
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const FALLBACK_URL = 'https://clbhouz.co.uk';

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

  useEffect(() => {
    document.title = 'Join clbhouz — the home of golf courses';
    const ref = params.get('ref');
    if (ref) {
      try {
        localStorage.setItem('clbhouz_invite_ref', ref);
      } catch {
        // ignore
      }
    }
    fetchDownloadUrl().then(setHref);
  }, [params]);

  return <PublicLanding href={href} />;
}

export function PublicLanding({
  href,
  eyebrow,
  eyebrowNote,
}: {
  href: string;
  eyebrow?: string;
  eyebrowNote?: string;
}) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#F8FAFC',
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 24px 32px',
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: INK,
          letterSpacing: '-0.02em',
          marginBottom: 40,
        }}
      >
        clbhouz
      </div>

      {eyebrow && (
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 500,
            color: AMBER,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          {eyebrow}
        </div>
      )}

      <h1
        style={{
          fontSize: 24,
          fontWeight: 500,
          color: INK,
          letterSpacing: '-0.02em',
          textAlign: 'center',
          margin: 0,
          maxWidth: 360,
        }}
      >
        the home of golf courses
      </h1>

      {eyebrowNote && (
        <p
          style={{
            fontSize: 13,
            color: INK_SOFT,
            textAlign: 'center',
            margin: '14px auto 0',
            maxWidth: 320,
            lineHeight: 1.5,
          }}
        >
          {eyebrowNote}
        </p>
      )}

      <div
        style={{
          marginTop: 36,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          width: '100%',
          maxWidth: 320,
        }}
      >
        <ValueRow>Discover the world's courses</ValueRow>
        <ValueRow>Live tours</ValueRow>
        <ValueRow>Official WHS handicap sync</ValueRow>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: 40,
          background: AMBER,
          color: '#fff',
          padding: '14px 28px',
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 700,
          textDecoration: 'none',
          boxShadow: '0 6px 20px rgba(247,147,30,0.32)',
        }}
      >
        Get the app
      </a>
    </div>
  );
}

function ValueRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        border: '0.5px solid rgba(15,23,42,0.08)',
        padding: '12px 14px',
        fontSize: 12.5,
        color: INK_SOFT,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
}
