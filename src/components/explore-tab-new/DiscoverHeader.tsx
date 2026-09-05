import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PostingAsMenu } from '@/components/header/PostingAsMenu';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useActiveActor } from '@/context/ActiveActorContext';
import { AvatarCell, CHROME_LOGO_SRC, HcpCell } from '@/features/chrome-v2/ChromeIsland';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { Z } from '@/config/zIndex';

export type DiscoverTab = 'circuit' | 'media';

export function DiscoverHeader({ active, onChange }: { active: DiscoverTab; onChange: (tab: DiscoverTab) => void }) {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { activeActor, isLoading } = useActiveActor();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--discover-header-h', 'calc(env(safe-area-inset-top, 0px) + 89px)');
    return () => document.documentElement.style.removeProperty('--discover-header-h');
  }, []);
  useEffect(() => () => {
    setMenuOpen(false);
    setSearchOpen(false);
    return undefined;
  }, []);

  return (
    <>
      <header
        data-discover-header
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: Z.header,
          paddingTop: 'env(safe-area-inset-top, 0px)', background: A.CANVAS,
          borderBottom: `1px solid ${A.BORDER}`, fontFamily: SANS,
        }}
      >
        <div style={{ position: 'relative', height: 46, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
          <button type="button" aria-label="Go to Clubhouse" onClick={() => navigate('/clubhouse')} style={{ width: 36, height: 36, padding: 4, border: 0, background: 'transparent', cursor: 'pointer' }}>
            <img src={CHROME_LOGO_SRC} alt="clbhouz" style={{ width: 28, height: 28, borderRadius: 9, objectFit: 'contain' }} />
          </button>
          <h1 style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: 0, color: A.INK }}>Discover</h1>
          <div style={{ marginLeft: 'auto', height: 36, display: 'flex', alignItems: 'center', gap: 9 }}>
            <button type="button" aria-label="Search" onClick={() => setSearchOpen(true)} style={{ width: 30, height: 34, display: 'grid', placeItems: 'center', padding: 0, border: 0, background: 'transparent', color: A.INK, cursor: 'pointer' }}>
              <Search size={16} strokeWidth={2.3} />
            </button>
            <HcpCell tone="dark" dividerColor={A.BORDER} />
            {isLoading || !activeActor ? (
              <SquircleAvatar size={34} alt="" hideRing />
            ) : (
              <AvatarCell tone="dark" triggerRef={avatarRef} onOpen={() => setMenuOpen((value) => !value)} />
            )}
          </div>
        </div>
        <nav aria-label="Discover sections" style={{ height: 43, display: 'flex', justifyContent: 'center', gap: 40 }}>
          {([['circuit', 'The circuit'], ['media', 'News & media']] as const).map(([id, label]) => {
            const selected = active === id;
            return (
              <button key={id} type="button" aria-current={selected ? 'page' : undefined} onClick={() => onChange(id)} style={{ position: 'relative', height: 43, padding: '0 2px', border: 0, background: 'transparent', color: selected ? A.INK : A.DIM, fontSize: 15, fontWeight: 700, letterSpacing: 0, cursor: 'pointer' }}>
                {label}
                {selected && <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2.5, background: A.INK }} />}
              </button>
            );
          })}
        </nav>
      </header>
      {user && <PostingAsMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} anchorRef={avatarRef} />}
      <SearchOverlayV2 isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}