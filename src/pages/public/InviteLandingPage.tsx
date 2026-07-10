import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PublicLanding } from './JoinLandingPage';
import { supabase } from '@/integrations/supabase/client';

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

export default function InviteLandingPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [href, setHref] = useState<string>(FALLBACK_URL);

  useEffect(() => {
    document.title = "You've been invited to clbhouz";
    if (inviteCode) {
      try {
        localStorage.setItem('clbhouz_invite_ref', inviteCode);
      } catch {
        // ignore
      }
    }
    fetchDownloadUrl().then(setHref);
  }, [inviteCode]);

  return (
    <PublicLanding
      href={href}
      eyebrow="you've been invited"
      eyebrowNote="A friend invited you to clbhouz. Discover courses, follow the tours, and compare rounds."
    />
  );
}
