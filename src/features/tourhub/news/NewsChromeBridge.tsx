import React, { useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, Menu, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { PostingAsMenu } from '@/components/header/PostingAsMenu';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useActiveActor } from '@/context/ActiveActorContext';
import { AvatarCell, HcpCell } from '@/features/chrome-v2/ChromeIsland';
import { useSetChromeSuppressed } from '@/features/chrome-v2/leftOverride';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { Z } from '@/config/zIndex';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useLogout } from '@/hooks/useLogout';
import { safeGoBack } from '@/utils/navigation';
import { TourSideMenu } from '../components/TourSideMenu';

interface NewsChromeBridgeProps {
  label: 'The Wire' | 'Amateur News';
  mode: 'menu' | 'back';
  backFallback: string;
}

/**
 * The solid, notch-safe news header shared by both story pages and the Wire
 * index. It suppresses the global floating island and owns its content offset.
 */
export function NewsChromeBridge({ label, mode, backFallback }: NewsChromeBridgeProps) {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { activeActor, isLoading } = useActiveActor();
  const { logout } = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const avatarRef = useRef<HTMLButtonElement>(null);

  useSetChromeSuppressed(true);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--news-header-h', 'calc(env(safe-area-inset-top, 0px) + 47px)');
    return () => document.documentElement.style.removeProperty('--news-header-h');
  }, []);

  const back = React.useCallback(
    () => safeGoBack(navigate, backFallback),
    [backFallback, navigate],
  );

  return (
    <>
      <header style={{ position: 'fixed', inset: '0 0 auto', zIndex: Z.header, paddingTop: 'env(safe-area-inset-top, 0px)', background: A.CANVAS, borderBottom: `1px solid ${A.BORDER}`, fontFamily: SANS }}>
        <div style={{ position: 'relative', height: 47, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
          <Button type="button" variant="ghost" size="icon" aria-label={mode === 'back' ? 'Back' : 'Tour menu'} onClick={mode === 'back' ? back : () => setMenuOpen(true)} style={{ width: 36, height: 36, padding: 0, color: A.INK }}>
            {mode === 'back' ? <ArrowLeft size={19} strokeWidth={2.2} aria-hidden /> : <Menu size={19} strokeWidth={2.2} aria-hidden />}
          </Button>
          {mode === 'back' && label === 'The Wire' && (
            <Button type="button" variant="ghost" size="icon" aria-label="Tour menu" onClick={() => setMenuOpen(true)} style={{ width: 32, height: 36, padding: 0, color: A.INK }}>
              <Menu size={17} strokeWidth={2.2} aria-hidden />
            </Button>
          )}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', color: A.INK, fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', pointerEvents: 'none' }}>{label}</div>
          <div style={{ marginLeft: 'auto', height: 36, display: 'flex', alignItems: 'center', gap: 9 }}>
            <Button type="button" variant="ghost" size="icon" aria-label="Search" onClick={() => setSearchOpen(true)} style={{ width: 30, height: 34, padding: 0, color: A.INK }}><Search size={16} strokeWidth={2.3} aria-hidden /></Button>
            <HcpCell tone="dark" dividerColor={A.BORDER} />
            {isLoading || !activeActor ? <SquircleAvatar size={34} alt="" hideRing /> : <AvatarCell tone="dark" triggerRef={avatarRef} onOpen={() => setProfileOpen((value) => !value)} />}
          </div>
        </div>
      </header>
      <TourSideMenu open={menuOpen} onClose={() => setMenuOpen(false)} activeTab="news" onSelectTab={(id) => { setMenuOpen(false); navigate(`/tourhub?tab=${id}`); }} onSettings={() => navigate('/edit-profile?tab=settings')} onProfile={() => navigate('/profile')} onSignOut={() => { void logout(); }} />
      {user && <PostingAsMenu isOpen={profileOpen} onClose={() => setProfileOpen(false)} anchorRef={avatarRef} />}
      <SearchOverlayV2 isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export default NewsChromeBridge;