/* EP5.2 — sheets portalled, cropper owns its stylesheet, club search offset, coach search states. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const s = vi.hoisted(() => ({ search: Promise.resolve({ data: [] as unknown[], error: null as unknown }) }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: { id: 'conn' }, isLoading: false, isError: false }), useHandicapTrend: () => ({ data: { current: 12 }, isLoading: false, isError: false }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc: async () => ({ data: null, error: null }),
  from: () => { const q: Record<string, unknown> = {}; for (const m of ['select', 'ilike', 'eq', 'in', 'limit']) q[m] = () => q; q.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => s.search.then(resolve, reject); return q; },
} }));
import { BizcSheet } from '@/features/business-create/BusinessCreateStep3';
import { YourCoachRow } from '@/features/coach/CoachSheets';

const src = (p: string) => readFileSync(p, 'utf8');
afterEach(() => cleanup());

describe('EP5.2 sheets', () => {
  it('BizcSheet renders into document.body, not inside .ep-body', () => {
    render(<div className="ep-body" data-host><BizcSheet title="T" testId="sheet" onDone={() => {}}><p>x</p></BizcSheet></div>);
    const sheet = document.querySelector('[data-testid="sheet"]') as HTMLElement;
    expect(sheet.parentElement).toBe(document.body);
    expect(document.querySelector('[data-host]')?.contains(sheet)).toBe(false);
    expect(document.querySelector('[data-host] .bizc-sheet-scrim')).toBeNull();
  });
  it('.ep-body has no will-change or transform', () => {
    const rule = src('src/features/edit-profile/edit-profile.css').match(/\.ep-body\{[^}]*\}/)?.[0] ?? '';
    expect(rule).not.toBe('');
    expect(rule).not.toMatch(/will-change|transform/);
  });
});

describe('EP5.2 cropper stylesheet', () => {
  it('WelcomeCropper imports its own stylesheet with head, foot, cancel and use rules', () => {
    expect(src('src/features/onboarding/WelcomeCropper.tsx')).toContain("import './welcome-cropper.css'");
    const css = src('src/features/onboarding/welcome-cropper.css');
    for (const sel of ['.welcome-cropper{', '.welcome-cropper-head{', '.welcome-cropper-foot{', '.welcome-cropper-cancel{', '.welcome-cropper-use{', '.welcome-crop-area{']) expect(css).toContain(sel);
    expect(src('src/styles/welcome.css')).not.toContain('.welcome-cropper-head{');
  });
  it('setup and Create a business still use the shared cropper', () => {
    expect(src('src/pages/Welcome.tsx')).toContain('<WelcomeCropper');
    expect(src('src/features/business-create/BusinessCreateStep4.tsx')).toContain('<WelcomeCropper');
  });
});

describe('EP5.2 club search position', () => {
  it('KeyboardSearchSheet passes no bottomOffset in any mode', () => {
    const file = src('src/features/composer-flow/KeyboardSearchSheet.tsx');
    expect(file).not.toContain('bottomOffset');
    expect(file).toContain('autoFocus={club}');
  });
});

describe('EP5.2 coach search states', () => {
  const open = async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><YourCoachRow viewerId="me" /></MemoryRouter></QueryClientProvider>);
    await waitFor(() => expect(document.querySelector('[data-your-coach]')).not.toBeNull());
    fireEvent.click(document.querySelector('[data-your-coach]') as HTMLElement);
    const input = await waitFor(() => { const n = document.querySelector('[data-coach-search]'); if (!n) throw new Error('no field'); return n as HTMLInputElement; });
    fireEvent.change(input, { target: { value: 'zzz' } });
  };
  it('shows a status while pending', async () => {
    s.search = new Promise(() => {});
    await open();
    await waitFor(() => expect(document.querySelector('[data-coach-search-loading][role="status"]')).not.toBeNull());
  });
  it('shows the no-match lines on an empty result', async () => {
    s.search = Promise.resolve({ data: [], error: null });
    await open();
    await waitFor(() => expect(document.querySelectorAll('[data-coach-search-empty] p')).toHaveLength(2));
  });
  it('shows the error line on failure', async () => {
    s.search = Promise.resolve({ data: null as unknown as unknown[], error: { message: 'boom' } });
    await open();
    await waitFor(() => expect(document.querySelector('[data-coach-search-error]')).not.toBeNull());
    expect(document.querySelector('[data-coach-search-empty]')).toBeNull();
  });
});
