/** Post/review centre tab: POST / ink-cropped two-way arrows / REVIEW,
 *  aria-label "Post or review", tap opens step 1. */
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
  it('renders POST, the arrows and REVIEW in order with cap-trimmed words and ink-cropped arrows', () => {
    const { container } = render(<PostReviewMark color="#F7931E" />);
    const rows = [...container.querySelectorAll('[data-post-review-row]')].map((el) => el.getAttribute('data-post-review-row'));
    expect(rows).toEqual(['post', 'arrows', 'review']);
    const svg = container.querySelector('svg');
    if (!svg) throw new Error('Missing arrows svg');
    expect(svg.getAttribute('width')).toBe('14');
    expect(svg.getAttribute('height')).toBe('11.9');
    expect(svg.getAttribute('viewBox')).toBe('0 1.8 24 20.4');
    expect(svg.getAttribute('stroke-width')).toBe('2.4');
    expect(svg.querySelectorAll('path')[0].getAttribute('d')).toBe('M8 7H20M16 3l4 4-4 4');
    expect(svg.querySelectorAll('path')[1].getAttribute('d')).toBe('M16 17H4M8 13l-4 4 4 4');
    for (const word of container.querySelectorAll<HTMLElement>('span[data-post-review-row]')) {
      expect(word.style.display).toBe('block');
      expect(word.style.getPropertyValue('text-box')).toBe('trim-both cap alphabetic');
    }
  });

  it('labels the tab "Post or review", keeps id post, and opens ComposerFlowSheet on tap', () => {
    render(<MemoryRouter initialEntries={['/']}><GlobalBottomNavigation /></MemoryRouter>);
    expect(navigationTabs.find((t) => t.id === 'post')?.label).toBe('Post or review');
    const button = screen.getByRole('button', { name: 'Post or review' });
    expect(button.style.justifyContent).toBe('center');
    expect(button.style.gap).toBe('3.5px');
    expect(button.style.padding).toBe('0px 3px');
    expect(button.closest('li')?.style.flex).toMatch(/^1\.15/);
    expect(document.querySelector('[data-composer-flow-sheet]')).toBeNull();
    fireEvent.click(button);
    expect(document.querySelector('[data-composer-flow-sheet]')).not.toBeNull();
  });
});
