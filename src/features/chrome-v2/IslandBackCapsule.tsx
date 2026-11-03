/** HB4 owns only opted-in back geometry/name; legacy back controls retain ChromeIsland. */
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useFitOneLine } from '@/features/explore-magazine/useFitOneLine';
import { useIslandsCondensed } from './useIslandsCondensed';
import { useIslandBackNameValue } from './islandBackNameStore';
import './island-back.css';

export function IslandBackCapsule({ onBack, label }: { onBack: () => void; label: string }) {
  const { pathname } = useLocation();
  const condensed = useIslandsCondensed();
  const value = useIslandBackNameValue();
  const name = value?.pathname === pathname ? value.name : '';
  const shown = !!name && value?.past === true && !condensed;
  const nameRef = useFitOneLine<HTMLSpanElement>(name, 16, 13);
  return <Button variant="ghost" onClick={onBack} className="island-back" data-island-back data-named={shown} data-condensed={condensed}
    aria-label={shown ? `Back from ${name}` : label}>
    <ArrowLeft size={30} strokeWidth={2.4} aria-hidden className="island-back-arrow" />
    <span className="island-back-fold" aria-hidden={!shown}><span ref={nameRef} className="island-back-name">{name}</span></span>
  </Button>;
}