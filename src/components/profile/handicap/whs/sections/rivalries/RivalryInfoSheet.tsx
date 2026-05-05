import React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { X } from 'lucide-react';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import { firstName } from '@/lib/whs/utils/initials';

interface Props {
  rivalry: FriendRivalryHydrated | null;
  open: boolean;
  onClose: () => void;
}

const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.6)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';

const slotExplanation = (kind: string): { title: string; body: string } => {
  switch (kind) {
    case 'chasing':
      return {
        title: 'You\'re chasing them',
        body: 'This rival is just ahead of you — within striking distance on the leaderboard. Beat them in your next round and the gap closes.',
      };
    case 'chased_by':
      return {
        title: 'They\'re chasing you',
        body: 'This rival is just behind you on the leaderboard. Hold them off — every round counts.',
      };
    case 'pinned':
      return {
        title: 'Pinned rival',
        body: 'You chose this person manually. They stay in your rivalries no matter what the leaderboard says.',
      };
    default:
      return {
        title: 'Auto-picked rival',
        body: 'Selected from your circle based on recent head-to-head activity.',
      };
  }
};

export const RivalryInfoSheet: React.FC<Props> = ({ rivalry, open, onClose }) => {
  const explain = rivalry ? slotExplanation(rivalry.slot_kind) : null;

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 80 }} />
        <DrawerPrimitive.Content
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 81,
            background: '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '70vh',
            overflow: 'hidden',
            fontFamily: 'SF Pro Display, system-ui, sans-serif',
          }}
        >
          <DrawerPrimitive.Title className="sr-only">Why this rival</DrawerPrimitive.Title>
          <div aria-hidden style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.15)' }} />
          </div>

          <div style={{ padding: '8px 20px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden style={{ width: 3, height: 8, borderRadius: 1, background: AMBER }} />
                <span style={{ fontSize: 9, fontWeight: 900, color: AMBER, letterSpacing: '0.16em' }}>
                  WHY THIS RIVAL
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'rgba(15,23,42,0.06)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={15} color={INK} strokeWidth={2.4} />
              </button>
            </div>

            {explain && (
              <>
                <h3 style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 900,
                  fontFamily: 'Georgia, serif',
                  letterSpacing: '-0.02em',
                  color: INK,
                  lineHeight: 1.15,
                }}>
                  {explain.title}
                </h3>
                <p style={{
                  margin: '10px 0 0',
                  fontSize: 14,
                  color: INK_MUTE,
                  lineHeight: 1.55,
                }}>
                  {explain.body}
                </p>
              </>
            )}

            {rivalry && (
              <div style={{
                marginTop: 18,
                padding: 14,
                borderRadius: 12,
                background: 'rgba(15,23,42,0.04)',
                border: `1px solid ${HAIRLINE}`,
              }}>
                <p style={{ margin: 0, fontSize: 11, color: INK_MUTE, fontWeight: 700, letterSpacing: '0.04em' }}>
                  About {rivalry.rival_name ? firstName(rivalry.rival_name) : 'this rival'}
                </p>
                <ul style={{
                  margin: '8px 0 0',
                  padding: 0,
                  listStyle: 'none',
                  fontSize: 13,
                  color: INK,
                  lineHeight: 1.7,
                }}>
                  <li>Shared rounds: <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{rivalry.shared_rounds_count}</strong></li>
                  <li>Last 90 days: <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{rivalry.shared_rounds_last_90d}</strong></li>
                  {rivalry.rival_handicap !== null && (
                    <li>Their HCP: <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{rivalry.rival_handicap.toFixed(1)}</strong></li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

export default RivalryInfoSheet;
