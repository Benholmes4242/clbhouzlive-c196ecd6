import React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { X } from 'lucide-react';
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
  ink: '#0F172A',
  inkMute: 'rgba(15,23,42,0.55)',
  hairline: 'rgba(15,23,42,0.08)',
  green: '#059669',
  greenTint: 'rgba(5,150,105,0.12)',
  greyTint: 'rgba(15,23,42,0.05)',
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
          color: '#94A3B8',
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
        color: '#64748B',
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
            background: 'rgba(15,23,42,0.40)',
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
            background: T.pageBg,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            zIndex: 51,
            outline: 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -10px 40px -10px rgba(15,23,42,0.25)',
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
              background: 'rgba(15,23,42,0.18)',
            }}
          />

          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#FFFFFF',
              border: `1px solid ${T.hairline}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1,
            }}
          >
            <X size={16} color={T.ink} />
          </button>

          <DrawerPrimitive.Title
            style={{
              padding: '20px 60px 8px 20px',
              fontFamily: FONT_GEIST,
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: T.ink,
              margin: 0,
            }}
          >
            Sent invites
          </DrawerPrimitive.Title>
          <DrawerPrimitive.Description
            style={{
              padding: '0 20px 16px',
              fontSize: 13,
              color: T.inkMute,
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            Tap a pending invite to share it again.
          </DrawerPrimitive.Description>

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
                    background: 'rgba(15,23,42,0.04)',
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
                      background: '#FFFFFF',
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
