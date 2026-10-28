/** Post/review centre tab: POST / two-way arrows / REVIEW, arrows as wide as
 *  the measured word POST, aria-label "Post or review", tap opens step 1. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/contexts/BottomNavigationContext', () => ({ useBottomNavigation: () => ({ isVisible: true }) }));
vi.mock('@/contexts/ModalContext', () => ({ useModalContext: () => ({ shouldHideHeader: false }) }));
vi.mock('@/hooks/useAppPrefetch', () => ({ useAppPrefetch: () => ({ triggerPrefetch: vi.fn() }) }));
vi.mock('@/components/bottom-navigation/useNavigationHandlers', () => ({ useNavigationHandlers: () => ({ activeTab: 'clubhouse', handleTabClick: vi.fn(), handlePrefetch: vi.fn() }) }));
vi.mock('@/stores/discoverNewStore', () => ({ useDiscoverNewTotal: () => 0 }));
vi.mock('@/hooks/useNavTheme', () => ({ useNavTheme: () => 'dark' }));
vi.mock('@/features/tourhub/hooks/useAnyTourLive', () => ({ useAnyTourLive: () => false }));
vi.mock('@/features/composer-flow/ComposerFlowSheet', () => ({ default: ({ open }: { open: boolean }) => (open ? <div data-composer-flow-sheet /> : null) }));

import GlobalBottomNavigation, { PostReviewMark } from '@/components/GlobalBottomNavigation';
import { navigationTabs } from '@/components/bottom-navigation/navigationTabs';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Post or review centre tab', () => {
  it('renders POST, the arrows and REVIEW in order, arrows exactly as wide as POST', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 31.5, height: 9 } as DOMRect);
    const { container } = render(<PostReviewMark color="#F7931E" />);
    const rows = [...container.querySelectorAll('[data-post-review-row]')].map((el) => el.getAttribute('data-post-review-row'));
    expect(rows).toEqual(['post', 'arrows', 'review']);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('31.5');
    expect(svg.getAttribute('viewBox')).toBe('0 0 31.5 14');
    expect(svg.querySelectorAll('path')[0].getAttribute('d')).toBe('M1 4H30.5M26.5 0.8 30.5 4 26.5 7.2');
  });

  it('labels the tab "Post or review", keeps id post, and opens ComposerFlowSheet on tap', () => {
    render(<MemoryRouter initialEntries={['/']}><GlobalBottomNavigation /></MemoryRouter>);
    expect(navigationTabs.find((t) => t.id === 'post')?.label).toBe('Post or review');
    const button = screen.getByRole('button', { name: 'Post or review' });
    expect(button.closest('li')?.style.flex).toMatch(/^1\.15/);
    expect(document.querySelector('[data-composer-flow-sheet]')).toBeNull();
    fireEvent.click(button);
    expect(document.querySelector('[data-composer-flow-sheet]')).not.toBeNull();
  });
});
