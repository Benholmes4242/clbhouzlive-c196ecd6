import React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import SheetHeader from '@/components/ui/SheetHeader';
import { formatDistanceToNow } from 'date-fns';
import { useSentInvites } from '@/lib/whs/hooks';
import { firstName } from '@/lib/whs/utils/initials';
import { shareInvite } from '@/lib/whs/share';
import type { WhsInviteStatus } from '@/lib/whs/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const T = {
  pageBg: '#F8FAFC',
  ink: 'var(--hcp-t-100)',
  inkMute: 'var(--hcp-t-60)',
  hairline: 'var(--hcp-line-2)',
  green: '#059669',
  greenTint: 'rgba(5,150,105,0.12)',
  greyTint: 'var(--hcp-bg-2)',
};
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const StatusBadge: React.FC<{ status: WhsInviteStatus['status'] }> = ({ status }) => {
  if (status === 'redeemed') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 10px',
          borderRadius: 999,
          background: T.greenTint,
          color: T.green,
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        🎉 Joined
      </span>
    );
  }
  if (status === 'expired') {
    return (
      <span
        style={{
          padding: '3px 10px',
          borderRadius: 999,
          background: T.greyTint,
          color: 'var(--hcp-t-60)',
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        Expired
      </span>
    );
  }
  return (
    <span
      style={{
        padding: '3px 10px',
        borderRadius: 999,
        background: T.greyTint,
        color: 'var(--hcp-t-60)',
        fontSize: 11,
        fontWeight: 800,
      }}
    >
      Sent
    </span>
  );
};

export const SentInvitesSheet: React.FC<Props> = ({ open, onClose }) => {
  const { data: invites, isLoading } = useSentInvites();

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(o) => !o && onClose()}
      shouldScaleBackground={false}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--hcp-t-40)',
            zIndex: 50,
          }}
        />
        <DrawerPrimitive.Content
          aria-describedby={undefined}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            maxHeight: '92vh',
            minHeight: 0,
            background: T.pageBg,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            zIndex: 51,
            outline: 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.5)',
          }}
        >
          {/* Drag handle */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 36,
              height: 4,
              borderRadius: 2,
              background: 'var(--hcp-line-3)',
            }}
          />

          <DrawerPrimitive.Title className="sr-only">Sent invites</DrawerPrimitive.Title>
          <DrawerPrimitive.Description className="sr-only">
            Tap a pending invite to share it again.
          </DrawerPrimitive.Description>

          <SheetHeader
            eyebrow="INVITES SENT"
            title="Sent invites"
            sub="Tap a pending invite to share it again."
            onClose={onClose}
            dark
          />

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              paddingBottom: 32,
            }}
          >
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{
                    height: 56,
                    margin: '0 20px 8px',
                    background: 'var(--hcp-bg-2)',
                    borderRadius: 8,
                  }}
                />
              ))
            ) : !invites || invites.length === 0 ? (
              <div
                style={{
                  padding: '24px 20px',
                  textAlign: 'center',
                  fontSize: 13,
                  color: T.inkMute,
                }}
              >
                Nothing sent yet. Tap "Invite" on a friend above to get started.
              </div>
            ) : (
              invites.map((inv, idx) => {
                const isPending = inv.status === 'pending';
                const onClick = () => {
                  if (!isPending) return;
                  shareInvite({
                    share_url: `https://clbhouz.co.uk/i/${inv.invite_code}`,
                    share_message: `Join me on Clbhouz — connect your England Golf handicap and we can compare rounds. Tap: https://clbhouz.co.uk/i/${inv.invite_code}`,
                    invitee_name: inv.invitee_name,
                  });
                };
                return (
                  <button
                    key={inv.id}
                    onClick={onClick}
                    disabled={!isPending}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      borderTop: idx === 0 ? 'none' : `1px solid ${T.hairline}`,
                      background: 'var(--hcp-bg-1)',
                      border: 'none',
                      cursor: isPending ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 700,
                          color: T.ink,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {firstName(inv.invitee_name)}
                      </p>
                      <p
                        style={{
                          margin: '1px 0 0',
                          fontSize: 11,
                          color: T.inkMute,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {inv.invitee_home_club ?? '—'} ·{' '}
                        {formatDistanceToNow(new Date(inv.sent_at), { addSuffix: true })}
                        {isPending && ' · Tap to share again'}
                      </p>
                    </div>
                    <StatusBadge status={inv.status} />
                  </button>
                );
              })
            )}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

export default SentInvitesSheet;
