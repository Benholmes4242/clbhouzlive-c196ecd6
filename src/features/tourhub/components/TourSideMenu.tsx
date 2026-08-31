/**
 * TourSideMenu — self-contained LIV-style left drawer for the Tour Hub
 * cinematic overview. Owns its own backdrop, panel, slide animation.
 * Does NOT depend on any shared drawer/sheet component.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';
import { useTranslation } from 'react-i18next';
import { Z } from '@/config/zIndex';
import { FONT } from '@/features/tourhub/_shared/tokens';
import { A, LABEL, KICKER, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useLiveTournaments } from '../hooks/useLiveTournaments';
import type { LucideIcon } from 'lucide-react';
import {
  Compass,
  Newspaper,
  Trophy,
  CalendarDays,
  Users,
  BarChart3,
  GraduationCap,
  Settings,
  User,
  LogOut,
} from 'lucide-react';

/**
 * Amber in this drawer means nothing but the group headers — there is no
 * viewing member on these screens. The live dot is GREEN because a live
 * indicator is a broadcast convention, not a score.
 */
const LIVE_GREEN = '#22C55E';



export interface TourSideMenuProps {
  open: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onSettings: () => void;
  onProfile: () => void;
  onSignOut: () => void;
}

// Constants table pattern: destination id is the compare key; labelKey resolves
// to `tourhub.nav.<key>` at render. IDs remain untranslatable to keep
// activeTab/onSelectTab comparisons enum-safe.
const DESTINATIONS: { id: string; labelKey: string; Icon: LucideIcon }[] = [
  { id: 'overview',     labelKey: 'nav.overview',     Icon: Compass },
  { id: 'news',         labelKey: 'nav.news',         Icon: Newspaper },
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
  onSettings,
  onProfile,
  onSignOut,
}) => {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const { data: liveTournaments, isFetched: liveFetched, isLoading: liveLoading } = useLiveTournaments();
  const inProgress = (liveTournaments ?? []).filter((tt) => (tt.status || '').toLowerCase() === 'inprogress');
  const liveCount = inProgress.length;
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

  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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
          background: 'rgba(0,0,0,0.55)',
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
          // Ground taken from the app's translucent dark chrome
          // (GlobalBottomNavigation's rgba(27,30,39,0.86) = A.PANEL alpha'd),
          // held at the menu's original 0.94 so the page still shows faintly.
          background: 'rgba(27,30,39,0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
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
            <GroupHeader>{t('nav.group.tour')}</GroupHeader>
          </div>

          {/* Nav list */}
          <nav style={{ marginTop: 4, flexShrink: 0 }}>
            {DESTINATIONS.filter(({ id }) => id !== 'live' || showLive).map(({ id, labelKey, Icon }) => {
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
                    background: isActive ? A.INK : 'transparent',
                    // Active ink derives from the fill: A.INK fill -> A.CANVAS label.
                    color: isActive ? A.CANVAS : A.INK,
                    fontFamily: 'inherit',
                    fontSize: 16,
                    fontWeight: isActive ? 700 : 600,
                    letterSpacing: '-0.01em',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 150ms ease',
                  }}
                >
                  <span style={{ width: 22, display: 'inline-flex', justifyContent: 'center' }}>
                    <Icon size={20} color={isActive ? A.CANVAS : A.INK} strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>{t(labelKey)}</span>
                  {id === 'live' && liveCount > 0 && (
                    <LiveCountBadge count={liveCount} onInk={isActive} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* In action now — the drawer answers "is anything happening?" */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 0 8px' }}>
            {liveLoading ? (
              <div style={{ padding: '0 16px' }}>
                <Skeleton className="h-3 w-24 mb-3" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            ) : inProgress.length > 0 ? (
              <>
                <div style={{ padding: '0 24px', marginBottom: 8 }}>
                  <div style={KICKER}>{t('tour.menu.inActionNow')}</div>
                </div>
                <div
                  style={{
                    margin: '0 16px',
                    background: A.PANEL,
                    border: `1px solid ${A.BORDER}`,
                    borderRadius: 16,
                    overflow: 'hidden',
                  }}
                >
                  {inProgress.slice(0, 3).map((tt, i) => (
                    <LiveRow
                      key={tt.id}
                      name={tt.name}
                      round={tt.currentRound}
                      leaderName={tt.leaderName}
                      leaderCount={tt.leaderCount}
                      leaderToPar={tt.leaderToPar}
                      onTap={() => {
                        analyticsEvents.track('tour_menu_live_tapped', {
                          tournament_id: tt.id,
                          position: i + 1,
                        });
                        onClose();
                        navigate(`/tourhub/tournament/${tt.id}`);
                      }}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {/* Secondary group header */}
          <div style={{ marginTop: 8, paddingTop: 12, borderTop: `1px solid ${A.BORDER}` }}>
            <div style={{ marginTop: 12 }}>
              <GroupHeader>{t('nav.group.account')}</GroupHeader>
            </div>
          </div>

          {/* Secondary links */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px 22px', gap: 4 }}>
            <SecondaryLink Icon={Settings} label={t('nav.settings')} onClick={() => { onClose(); onSettings(); }} />
            <SecondaryLink Icon={User}     label={t('nav.profile')}  onClick={() => { onClose(); onProfile(); }} />
            <SecondaryLink Icon={LogOut}   label={t('nav.signOut')}  onClick={() => { onClose(); onSignOut(); }} />
          </div>
        </div>
      </aside>
    </div>
  );
};

/** Green live dot; halo dropped on ink fills where a glow reads as an artefact. */
function LiveDot({ size = 6, halo = true }: { size?: number; halo?: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: LIVE_GREEN,
        boxShadow: halo ? `0 0 0 3px rgba(34,197,94,0.16)` : 'none',
        flexShrink: 0,
      }}
    />
  );
}

function LiveCountBadge({ count, onInk }: { count: number; onInk: boolean }) {
  const { t } = useTranslation('tourhub');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <LiveDot halo={!onInk} />
      <span
        style={{
          ...LABEL,
          color: onInk ? 'rgba(21,23,31,0.72)' : A.DIM,
          ...FIGS,
        }}
      >
        {t('tour.menu.nLive', { count, value: String(count) })}
      </span>
    </span>
  );
}

/** "Patrick Cantlay" → "P. Cantlay" */
function shortLeaderName(full: string | null): string | null {
  if (!full) return null;
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return full.trim();
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

function LiveRow({
  name,
  round,
  leaderName,
  leaderCount,
  leaderToPar,
  onTap,
}: {
  name: string;
  round: number | null;
  leaderName: string | null;
  leaderCount: number;
  leaderToPar: number | null;
  onTap: () => void;
}) {
  const { t } = useTranslation('tourhub');
  const scoreText =
    leaderToPar == null ? null : leaderToPar === 0 ? 'E' : leaderToPar > 0 ? `+${leaderToPar}` : `${leaderToPar}`;
  const who =
    leaderCount > 1
      ? t('tour.menu.nTied', { count: leaderCount, value: String(leaderCount) })
      : shortLeaderName(leaderName);

  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        background: 'transparent',
        border: 'none',
        padding: '12px 14px',
        fontFamily: 'inherit',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <LiveDot />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 700,
            color: A.INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </span>
        {round != null && (
          <span style={{ ...LABEL, display: 'block', marginTop: 3 }}>
            {t('tour.menu.roundN', { n: round })}
          </span>
        )}
      </span>
      {scoreText && (
        <span style={{ flexShrink: 0, maxWidth: 84, textAlign: 'right' }}>
          <span
            style={{
              display: 'block',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: getScoreColor(leaderToPar, 'dark'),
              ...FIGS,
            }}
          >
            {scoreText}
          </span>
          {who && (
            <span
              style={{
                ...LABEL,
                display: 'block',
                marginTop: 3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {who}
            </span>
          )}
        </span>
      )}
    </button>
  );
}

function GroupHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '0 24px', marginBottom: 8 }}>
      <div style={{ ...KICKER, lineHeight: 1 }}>{children}</div>
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
        color: A.MUTE,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <Icon size={18} color={A.MUTE} strokeWidth={2} />
      {label}
    </button>
  );
}


export default TourSideMenu;

