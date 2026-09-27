/**
 * ProfileHandicapTab - the Handicap tab body on the member's OWN profile.
 *
 * A thin wrapper around the existing WhsHandicapTab state machine
 * (skeleton -> not connected -> connect flow -> dashboard). Nothing is copied.
 *
 * WHY THE WRAPPER EXISTS: every handicap section reads var(--hcp-*), which is
 * scoped to .hcp-dark. The profile page does not apply that class, so without
 * it the tab renders as a blank dark rectangle with invisible text. It is NOT
 * PageRoot: the profile already owns max-width, min-height and nav padding.
 *
 * No CHROME_CLEARANCE: the profile hero and tab bar already sit below the
 * islands. No horizontal padding: the sections own their 20px gutter.
 */
import React, { useEffect } from 'react';
import WhsHandicapTab from './whs/WhsHandicapTab';
import { analyticsEvents } from '@/utils/analyticsEvents';

/** Same first-name derivation the retired /handicap page used. */
export function handicapOwnerFirstName(
  displayName: string | null | undefined,
  username: string | null | undefined,
): string | null {
  const name = displayName?.trim();
  if (name) {
    if (name.includes(',')) {
      const afterComma = name.split(',')[1]?.trim();
      if (afterComma) return afterComma.split(' ')[0];
    }
    return name.split(' ')[0];
  }
  return username ?? null;
}

interface Props {
  userId: string;
  ownerFirstName?: string | null;
}

export const ProfileHandicapTab: React.FC<Props> = ({ userId, ownerFirstName = null }) => {
  useEffect(() => {
    analyticsEvents.track('handicap_page_viewed', { source: 'profile_tab', mode: 'own' });
  }, []);

  return (
    <div className="hcp-dark" style={{ background: 'var(--hcp-bg-0)', maxWidth: '100%', overflowX: 'clip' }}>
      <WhsHandicapTab userId={userId} ownerFirstName={ownerFirstName} />
    </div>
  );
};

export default ProfileHandicapTab;
