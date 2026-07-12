/**
 * ProfileSheetV2 · SignOutRow
 *
 * Two-tap confirm: muted "Sign out" -> crimson pill "Tap again to
 * confirm" -> onNavigate('/logout'). The opener owns the actual logout
 * side effect (PostingAsMenu.handleAccountHubNavigate maps '/logout' to
 * useLogout().logout). Confirm state auto-reverts after 4s untouched.
 */

import React, { useEffect, useRef, useState } from 'react';

const MUTED = '#94A3B8';
const CRIMSON = '#dc2626';

interface Props {
  onNavigate: (route: string) => void;
}

export default function SignOutRow({ onNavigate }: Props) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setConfirming(false), 4000);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setConfirming(false);
    onNavigate('/logout');
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '12px 0 0',
      }}
    >
      {confirming ? (
        <button
          type="button"
          onClick={handleClick}
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: CRIMSON,
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: 999,
            padding: '8px 20px',
            cursor: 'pointer',
          }}
        >
          Tap again to confirm
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: MUTED,
            background: 'transparent',
            border: 0,
            padding: '8px 12px',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      )}
    </div>
  );
}
