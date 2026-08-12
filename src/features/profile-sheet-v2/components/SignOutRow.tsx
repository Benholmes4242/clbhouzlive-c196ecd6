/**
 * ProfileSheetV2 · SignOutRow
 *
 * Two-tap confirm: quiet "Sign out" -> quiet "Tap again to confirm"
 * -> onNavigate('/logout'). No red: signing out is routine and reversible,
 * and red is reserved for over par / genuinely destructive actions. The opener owns the actual logout
 * side effect (PostingAsMenu.handleAccountHubNavigate maps '/logout' to
 * useLogout().logout). Confirm state auto-reverts after 4s untouched.
 */

import React, { useEffect, useRef, useState } from 'react';

import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { LABEL as LABEL_METRICS } from '@/lib/tokens/type';

const LABEL: React.CSSProperties = { ...LABEL_METRICS, color: A.DIM };

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
            ...LABEL,
            fontFamily: SANS,
            color: A.MUTE,
            background: 'transparent',
            border: 0,
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
            ...LABEL,
            fontFamily: SANS,
            color: A.MUTE,
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
