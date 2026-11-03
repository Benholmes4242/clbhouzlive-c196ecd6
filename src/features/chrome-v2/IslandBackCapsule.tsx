/** HB4 owns only opted-in back geometry/name; legacy back controls retain ChromeIsland. */
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useFitOneLine } from '@/features/explore-magazine/useFitOneLine';
import { useIslandsCondensed } from './useIslandsCondensed';
import { useIslandBackNameValue } from './islandBackNameStore';
import './island-back.css';

export function IslandBackCapsule({ onBack, label, staticTitle }: { onBack: () => void; label: string; staticTitle?: string | null }) {
  const { pathname } = useLocation();
  const condensed = useIslandsCondensed();
  const value = useIslandBackNameValue();
  // HB6 static registry titles have no heading threshold; observed names keep
  // HB4/HB5's exact ownership and threshold when this opt-in prop is absent.
  const name = staticTitle ?? (value?.pathname === pathname ? value.name : '');
  const shown = !!name && (staticTitle != null || value?.past === true) && !condensed;
  const nameRef = useFitOneLine<HTMLSpanElement>(name, 16, 13);
  return <Button variant="ghost" onClick={onBack} className="island-back" data-island-back data-named={shown} data-condensed={condensed}
    aria-label={shown ? `Back from ${name}` : label}>
    <ArrowLeft size={30} strokeWidth={2.4} aria-hidden className="island-back-arrow" />
    <span className="island-back-fold" aria-hidden={!shown}><span ref={nameRef} className="island-back-name">{name}</span></span>
  </Button>;
}