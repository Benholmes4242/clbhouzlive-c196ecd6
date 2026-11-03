import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const state = vi.hoisted(() => ({ activeTab: 'clubhouse' }));
vi.mock('@/contexts/BottomNavigationContext', () => ({ useBottomNavigation: () => ({ isVisible: true }) }));
vi.mock('@/contexts/ModalContext', () => ({ useModalContext: () => ({ shouldHideHeader: false }) }));
vi.mock('@/hooks/useAppPrefetch', () => ({ useAppPrefetch: () => ({ triggerPrefetch: vi.fn() }) }));
vi.mock('@/components/bottom-navigation/useNavigationHandlers', () => ({ useNavigationHandlers: () => ({ activeTab: state.activeTab, handleTabClick: vi.fn(), handlePrefetch: vi.fn() }) }));
vi.mock('@/stores/discoverNewStore', () => ({ useDiscoverNewTotal: () => 0 }));
vi.mock('@/hooks/useNavTheme', () => ({ useNavTheme: () => 'dark' }));
vi.mock('@/features/tourhub/hooks/useAnyTourLive', () => ({ useAnyTourLive: () => false }));
vi.mock('@/features/composer-flow/ComposerFlowSheet', () => ({ default: () => null }));

import GlobalBottomNavigation from '@/components/GlobalBottomNavigation';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';
import { r } from '@/lib/radius';

beforeEach(() => { resetToExpanded(); state.activeTab = 'clubhouse'; });
afterEach(() => { cleanup(); resetToExpanded(); });
const mount = () => render(<MemoryRouter initialEntries={['/']}><GlobalBottomNavigation /></MemoryRouter>);

describe('NAV_SQ1', () => {
  it('pill computed radius is20px expanded and condensed without changing width rules', async () => {
    const el = document.createElement('div'); document.body.appendChild(el);
    const off = registerNavScroller(el);
    try {
      mount();
      const pill = document.querySelector<HTMLElement>('[data-chrome="bottom-nav"]');
      if (!pill) throw new Error('Missing bottom nav');
      expect(getComputedStyle(pill).borderRadius).toBe('20px'); expect(pill.style.maxWidth).toContain('396px');
      el.scrollTop = 150;
      await act(async () => { fireEvent.scroll(el); await new Promise(r => requestAnimationFrame(() => r(null))); });
      expect(pill.style.maxWidth).toContain('324px'); expect(getComputedStyle(pill).borderRadius).toBe('20px');
    } finally { off(); el.remove(); }
  });
  it('selected tile computed radius is16px and inactive tiles keep14px', () => {
    mount();
    const selected = document.querySelector<HTMLElement>('[aria-current="page"]');
    if (!selected) throw new Error('Missing selected tab');
    expect(getComputedStyle(selected).borderRadius).toBe('16px'); expect(selected.style.height).toBe('46px');
    expect(screen.getByRole('button', { name: 'Post or review' }).style.borderRadius).toBe('14px');
  });
  it('selected centre action uses16px without changing its geometry', () => {
    state.activeTab = 'post'; mount();
    const selected = screen.getByRole('button', { name: 'Post or review' });
    expect(getComputedStyle(selected).borderRadius).toBe('16px'); expect(selected.style.height).toBe('46px');
    expect(selected.style.gap).toBe('3.5px'); expect(selected.style.padding).toBe('0px 3px');
  });
  it('all shared radius token values remain unchanged', () => {
    expect(r).toEqual({ none:'0px', bar:'2px', xs:'6px', sm:'10px', md:'14px', lg:'18px', xl:'24px', sheet:'20px', pill:'999px', avatar:'34%' });
  });
});