import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({ keyboard: 260, picked: vi.fn(), close: vi.fn(), mutate: vi.fn(async () => {}), pending: false, request: vi.fn(), rows: [] as { id: string; name: string; sub_country: string; region: string; country: null; member_count: number }[] }));
vi.mock('@/hooks/messaging/useKeyboardHeight', () => ({ default: () => h.keyboard }));
vi.mock('@/features/home-club/useHomeClubSearch', () => ({ useHomeClubSearch: () => ({ data: h.rows, loading: false, error: null }) }));
vi.mock('@/features/home-club/useSetHomeClub', () => ({ useSetHomeClub: () => ({ mutateAsync: h.mutate, isPending: h.pending }) }));
vi.mock('@/components/courses/RequestCourseCTA', () => ({ RequestCourseCTA: (p: { homeClub: boolean; prefillName: string; onBeforeOpen: () => void }) => <button onClick={() => { p.onBeforeOpen(); h.request(p.prefillName, p.homeClub); }}>Request club</button> }));
import KeyboardSearchSheet from '@/features/composer-flow/KeyboardSearchSheet';
import { KeyboardClubSearchSheet } from '@/features/home-club/KeyboardClubSearchSheet';
beforeEach(() => { vi.clearAllMocks(); h.pending = false; h.rows = [{ id: 'park', name: 'Park Golf Club', sub_country: 'Kent', region: 'Bromley', country: null, member_count: 2 }]; });
afterEach(cleanup);
function Shell({ mode }: { mode: 'review' | 'club' }) { const [query, change] = useState(''); return <KeyboardSearchSheet mode={mode} open onClose={h.close} title="Search" placeholder="Search" clearLabel="Clear" closeLabel="Close" query={query} onQueryChange={change} testId="shell"><div>Rows</div></KeyboardSearchSheet>; }
describe('EP5.1 shared keyboard search', () => {
  it('review mode stays unfocused and does not lift above the keyboard', () => { render(<Shell mode="review" />); const input = screen.getByRole('searchbox'); expect(input).not.toHaveAttribute('autofocus'); expect(input).not.toBe(document.activeElement); expect(screen.getByTestId('shell').closest('.post-or-review-surface')?.parentElement?.style.paddingBottom).toBe(''); });
  it('club mode focuses and docks using the existing keyboard height', () => { render(<Shell mode="club" />); expect(screen.getByRole('searchbox')).toBe(document.activeElement); expect(screen.getByTestId('shell')).toHaveAttribute('data-mode', 'club'); expect(screen.getByTestId('shell').closest('.post-or-review-surface')?.parentElement?.style.paddingBottom).toBe('260px'); });
  it('club mode shares first-character height hold until clear', () => { render(<Shell mode="club" />); const body = screen.getByTestId('shell'); const measure = vi.spyOn(body, 'getBoundingClientRect').mockReturnValue({ height: 280 } as DOMRect); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'P' } }); expect(body.style.minHeight).toBe('280px'); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Park' } }); expect(measure).toHaveBeenCalledTimes(1); fireEvent.click(screen.getByRole('button', { name: 'Clear', exact: true })); expect(body.style.minHeight).toBe(''); measure.mockRestore(); });
  it('a club row requires confirmation and uses the supplied selection path without a second writer', async () => { render(<KeyboardClubSearchSheet open onClose={h.close} onSelected={h.picked} />); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Park' } }); fireEvent.click(document.querySelector('[data-club="park"]') as HTMLElement); expect(h.picked).not.toHaveBeenCalled(); fireEvent.click(screen.getByRole('button', { name: 'Confirm home club' })); await waitFor(() => expect(h.picked).toHaveBeenCalledWith({ id: 'park', name: 'Park Golf Club' })); expect(h.mutate).not.toHaveBeenCalled(); expect(h.close).toHaveBeenCalledTimes(1); });
  it('without a callback confirmation uses the canonical mutation', async () => { render(<KeyboardClubSearchSheet open onClose={h.close} />); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Park' } }); fireEvent.click(document.querySelector('[data-club="park"]') as HTMLElement); fireEvent.click(screen.getByRole('button', { name: 'Confirm home club' })); await waitFor(() => expect(h.mutate).toHaveBeenCalledWith({ id: 'park', name: 'Park Golf Club' })); expect(h.close).toHaveBeenCalledTimes(1); });
  it('pending confirmation cannot submit', () => { h.pending = true; render(<KeyboardClubSearchSheet open onClose={h.close} onSelected={h.picked} />); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Park' } }); fireEvent.click(document.querySelector('[data-club="park"]') as HTMLElement); expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled(); expect(h.picked).not.toHaveBeenCalled(); });
  it('missing clubs retain prefilled home-club request and close-first handoff', () => { h.rows = []; render(<KeyboardClubSearchSheet open onClose={h.close} />); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'New Park' } }); fireEvent.click(screen.getByRole('button', { name: 'Request club' })); expect(h.request).toHaveBeenCalledWith('New Park', true); expect(h.close).toHaveBeenCalledTimes(1); });
});
describe('EP5.1 cursor sweep', () => {
  it('has a non-important global white default and no amber/primary caret in source', () => {
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toMatch(/@layer base\s*\{[^}]*input, textarea, \[contenteditable="true"\] \{ caret-color: #F8FAFC; \}/);
    const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(dir, e.name)) : /\.(css|tsx?|jsx?)$/.test(e.name) && !/\.(test|spec)\./.test(e.name) ? [join(dir, e.name)] : []);
    const offenders = files('src').filter(file => /(?:caret-color|caretColor)\s*:\s*[^;\n}]*?(?:#f7931e|--primary|AMBER|accent-color)|caret-(?:primary|amber|\[#[fF]7931[eE]\])/i.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});