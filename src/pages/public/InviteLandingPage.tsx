import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PublicLanding } from './JoinLandingPage';
import { FALLBACK_STORE_URL, fetchStoreLinks, pickStoreUrl } from '@/lib/storeLinks';

const FALLBACK_URL = FALLBACK_STORE_URL;

/* Shared storeLinks helpers (BRIEF_ADMIN_SETTINGS S.11). Android without a
   Play link keeps today's App Store target, so nothing breaks before the
   link is added. */
async function fetchDownloadUrl(): Promise<string> {
  try {
    const links = await fetchStoreLinks();
    return pickStoreUrl(links, navigator.userAgent) ?? links.appStore ?? FALLBACK_URL;
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
      inviteRef={inviteCode}
      eyebrow="you've been invited"
      eyebrowNote="A friend invited you to clbhouz. Discover courses, follow the tours, and compare rounds."
    />
  );
}
