import React from 'react';
import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useSetChromeLeftSlot } from '@/features/chrome-v2/leftOverride';
import { useLogout } from '@/hooks/useLogout';
import { safeGoBack } from '@/utils/navigation';
import { TourIslandLeft } from '../components/TourIslandLeft';
import { TourSideMenu } from '../components/TourSideMenu';

interface NewsChromeBridgeProps {
  label: 'The Wire' | 'Amateur News';
  mode: 'menu' | 'back';
  backFallback: string;
}

/**
 * NewsChromeBridge — the existing Tour island treatment with a fixed section
 * label. News is not tour-scoped, so the picker is deliberately suppressed.
 */
export function NewsChromeBridge({ label, mode, backFallback }: NewsChromeBridgeProps) {
  const navigate = useNavigate();
  const { logout } = useLogout();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const back = React.useCallback(
    () => safeGoBack(navigate, backFallback),
    [backFallback, navigate],
  );

  const slot = React.useMemo(
    () => (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, height: '100%' }}>
        <TourIslandLeft
          label={label}
          mode={mode}
          onBackTap={back}
          onMenuTap={() => setMenuOpen(true)}
          onPickerTap={() => undefined}
          showPicker={false}
        />
        <span aria-hidden style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.18)', flexShrink: 0 }} />
        <span style={{ color: '#FFFFFF', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {label}
        </span>
        {mode === 'back' && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Tour menu"
            onClick={() => setMenuOpen(true)}
            className="h-auto w-auto shrink-0 p-0 text-white hover:bg-transparent hover:text-white active:scale-[0.94]"
          >
            <Menu size={15} strokeWidth={2.2} aria-hidden />
          </Button>
        )}
      </div>
    ),
    [back, label, mode],
  );

  useSetChromeLeftSlot(slot);

  return (
    <TourSideMenu
      open={menuOpen}
      onClose={() => setMenuOpen(false)}
      activeTab="news"
      onSelectTab={(id) => {
        setMenuOpen(false);
        navigate(`/tourhub?tab=${id}`);
      }}
      onSettings={() => navigate('/edit-profile?tab=settings')}
      onProfile={() => navigate('/profile')}
      onSignOut={() => { void logout(); }}
    />
  );
}

export default NewsChromeBridge;