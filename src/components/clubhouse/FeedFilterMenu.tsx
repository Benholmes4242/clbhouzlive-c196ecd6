import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { ClubhouseTab } from './ClubhouseTabToggle';

interface FeedFilterMenuProps {
  isOpen: boolean;
  activeTab: ClubhouseTab;
  onSelect: (tab: ClubhouseTab) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}

/**
 * FeedFilterMenu - Dropdown shown beneath the FeedFilterChip.
 * Renders via portal to avoid stacking/clipping inside the identity pill.
 */
export const FeedFilterMenu: React.FC<FeedFilterMenuProps> = ({
  isOpen,
  activeTab,
  onSelect,
  onClose,
  anchorRef,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isOpen || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 6,
      left: rect.left,
    });
  }, [isOpen, anchorRef]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!position) return null;

  const options: { tab: ClubhouseTab; label: string }[] = [
    { tab: 'foryou', label: 'Suggested' },
    { tab: 'friends', label: 'Friends' },
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          role="listbox"
          aria-label="Feed filter options"
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            zIndex: 9999,
            minWidth: 152,
            padding: 5,
            borderRadius: 14,
            background: 'rgba(20, 28, 38, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(22px) saturate(180%)',
            WebkitBackdropFilter: 'blur(22px) saturate(180%)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5), 0 0 0 0.5px rgba(255,255,255,0.04)',
            fontFamily: 'Geist, system-ui, sans-serif',
          }}
        >
          {options.map(({ tab, label }) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onSelect(tab);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '9px 11px 9px 12px',
                  borderRadius: 10,
                  background: isActive ? 'rgba(247, 147, 30, 0.18)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.12s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(255, 255, 255, 0.06)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'transparent';
                  }
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isActive ? '#F7931E' : 'rgba(255, 255, 255, 0.88)',
                    letterSpacing: '-0.005em',
                  }}
                >
                  {label}
                </span>
                {isActive && (
                  <Check size={13} strokeWidth={2.75} style={{ color: '#F7931E' }} />
                )}
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default FeedFilterMenu;
