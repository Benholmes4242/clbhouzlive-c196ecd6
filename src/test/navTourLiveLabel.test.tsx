import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GlobalBottomNavigation from '@/components/GlobalBottomNavigation';
import { LIVE_INK } from '@/features/tourhub/_shared/tokens';

const state = vi.hoisted(() => ({ live: false, activeTab: 'clubhouse' }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/contexts/BottomNavigationContext', () => ({ useBottomNavigation: () => ({ isVisible: true }) }));
vi.mock('@/contexts/ModalContext', () => ({ useModalContext: () => ({ shouldHideHeader: false }) }));
vi.mock('@/hooks/useAppPrefetch', () => ({ useAppPrefetch: () => ({ triggerPrefetch: vi.fn() }) }));
vi.mock('@/stores/discoverNewStore', () => ({ useDiscoverNewTotal: () => 0 }));
vi.mock('@/hooks/useNavTheme', () => ({ useNavTheme: () => 'dark' }));
vi.mock('@/features/tourhub/hooks/useAnyTourLive', () => ({ useAnyTourLive: () => state.live }));
vi.mock('@/features/composer-flow/ComposerFlowSheet', () => ({ default: () => null }));
vi.mock('@/components/bottom-navigation/useNavigationHandlers', () => ({ useNavigationHandlers: () => ({ activeTab: state.activeTab, handleTabClick: vi.fn(), handlePrefetch: vi.fn() }) }));

afterEach(() => { cleanup(); state.live = false; state.activeTab = 'clubhouse'; });
const mount = () => render(<MemoryRouter><GlobalBottomNavigation /></MemoryRouter>);

describe('Tour live navigation label', () => {
  it('(a) not live shows Tour with the Tour accessible name', () => {
    mount();
    const button = screen.getByRole('button', { name: 'Tour' });
    expect(within(button).getByText('Tour')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Tour');
    expect(within(button).queryByText('Live')).toBeNull();
  });

  it('(b) live shows Live with Tour, live now and the existing live colour', () => {
    state.live = true;
    const view = mount();
    const button = screen.getByRole('button', { name: 'Tour, live now' });
    const label = within(button).getByText('Live');
    expect(button).toHaveAttribute('aria-label', 'Tour, live now');
    const colour = document.createElement('span');
    colour.style.color = LIVE_INK;
    const rgb = colour.style.color.match(/\d+/g);
    if (!rgb) throw new Error('Missing live token RGB channels');
    colour.style.color = `rgba(${rgb.join(',')},0.62)`;
    expect(label.style.color).toBe(colour.style.color);
    expect(label.style.color).toBe(button.style.color);
    state.activeTab = 'tourhub';
    view.rerender(<MemoryRouter><GlobalBottomNavigation /></MemoryRouter>);
    colour.style.color = LIVE_INK;
    expect(within(screen.getByRole('button', { name: 'Tour, live now' })).getByText('Live').style.color).toBe(colour.style.color);
  });

  it('(c) other tab labels are unchanged in both live states', () => {
    for (const live of [false, true]) {
      state.live = live;
      const view = mount();
      for (const label of ['Home', 'Explore', 'Courses']) {
        expect(within(screen.getByRole('button', { name: label })).getByText(label)).toBeInTheDocument();
      }
      const post = screen.getByRole('button', { name: 'Post or review' });
      expect(within(post).getByText('Post')).toBeInTheDocument();
      expect(within(post).getByText('Review')).toBeInTheDocument();
      view.unmount();
    }
  });
});