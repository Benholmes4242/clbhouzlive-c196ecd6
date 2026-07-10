// Per-device developer-tool preference for showing the floating admin debug
// pills (PerfToggleButton + BootTimelineToggleButton). Stored in localStorage
// so it never touches server state. The wrapper components still require
// role === 'full' — this flag alone must NEVER reveal pills to a non-admin.
import { useEffect, useState, useCallback } from 'react';

const KEY = 'clb_admin_pills_visible';
const EVT = 'clb:admin-pills-visibility';

function read(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function write(v: boolean) {
  if (typeof window === 'undefined') return;
  try {
    if (v) window.localStorage.setItem(KEY, '1');
    else window.localStorage.removeItem(KEY);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent(EVT, { detail: v }));
  } catch {}
}

export function useAdminPillVisibility(): [boolean, (v: boolean) => void] {
  const [visible, setVisible] = useState<boolean>(() => read());

  useEffect(() => {
    const onEvt = () => setVisible(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setVisible(read());
    };
    window.addEventListener(EVT, onEvt as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVT, onEvt as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const set = useCallback((v: boolean) => {
    write(v);
    setVisible(v);
  }, []);

  return [visible, set];
}
