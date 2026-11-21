import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import type { BagItem, Partner, CareerMoment } from '@/features/pro-profile/proCollectionRules';

const h = vi.hoisted(() => ({bag: [] as BagItem[], partners: [] as Partner[], moments: [] as CareerMoment[], enabled: false, failed: '' as string, pending: '' as string}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/guest/guestGateStore', () => ({getGuestUser: () => null}));
vi.mock('@/features/guest/useGuestActionGate', () => ({useGuestActionGate: () => () => false}));
vi.mock('@/integrations/supabase/client', () => ({supabase: {rpc: vi.fn(async () => ({data: true, error: null}))}}));
vi.mock('@/features/pro-profile/useProCollections', () => ({
 useProBag: () => ({data: h.bag, isSuccess: h.pending !== 'bag', isError: h.failed === 'bag'}),
 useProPartners: () => ({data: h.partners, isSuccess: h.pending !== 'partners', isError: h.failed === 'partners'}),
 useProCareer: () => ({data: h.moments, isSuccess: true, isError: false}),
 useProBusinesses: () => ({data: [], isSuccess: true, isError: false}),
 useProBusinessSearch: () => ({data: [], isSuccess: true, isError: false}),
 useCollectionWrite: () => vi.fn(async () => true),
}));
vi.mock('@/features/pro-profile/useProAsk', () => ({
 askKey: (id: string) => ['pro-profile', 'ask', id],
 useProAnswers: () => ({data: {enabled: h.enabled, total: 0, waiting: 0, answers: [], my_waiting: []}, isSuccess: h.pending !== 'questions', isError: h.failed === 'questions'}),
 useProAskWrite: () => vi.fn(async () => true),
 useProInbox: () => ({data: [], isSuccess: true, isError: false}),
 useMyAskerLabel: () => ({data: {club: null, public: false}, isSuccess: true, isError: false}),
}));
import { ProOwnerSections } from '@/features/pro-profile/ProOwnerSections';
import { ProCollectionSections } from '@/features/pro-profile/ProCollectionSections';

const bag: BagItem = {id: 'bag', user_id: 'pro', slot: 'driver', brand: 'Titleist', model: 'GT3', detail: null, business_id: null, sort: 0, created_at: '2026-01-01', updated_at: '2026-01-01'};
const partner: Partner = {id: 'partner', user_id: 'pro', name: 'Sponsor', website: null, business_id: null, sort: 0, created_at: '2026-01-01', updated_at: '2026-01-01'};
const moment: CareerMoment = {id: 'moment', user_id: 'pro', year: 2020, text: 'Turned pro', is_win: false, sort: 0, created_at: '2026-01-01', updated_at: '2026-01-01'};
function mount(owner = true) {
 return render(<QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}><MemoryRouter><ProOwnerSections userId="pro" owner={owner} first="Alfie" events={[]} eventsReady showCareer viewerId="viewer" /></MemoryRouter></QueryClientProvider>);
}
function row(key: string) {const el = document.querySelector(`[data-pro-completion-row="${key}"]`);if (!(el instanceof HTMLElement)) throw new Error(`Missing ${key} completion row`);return el;}
beforeEach(() => {h.bag=[];h.partners=[];h.moments=[];h.enabled=false;h.failed='';h.pending='';});
afterEach(cleanup);

describe('Signed-off Tour-pro owner completion', () => {
 it('empty owner has zero of three done and ordered doors without empty sections', () => {
  const {container}=mount();
  expect(container.querySelector('[data-pro-completion-count]')).toHaveTextContent('0 of 3 done');
  expect([...container.querySelectorAll('[data-pro-completion-row]')].map(el=>el.getAttribute('data-pro-completion-row'))).toEqual(['bag','partners','questions']);
  expect(container.querySelector('[data-pro-bag],[data-pro-partners],[data-pro-ask]')).toBeNull();
  expect(container.querySelector('.pro-profile-dashed')).toBeNull();
 });
 it('one bag item completes one item and reveals the bag section', () => {
  h.bag=[bag];const {container}=mount();
  expect(container.querySelector('[data-pro-completion-count]')).toHaveTextContent('1 of 3 done');
  expect([...container.querySelectorAll('[data-pro-completion-row]')].map(el=>el.getAttribute('data-pro-completion-row'))).toEqual(['partners','questions']);
  expect(container.querySelector('[data-pro-bag]')).not.toBeNull();
 });
 it('all three complete removes the card and retains enabled empty Ask', () => {
  h.bag=[bag];h.partners=[partner];h.enabled=true;const {container}=mount();
  expect(container.querySelector('[data-pro-completion]')).toBeNull();
  expect(container.querySelector('[data-pro-bag]')).not.toBeNull();
  expect(container.querySelector('[data-pro-partners]')).not.toBeNull();
  expect(container.querySelector('[data-pro-ask] .pro-profile-dashed')).not.toBeNull();
 });
 it('visitor never sees owner completion', () => {const {container}=mount(false);expect(container.querySelector('[data-pro-completion]')).toBeNull();expect(container.querySelector('[data-pro-completion-row]')).toBeNull();});
 it.each(['bag','partners','questions'])('failed %s read suppresses the card even with stale data', kind => {h.failed=kind;h.bag=[bag];const {container}=mount();expect(container.querySelector('[data-pro-completion]')).toBeNull();});
 it.each(['bag','partners','questions'])('pending %s read suppresses the card', kind => {h.pending=kind;const {container}=mount();expect(container.querySelector('[data-pro-completion]')).toBeNull();});
 it('bag door opens the existing new-club editor', () => {mount();fireEvent.click(row('bag'));expect(screen.getByRole('radiogroup',{name:'What is it'})).toBeInTheDocument();expect(screen.getByLabelText('BRAND')).toBeInTheDocument();});
 it('partners door opens the existing partner editor', () => {mount();fireEvent.click(row('partners'));expect(screen.getByLabelText('PARTNER NAME')).toBeInTheDocument();expect(screen.getByLabelText('SEARCH CLBHOUZ')).toBeInTheDocument();});
 it('questions door opens and dismisses the existing explainer', async () => {mount();fireEvent.click(row('questions'));expect(screen.getByRole('button',{name:'Turn on Ask Alfie'})).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Not now'}));expect(screen.queryByRole('button',{name:'Turn on Ask Alfie'})).toBeNull();});
});

describe('Signed-off Tour-pro Career header', () => {
 it('zero owner entries retain header Add and helper, without a dashed box', () => {const {container}=mount();const career=container.querySelector('[data-pro-career]');if (!(career instanceof HTMLElement)) throw new Error('Missing owner Career');expect(within(career).getByRole('button',{name:'Add'})).toHaveClass('pro-collection-edit');expect(career.querySelector('.pro-career-empty')).not.toBeNull();expect(career.querySelector('.pro-profile-add')).toBeNull();fireEvent.click(within(career).getByRole('button',{name:'Add'}));expect(screen.getByLabelText('WHAT HAPPENED')).toBeInTheDocument();});
 it('own moments replace Add with the existing Edit list', () => {h.moments=[moment];const {container}=mount();const career=container.querySelector('[data-pro-career]');if (!(career instanceof HTMLElement)) throw new Error('Missing owner Career');expect(within(career).queryByRole('button',{name:'Add'})).toBeNull();fireEvent.click(within(career).getByRole('button',{name:'Edit'}));expect(screen.getByRole('button',{name:/2020 · Turned pro/})).toBeInTheDocument();expect(career.querySelector('.pro-profile-add')).toBeNull();});
 it('zero visitor entries omit Career', () => {const {container}=mount(false);expect(container.querySelector('[data-pro-career]')).toBeNull();});
 it('standalone collection retains the same header add sheet', () => {render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><ProCollectionSections userId="pro" owner first="Alfie" events={[]} eventsReady /></MemoryRouter></QueryClientProvider>);fireEvent.click(screen.getByRole('button',{name:'Add'}));expect(screen.getByLabelText('WHAT HAPPENED')).toBeInTheDocument();});
 it('stylesheet removes all 800 weights and keeps signed-off hero sizes', () => {const css=readFileSync('src/features/pro-profile/pro-profile.css','utf8');expect(css).not.toMatch(/font-weight\s*:\s*800/);expect(css.match(/\.pro-hero-headline>strong\s*\{([^}]+)/)?.[1]).toContain('font-size:40px; font-weight:700; line-height:.9');expect(css.match(/\.pro-hero-name\s*\{([^}]+)/)?.[1]).toContain('font-size:26px; font-weight:700; line-height:1.1');});
});
