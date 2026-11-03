import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { r } from '@/lib/radius';
import GlobalBottomNavigation from '@/components/GlobalBottomNavigation';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/contexts/BottomNavigationContext', () => ({ useBottomNavigation: () => ({ isVisible: true }) }));
vi.mock('@/contexts/ModalContext', () => ({ useModalContext: () => ({ shouldHideHeader: false }) }));
vi.mock('@/hooks/useAppPrefetch', () => ({ useAppPrefetch: () => ({ triggerPrefetch: vi.fn() }) }));
vi.mock('@/stores/discoverNewStore', () => ({ useDiscoverNewTotal: () => 0 }));
vi.mock('@/hooks/useNavTheme', () => ({ useNavTheme: () => 'dark' }));
vi.mock('@/features/tourhub/hooks/useAnyTourLive', () => ({ useAnyTourLive: () => false }));
vi.mock('@/features/composer-flow/ComposerFlowSheet', () => ({ default: () => null }));
vi.mock('@/components/bottom-navigation/useNavigationHandlers', () => ({ useNavigationHandlers: () => ({ activeTab: 'clubhouse', handleTabClick: vi.fn(), handlePrefetch: vi.fn() }) }));

afterEach(() => { cleanup(); resetToExpanded(); });
const mount = () => render(<MemoryRouter><GlobalBottomNavigation /></MemoryRouter>);
describe('NAV_SQ1 local squircle radii', () => {
  it('pill computed radius stays20px expanded and condensed', async () => {
    resetToExpanded();
    const scroller = document.createElement('div'); document.body.append(scroller);
    const off = registerNavScroller(scroller);
    try {
      mount();
      const pill = document.querySelector<HTMLElement>('[data-chrome="bottom-nav"]');
      if (!pill) throw new Error('Missing navigation pill');
      expect(pill.style.maxWidth).toContain('396px'); expect(getComputedStyle(pill).borderRadius).toBe('20px');
      scroller.scrollTop = 150;
      await act(async () => { fireEvent.scroll(scroller); await new Promise(r => requestAnimationFrame(() => r(null))); });
      expect(pill.style.maxWidth).toContain('324px'); expect(getComputedStyle(pill).borderRadius).toBe('20px');
    } finally { off(); scroller.remove(); }
  });
  it('selected tab tile computed radius is16px', () => {
    mount();
    const home = screen.getByRole('button', { name: 'Home' });
    expect(home).toHaveAttribute('aria-current', 'page'); expect(getComputedStyle(home).borderRadius).toBe('16px');
    expect(home.style.height).toBe('46px');
  });
  it('shared radius tokens remain unchanged', () => {
    expect(r).toEqual({ none: '0px', bar: '2px', xs: '6px', sm: '10px', md: '14px', lg: '18px', xl: '24px', sheet: '20px', pill: '999px', avatar: '34%' });
  });
});