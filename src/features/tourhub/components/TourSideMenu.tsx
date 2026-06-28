/**
 * TourSideMenu — self-contained LIV-style left drawer for the Tour Hub
 * cinematic overview. Owns its own backdrop, panel, slide animation.
 * Does NOT depend on any shared drawer/sheet component.
 */
import React, { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Compass,
  Trophy,
  CalendarDays,
  Users,
  BarChart3,
  GraduationCap,
  Settings,
  User,
  LogOut,
  TrendingUp,
} from 'lucide-react';

export interface TourSideMenuProps {
  open: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  handicapValue: string;
  onSettings: () => void;
  onProfile: () => void;
  onSignOut: () => void;
}

const DESTINATIONS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'overview',     label: 'Overview',     Icon: Compass },
  { id: 'live',         label: 'Leaderboards', Icon: Trophy },
  { id: 'schedule',     label: 'Schedule',     Icon: CalendarDays },
  { id: 'players',      label: 'Players',      Icon: Users },
  { id: 'leaderboards', label: 'Leaders',      Icon: BarChart3 },
  { id: 'college',      label: 'College',      Icon: GraduationCap },
];

const PINE = '#2F6B4F';
const INK = '#0F172A';
const MUTED = '#64748B';
const DIVIDER = '#e4e8ec';
const DURATION = 280;

function usePrefersReducedMotion() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setV(mq.matches);
    const onChange = () => setV(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return v;
}

export const TourSideMenu: React.FC<TourSideMenuProps> = ({
  open,
  onClose,
  activeTab,
  onSelectTab,
  handicapValue,
  onSettings,
  onProfile,
  onSignOut,
}) => {
  const reduced = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  // Mount on open; unmount after exit transition.
  useEffect(() => {
    if (open) {
      setMounted(true);
      // next frame → animate in
      const r = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(r);
    } else if (mounted) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), DURATION + 20);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  if (!mounted) return null;

  const ease = 'cubic-bezier(0.4,0,0.2,1)';
  const slideTransform = reduced ? 'translateX(0)' : (visible ? 'translateX(0)' : 'translateX(-100%)');

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        fontFamily: 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15,23,42,0.4)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          opacity: visible ? 1 : 0,
          transition: `opacity ${DURATION}ms ${ease}`,
        }}
      />

      {/* Panel */}
      <aside
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '80%',
          maxWidth: 340,
          background: 'rgba(248,250,252,0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 24px 60px rgba(15,23,42,0.25)',
          transform: slideTransform,
          transition: `transform ${DURATION}ms ${ease}`,
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          display: 'flex',
          flexDirection: 'column',
          willChange: 'transform',
        }}
      >
        {/* Top: logo + handicap pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 0',
          }}
        >
          <img
            src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
            alt="clbhouz"
            style={{ height: 30, width: 30, objectFit: 'contain' }}
          />
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 30,
              padding: '0 10px',
              borderRadius: 999,
              background: '#FFFFFF',
              border: '0.5px solid rgba(15,23,42,0.10)',
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: INK,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {handicapValue}
            </span>
            <TrendingUp size={11} color={PINE} strokeWidth={2.4} />
          </div>
        </div>

        {/* Nav list */}
        <nav style={{ marginTop: 16, flex: 1, overflowY: 'auto' }}>
          {DESTINATIONS.map(({ id, label, Icon }) => {
            const isActive = id === activeTab;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onSelectTab(id);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  width: 'calc(100% - 20px)',
                  margin: '2px 10px',
                  padding: '12px 14px',
                  border: 'none',
                  borderRadius: 14,
                  background: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? PINE : INK,
                  fontFamily: 'inherit',
                  fontSize: 16,
                  fontWeight: isActive ? 800 : 600,
                  letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: isActive ? '0 1px 2px rgba(15,23,42,0.05)' : 'none',
                  transition: 'background 150ms ease',
                }}
              >
                <span style={{ width: 22, display: 'inline-flex', justifyContent: 'center' }}>
                  <Icon size={20} color={isActive ? PINE : INK} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                {label}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: DIVIDER, margin: '12px 20px' }} />

        {/* Secondary links */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 20px 20px', gap: 4 }}>
          <SecondaryLink Icon={Settings} label="Settings" onClick={() => { onClose(); onSettings(); }} />
          <SecondaryLink Icon={User}     label="Profile"  onClick={() => { onClose(); onProfile(); }} />
          <SecondaryLink Icon={LogOut}   label="Sign Out" onClick={() => { onClose(); onSignOut(); }} />
        </div>
      </aside>
    </div>
  );
};

function SecondaryLink({
  Icon,
  label,
  onClick,
}: {
  Icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'transparent',
        border: 'none',
        padding: '10px 0',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: 600,
        color: MUTED,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <Icon size={18} color={MUTED} strokeWidth={2} />
      {label}
    </button>
  );
}

export default TourSideMenu;
