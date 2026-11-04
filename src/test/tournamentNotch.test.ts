import {describe,it,expect} from 'vitest';
import {isImmersiveRoute} from '@/components/header/globalHeaderRules';
import {resolveChrome} from '@/features/chrome-v2/registry';
import {photoBandHeight} from '@/features/tourhub/components/overview-v3/HybridHeroBands/photoBandMaterial';

describe('Tournament notch ownership',()=>{
  it.each(['/tourhub/tournament/event','/tourhub/tournament/event/'])('%s is immersive',path=>{
    expect(isImmersiveRoute(path)).toBe(true);
  });
  it.each(['/tourhub/tournament','/tourhub/tournament/','/tourhub/tournament/event/tees','/tourhub/player/player','/tourhub/player/player/','/tourhub/player/player/stats','/tourhub/players','/tourhub/schedule'])('%s remains shell-inset',path=>{
    expect(isImmersiveRoute(path)).toBe(false);
  });
  it('tournament root shares overview material with history and schedule fallback',()=>{
    const overview=resolveChrome('/tourhub',new URLSearchParams());
    const tournament=resolveChrome('/tourhub/tournament/event',new URLSearchParams());
    for(const key of ['chrome','tone','bleed','scrim','condense'] as const)expect(tournament[key]).toEqual(overview[key]);
    expect(tournament.left).toEqual({kind:'back',title:null,backTarget:'history',backFallback:'/tourhub?tab=schedule'});
  });
  it('tournament photo adds the notch once to its 340px band',()=>{
    expect(photoBandHeight(340,true)).toBe('calc(340px + var(--sat, 0px))');
  });
  it('overview keeps its existing definite carousel height',()=>{
    expect(photoBandHeight(340)).toBe(340);
  });
});