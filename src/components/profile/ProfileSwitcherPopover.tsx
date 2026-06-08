/**
 * ProfileSwitcherPopover — anchored popover replacing the always-visible
 * Switch Profile carousel inside ProfileHubSheet.
 *
 * Closes on: outside-tap, ESC, profile selection.
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

const INK = '#0F172A';
const INK_SOFT = '#475569';
const INK_FAINT = '#94A3B8';
const AMBER_DEEP = '#D97706';
const AMBER_SOFT = '#FEF3E7';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const HAIRLINE_SOFT = 'rgba(15,23,42,0.06)';

interface Profile {
  id: string;
  type: 'personal' | 'business';
  name: string;
  avatarUrl?: string;
}

export interface ProfileSwitcherPopoverProps {
  open: boolean;
  onClose: () => void;
  profiles: Profile[];
  activeId: string;
  onSelectProfile: (id: string) => void | Promise<void>;
  onAddBusiness: () => void;
}

export function ProfileSwitcherPopover({
  open,
  onClose,
  profiles,
  activeId,
  onSelectProfile,
  onAddBusiness,
}: ProfileSwitcherPopoverProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Outside-tap layer */}
          <div
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 56,
              right: 0,
              width: 240,
              zIndex: 11,
              background: '#FFFFFF',
              borderRadius: 14,
              border: `0.5px solid ${HAIRLINE}`,
              boxShadow: '0 12px 32px rgba(15,23,42,0.12)',
              overflow: 'hidden',
            }}
          >
            {profiles.map((profile, index) => {
              const isActive = profile.id === activeId;
              return (
                <div key={profile.id}>
                  {index > 0 && (
                    <div style={{ height: '0.5px', background: HAIRLINE_SOFT }} />
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      await onSelectProfile(profile.id);
                      onClose();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      background: isActive ? AMBER_SOFT : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <SquircleAvatar
                      size={32}
                      src={profile.avatarUrl}
                      alt={profile.name}
                      fallback={profile.name?.charAt(0)?.toUpperCase() ?? '?'}
                      hideRing
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? 700 : 600,
                          color: INK,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {profile.name}
                      </div>
                      <div
                        style={{
                          fontSize: isActive ? 10 : 10.5,
                          fontWeight: isActive ? 700 : 400,
                          color: isActive ? AMBER_DEEP : INK_FAINT,
                          letterSpacing: isActive ? '0.10em' : undefined,
                          textTransform: isActive ? ('uppercase' as const) : undefined,
                          marginTop: 1,
                        }}
                      >
                        {isActive
                          ? `ACTIVE · ${profile.type === 'business' ? 'BUSINESS' : 'PERSONAL'}`
                          : profile.type === 'business' ? 'Business' : 'Personal'}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}

            <div style={{ height: '0.5px', background: HAIRLINE_SOFT }} />
            <button
              type="button"
              onClick={() => {
                onAddBusiness();
                onClose();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: `1.5px dashed ${INK_FAINT}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Plus size={18} color={INK_FAINT} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: INK_SOFT }}>
                Add business
              </span>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ProfileSwitcherPopover;
