/**
 * TourSideMenu — self-contained LIV-style left drawer for the Tour Hub
 * cinematic overview. Owns its own backdrop, panel, slide animation.
 * Does NOT depend on any shared drawer/sheet component.
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Z } from '@/config/zIndex';
import {
  AMBER,
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
} from '@/features/tourhub/_shared/tokens';
import { useLiveTournaments } from '../hooks/useLiveTournaments';
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

// Constants table pattern: destination id is the compare key; labelKey resolves
// to `tourhub.nav.<key>` at render. IDs remain untranslatable to keep
// activeTab/onSelectTab comparisons enum-safe.
const DESTINATIONS: { id: string; labelKey: string; Icon: LucideIcon }[] = [
  { id: 'overview',     labelKey: 'nav.overview',     Icon: Compass },
  { id: 'live',         labelKey: 'nav.leaderboards', Icon: Trophy },
  { id: 'schedule',     labelKey: 'nav.schedule',     Icon: CalendarDays },
  { id: 'players',      labelKey: 'nav.players',      Icon: Users },
  { id: 'leaderboards', labelKey: 'nav.leaders',      Icon: BarChart3 },
  { id: 'college',      labelKey: 'nav.college',      Icon: GraduationCap },
];


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
  const { data: liveTournaments, isFetched: liveFetched } = useLiveTournaments();
  const showLive = liveFetched && (liveTournaments?.length ?? 0) > 0;

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
        zIndex: Z.sideMenu,
        fontFamily: FONT,
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
          overflow: 'hidden',
        }}
      >
        <img
          src="/assets/logomark-orange.png"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 'max(24px, env(safe-area-inset-bottom, 0px))',
            right: -40,
            width: 260,
            height: 'auto',
            opacity: 0.05,
            pointerEvents: 'none',
            zIndex: 0,
            userSelect: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Primary group header */}
          <div style={{ marginTop: 'max(20px, env(safe-area-inset-top, 0px))', paddingTop: 16 }}>
            <GroupHeader>Tour</GroupHeader>
          </div>

          {/* Nav list */}
          <nav style={{ marginTop: 4, flex: 1, overflowY: 'auto' }}>
            {DESTINATIONS.filter(({ id }) => id !== 'live' || showLive).map(({ id, label, Icon }) => {
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
                    color: INK,
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
                    <Icon size={20} color={INK} strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Secondary group header */}
          <div style={{ marginTop: 8, paddingTop: 12, borderTop: `1px solid ${HAIRLINE_INK_10}` }}>
            <div style={{ marginTop: 12 }}>
              <GroupHeader>Account</GroupHeader>
            </div>
          </div>

          {/* Secondary links */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px 22px', gap: 4 }}>
            <SecondaryLink Icon={Settings} label="Settings" onClick={() => { onClose(); onSettings(); }} />
            <SecondaryLink Icon={User}     label="Profile"  onClick={() => { onClose(); onProfile(); }} />
            <SecondaryLink Icon={LogOut}   label="Sign out" onClick={() => { onClose(); onSignOut(); }} />
          </div>
        </div>
      </aside>
    </div>
  );
};

function GroupHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '0 24px', marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: AMBER, lineHeight: 1 }}>
        {children}
      </div>
    </div>
  );
}

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
        color: INK_MUTE,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <Icon size={18} color={INK_MUTE} strokeWidth={2} />
      {label}
    </button>
  );
}


export default TourSideMenu;

