/**
 * CircleInviteAction — the Circle tab's invite entry.
 *
 * BRIEF_CANONICAL_INVITE_SHEET: the tab no longer carries its own invite
 * panel. It carries ONE quiet action that opens the canonical
 * InviteFriendsSheet (mounted app-wide by InviteSheetProvider) with a source
 * identifying the handicap Circle tab.
 *
 * The invited figure stays on the tab so the action is informative rather
 * than a bare link — the same figure the canonical sheet restates in its
 * subtitle.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSentInvites } from '@/lib/whs/hooks';
import { useInviteSheet } from '@/hooks/useInviteSheet';
import { DarkSectionHeader } from '../_shared/darkAtoms';

const FONT = '"Geist", system-ui, sans-serif';

export const CircleInviteAction: React.FC = () => {
  const { t } = useTranslation('common');
  const { data: invites } = useSentInvites();
  const { openInviteSheet } = useInviteSheet();
  const sentCount = invites?.length ?? 0;

  return (
    <section id="invite-to-clbhouz-section" style={{ marginTop: 32 }}>
      <DarkSectionHeader eyebrow="INVITE FRIENDS" />

      <div style={{ padding: '0 16px' }}>
        <button
          type="button"
          onClick={() => openInviteSheet('handicap_circle')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '14px 16px',
            background: 'var(--hcp-bg-1)',
            border: '1px solid var(--hcp-line-2)',
            borderRadius: 16,
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: FONT,
          }}
        >
          <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--hcp-t-100)' }}>
              {t('invite.title')}
            </span>
            <span style={{ fontSize: 12, color: 'var(--hcp-t-60)' }}>
              {t('handicap.circle.invite.invitedCount', { count: sentCount })}
            </span>
          </span>
          <ChevronRight size={16} color="var(--hcp-t-60)" />
        </button>
      </div>
    </section>
  );
};

export default CircleInviteAction;
