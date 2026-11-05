import React, { useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, Menu, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

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

import { TourSideMenu } from '../components/TourSideMenu';

interface NewsChromeBridgeProps {
  label: 'Tour News' | 'Amateur News';
  mode: 'menu' | 'back';
  backFallback: string;
  titleInPage?: boolean;
}

/**
 * The solid, notch-safe news header shared by both story pages and the Wire
 * index. It suppresses the global floating island and owns its content offset.
 */
export function NewsChromeBridge({ label, mode, backFallback, titleInPage = false }: NewsChromeBridgeProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const { activeActor, isLoading } = useActiveActor();
  const { logout } = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const titleSlotRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const [titleFits, setTitleFits] = useState(false);

  useLayoutEffect(() => {
    const slot = titleSlotRef.current;
    const text = titleRef.current;
    if (!slot || !text) return;
    let frame = 0;
    const measure = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => setTitleFits(text.scrollWidth <= slot.clientWidth)); };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [label, mode, titleInPage]);

  useSetChromeSuppressed(true);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--news-header-h', 'calc(env(safe-area-inset-top, 0px) + 47px)');
    return () => {
      document.documentElement.style.removeProperty('--news-header-h');
    };
  }, []);

  const back = React.useCallback(
    () => {
      if (location.key !== 'default') {
        navigate(-1);
        return;
      }
      // Plain navigation: the Amateur destination has no tab state to restore.
      navigate(backFallback, { replace: true });
    },
    [backFallback, location.key, navigate],
  );


  return (
    <>
      <header aria-label={label} style={{ position: 'fixed', inset: '0 0 auto', zIndex: Z.header, paddingTop: 'env(safe-area-inset-top, 0px)', background: A.CANVAS, borderBottom: `1px solid ${A.BORDER}`, fontFamily: SANS }}>
        <div style={{ position: 'relative', height: 47, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
          <Button type="button" variant="ghost" size="icon" aria-label={mode === 'back' ? 'Back' : 'Tour menu'} onClick={mode === 'back' ? back : () => setMenuOpen(true)} style={{ width: 36, height: 36, padding: 0, color: A.INK, flexShrink:0 }}>
            {mode === 'back' ? <ArrowLeft size={19} strokeWidth={2.2} aria-hidden /> : <Menu size={19} strokeWidth={2.2} aria-hidden />}
          </Button>
          {mode === 'menu' && !titleInPage && <div ref={titleSlotRef} data-news-title-slot style={{flex:'1 1 auto',minWidth:0,margin:'0 8px',textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',pointerEvents:'none'}}><span ref={titleRef} data-news-bar-title aria-hidden={!titleFits} style={{display:'inline-block',visibility:titleFits?'visible':'hidden',color:A.INK,fontSize:16,fontWeight:700}}>{label}</span></div>}
          <div style={{ marginLeft: 'auto', height: 36, display: 'flex', alignItems: 'center', gap: 9, flexShrink:0 }}>
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