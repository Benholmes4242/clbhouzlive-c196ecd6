import React from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import enCourses from '../../public/locales/en/courses.json';
import { MotionGlobalConfig } from 'framer-motion';
import { Z } from '@/config/zIndex';
import { RoundsGate } from '@/features/explore-magazine/RoundsGate';
import GlobalBottomNavigation from '@/components/GlobalBottomNavigation';
import { __resetScrollerCache } from '@/lib/getScrollParent';
import * as scrollStore from '@/hooks/useScrollDirection';

vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/contexts/BottomNavigationContext', () => ({ useBottomNavigation: () => ({ isVisible: true }) }));
vi.mock('@/contexts/ModalContext', () => ({ useModalContext: () => ({ shouldHideHeader: false }) }));
vi.mock('@/hooks/useAppPrefetch', () => ({ useAppPrefetch: () => ({ triggerPrefetch: vi.fn() }) }));
vi.mock('@/stores/discoverNewStore', () => ({ useDiscoverNewTotal: () => 0 }));
vi.mock('@/hooks/useNavTheme', () => ({ useNavTheme: () => 'dark' }));
vi.mock('@/features/tourhub/hooks/useAnyTourLive', () => ({ useAnyTourLive: () => false }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null }) }));
vi.mock('@/features/composer-flow/ComposerFlowSheet', () => ({ default: ({ open }: { open: boolean }) => open ? <div data-composer-flow-sheet="" /> : null }));

const i18n = createInstance();
let prevSkip = false;
beforeAll(() => { prevSkip = MotionGlobalConfig.skipAnimations; MotionGlobalConfig.skipAnimations = true; });
afterAll(() => { MotionGlobalConfig.skipAnimations = prevSkip; });
beforeAll(async () => { await i18n.use(initReactI18next).init({ lng: 'en', resources: { en: { courses: enCourses } }, interpolation: { escapeValue: false } }); });
let root: HTMLDivElement;
beforeEach(() => {
  vi.useFakeTimers();
  scrollStore.resetToExpanded();
  __resetScrollerCache();
  root = document.createElement('div'); root.id = 'root'; root.style.overflowY = 'auto'; document.body.append(root);
});
afterEach(() => { cleanup(); root.remove(); __resetScrollerCache(); scrollStore.resetToExpanded(); vi.useRealTimers(); vi.restoreAllMocks(); });
function Probe() { return <output data-testid="destination">{useLocation().pathname}</output>; }
function mount() {
  return render(<MemoryRouter initialEntries={['/amateur']}><I18nextProvider i18n={i18n}><div className="app-shell"><Routes><Route path="/amateur" element={<RoundsGate><div data-board-row="" /></RoundsGate>} /><Route path="/" element={<div data-home="" />} /></Routes><GlobalBottomNavigation /><Probe /></div></I18nextProvider></MemoryRouter>, { container: root });
}
function lock() { act(() => vi.advanceTimersByTime(3000)); }
function ancestorContexts(el: Element) {
  const contexts: Element[] = [];
  for (let parent = el.parentElement; parent; parent = parent.parentElement) {
    const s = getComputedStyle(parent);
    if ((s.zIndex && s.zIndex !== 'auto' && ['relative', 'absolute', 'fixed', 'sticky'].includes(s.position)) || (s.transform && s.transform !== 'none') || (s.filter && s.filter !== 'none') || s.isolation === 'isolate' || /transform|filter|opacity/.test(s.willChange) || /paint|layout|strict|content/.test(s.contain)) contexts.push(parent);
  }
  return contexts;
}
describe('Locked rounds navigation', () => {
  it('renders accessible visible nav above the body shade and card in the same effective stacking context', () => {
    mount(); lock();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const pill = nav.querySelector<HTMLElement>('[data-chrome="bottom-nav"]');
    const shade = document.querySelector<HTMLElement>('[data-rounds-gate-shade]');
    const card = document.querySelector<HTMLElement>('[data-rounds-gate-card]');
    if (!pill || !shade || !card) throw new Error('Missing locked gate chrome');
    expect(nav).toBeVisible(); expect(pill).toHaveAttribute('aria-hidden', 'false');
    expect(nav.closest('[inert], [aria-hidden="true"]')).toBeNull();
    expect(pill.closest('[inert]')).toBeNull();
    expect(ancestorContexts(nav)).toEqual(ancestorContexts(shade));
    expect(ancestorContexts(nav)).toEqual(ancestorContexts(card));
    expect(shade.parentElement).toBe(document.body); expect(card.parentElement).toBe(document.body);
    expect(getComputedStyle(nav).zIndex).toBe('100');
    expect(shade.style.zIndex).toBe('98'); expect(card.style.zIndex).toBe('99');
    expect(screen.getByRole('button', { name: 'Explore' })).toHaveAttribute('aria-current', 'page');
  });
  it('keeps the nav at Z.bottomNav (100), below alert dialogs (200)', () => {
    mount(); const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(Z.bottomNav).toBe(100); expect(Number(getComputedStyle(nav).zIndex)).toBe(Z.bottomNav);
    expect(Number(getComputedStyle(nav).zIndex)).toBeLessThan(200);
  });
  it('holds the expansion lease only while locked and releases it on unmount', () => {
    const release = vi.fn(); const push = vi.spyOn(scrollStore, 'pushForceExpand').mockReturnValue(release);
    const view = mount(); expect(push).not.toHaveBeenCalled(); lock(); expect(push).toHaveBeenCalledTimes(1);
    expect(release).not.toHaveBeenCalled(); view.unmount(); expect(release).toHaveBeenCalledTimes(1);
  });
  it('overrides scroll condensation while locked and permits it again after leaving', () => {
    const scroller = document.createElement('div'); document.body.append(scroller);
    const unregister = scrollStore.registerNavScroller(scroller);
    const view = mount(); scroller.scrollTop = 100; fireEvent.scroll(scroller); act(() => vi.advanceTimersByTime(20));
    expect(document.querySelector<HTMLElement>('[data-chrome="bottom-nav"]')?.style.maxWidth).toContain('324px');
    lock(); expect(document.querySelector<HTMLElement>('[data-chrome="bottom-nav"]')?.style.maxWidth).toContain('396px');
    scroller.scrollTop = 200; fireEvent.scroll(scroller); act(() => vi.advanceTimersByTime(20));
    expect(document.querySelector<HTMLElement>('[data-chrome="bottom-nav"]')?.style.maxWidth).toContain('396px');
    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    scroller.scrollTop = 300; fireEvent.scroll(scroller); act(() => vi.advanceTimersByTime(20));
    expect(document.querySelector<HTMLElement>('[data-chrome="bottom-nav"]')?.style.maxWidth).toContain('324px');
    view.unmount(); unregister(); scroller.remove();
  });
  it('Home navigates away and unmounts the gate without remounting nav', () => {
    mount(); lock(); const nav = screen.getByRole('navigation', { name: 'Main' });
    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(screen.getByTestId('destination')).toHaveTextContent('/');
    expect(document.querySelector('[data-rounds-gate-card]')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBe(nav);
  });
  it('the post or review action still opens its sheet while locked', () => {
    mount(); lock(); fireEvent.click(screen.getByRole('button', { name: 'Post or review' }));
    expect(document.querySelector('[data-composer-flow-sheet]')).not.toBeNull();
  });
});