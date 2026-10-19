/**
 * BRIEF_ADMIN_SETTINGS S.11 — clbhouz.co.uk/get. The QR code and every invite
 * link point here; this page sends each phone to the right store. It holds no
 * data and needs no session, which is why it is gate-exempt (gateRoutes.ts).
 *
 * Inside the native app there is nothing to download -> home. On a phone with
 * a store link we replace the location (no history entry). On a desktop, or
 * on Android before the Play link exists, the download gate renders. A failed
 * fetch still sends iOS to the fallback App Store link.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppDownloadGate from '@/pages/AppDownloadGate';
import { FALLBACK_STORE_URL, fetchStoreLinks, pickStoreUrl } from '@/lib/storeLinks';
import { isNativeAppSync } from '@/utils/native/isNativeApp';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';

export default function GetAppPage() {
  const navigate = useNavigate();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (isNativeAppSync()) {
      navigate('/', { replace: true });
      return;
    }
    let alive = true;
    (async () => {
      try {
        const url = pickStoreUrl(await fetchStoreLinks(), navigator.userAgent);
        if (url) {
          window.location.replace(url);
          return;
        }
      } catch {
        const fallback = pickStoreUrl({ appStore: FALLBACK_STORE_URL, play: null }, navigator.userAgent);
        if (fallback) {
          window.location.replace(fallback);
          return;
        }
      }
      if (alive) setSettled(true);
    })();
    return () => {
      alive = false;
    };
  }, [navigate]);

  // The plain PAGE_CANVAS hold used by RootGate — no logo.
  if (!settled) {
    return <div aria-hidden style={{ position: 'fixed', inset: 0, background: PAGE_CANVAS, zIndex: 2147483000 }} />;
  }
  return <AppDownloadGate />;
}
