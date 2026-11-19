import React, { useState } from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: async () => ({ data: [], error: null }), from: () => { const q: Record<string, unknown> = {}; for (const k of ['select', 'eq', 'in', 'or', 'ilike', 'order']) q[k] = () => q; q.limit = async () => ({ data: [], error: null }); return q; } } }));
vi.mock('@/features/post-v2/hooks/useCoursePhoto', () => ({ useCoursePhoto: () => null }));
import { PlayedWithSection } from '@/features/post-v2/components/golf/GolfPostSections';
import { ComposerAttachRound, ComposerRoundsSheet } from '@/features/post-v2/components/golf/ComposerGolf';
import { captionMentionIds, toggleWith, type WithCandidate } from '@/features/post-v2/lib/golfPostRules';
import type { ComposerRound } from '@/features/post-v2/lib/composerGolfRules';

afterEach(cleanup);
const P = (id: string, name: string): WithCandidate => ({ id, name, avatarUrl: null, sameRound: false, lastInteraction: '', username: name.toLowerCase().replace(/\s/g, '') });
const mike = P('11111111-1111-4111-8111-111111111111', 'mikem84');
const andrew = P('22222222-2222-4222-8222-222222222222', 'Andrew Yetzes');
const groves = P('33333333-3333-4333-8333-333333333333', 'Michael Groves');
function Harness({ results = [], mentioned = [], onActive }: { results?: WithCandidate[]; mentioned?: WithCandidate[]; onActive?: (a: boolean) => void }) {
  const [tagged, setTagged] = useState<WithCandidate[]>([]);
  return <PlayedWithSection suggestions={results} tagged={tagged} onToggle={p => setTagged(c => toggleWith(c, p, 'me'))} search={async () => results} selfId="me" mentioned={mentioned} onActiveChange={onActive} />;
}
const css = readFileSync('src/features/post-v2/components/golf/composerGolf.css', 'utf8');

describe('post flow: switch, Played with, Choose a round', () => {
  it('(a) switch is a plain role=switch with a left-aligned knob, translating 18px (3px inside) when on', () => {
    const r: ComposerRound = { whs_score_id: 's', course_id: 'c', course_name: 'Sundridge Park', play_date: '2026-11-19', gross_score: 75, course_par: 71 };
    render(<ComposerAttachRound round={r} on={false} onToggle={() => {}} onDifferent={() => {}} shape={null} hole={null} />);
    const sw = screen.getByRole('switch', { name: 'Attach your round' });
    expect(sw.tagName).toBe('BUTTON');
    expect(sw.className).toBe('composer-golf-switch');
    const track = css.match(/\.composer-golf \.composer-golf-switch\{([^}]*)\}/)![1];
    expect(track).toContain('justify-content:flex-start');
    expect(track).toContain('width:46px'); expect(track).toContain('padding:3px');
    expect(css).toMatch(/\.composer-golf-switch\[aria-checked=true\] i\{transform:translateX\(18px\)\}/);
    // 46 - 3 padding - 22 knob - 18 translate = 3px inside the right edge.
    expect(46 - 3 - 22 - 18).toBe(3);
  });
  it('(b) a result tapped after the input blurs still adds the person as a chip', async () => {
    render(<Harness results={[groves]} />);
    const input = screen.getByRole('textbox', { name: 'Who did you play with?' });
    fireEvent.focus(input); fireEvent.change(input, { target: { value: 'Mi' } });
    const row = await screen.findByRole('button', { name: /Michael Groves/ });
    fireEvent.blur(input, { relatedTarget: null });
    fireEvent.pointerUp(row); fireEvent.click(row);
    expect(document.querySelector(`[data-chip="${groves.id}"]`)).not.toBeNull();
    expect(document.querySelectorAll('[data-chip]')).toHaveLength(1);
  });
  it('(c) focusing the input reports active, so the composer hides the ShareFooter', () => {
    const onActive = vi.fn();
    render(<Harness onActive={onActive} />);
    fireEvent.focus(screen.getByRole('textbox', { name: 'Who did you play with?' }));
    expect(onActive).toHaveBeenLastCalledWith(true);
    fireEvent.pointerDown(document.body);
    expect(onActive).toHaveBeenLastCalledWith(false);
    const src = readFileSync('src/features/post-v2/StageComposer.tsx', 'utf8');
    expect(src).toMatch(/\{!withActive && <ShareFooter/);
    expect(src).toMatch(/onActiveChange=\{setWithActive\}/);
  });
  it('(d) two member mentions offer two dashed adds; adding moves one to chips; businesses offer none', () => {
    const caption = `Great round with @[mikem84](u:${mike.id}) @[Andrew Yetzes](u:${andrew.id}) at @[Club](b:44444444-4444-4444-8444-444444444444) @[Me](u:55555555-5555-4555-8555-555555555555)`;
    expect(captionMentionIds(caption, '55555555-5555-4555-8555-555555555555')).toEqual([mike.id, andrew.id]);
    expect(captionMentionIds('@[Club](b:44444444-4444-4444-8444-444444444444)', null)).toEqual([]);
    render(<Harness mentioned={[mike, andrew]} />);
    const offers = within(screen.getByTestId('with-mentions')).getAllByRole('button');
    expect(offers).toHaveLength(2);
    fireEvent.click(offers[0]);
    expect(document.querySelector(`[data-chip="${mike.id}"]`)).not.toBeNull();
    expect(document.querySelector(`[data-offer="${mike.id}"]`)).toBeNull();
    expect(document.querySelector(`[data-offer="${andrew.id}"]`)).not.toBeNull();
  });
  it('(e) an added person shows Added and no Add; a mentioned person carries IN CAPTION', async () => {
    render(<Harness results={[mike, groves]} mentioned={[mike]} />);
    fireEvent.click(document.querySelector(`[data-offer="${mike.id}"]`)!);
    const input = screen.getByRole('textbox', { name: 'Who did you play with?' });
    fireEvent.focus(input); fireEvent.change(input, { target: { value: 'Mi' } });
    await screen.findByRole('button', { name: /Michael Groves/ });
    const row = [...document.querySelectorAll('.pf4-with-result')].find(r => r.textContent?.includes('mikem84'))!;
    expect(row).toHaveAttribute('data-added', 'true');
    expect(row.querySelector('.pf4-with-done')).not.toBeNull();
    expect(row.querySelector('.pf4-with-add')).toBeNull();
    expect(row.querySelector('.pf4-with-tagcap')).not.toBeNull();
    fireEvent.click(row);
    expect(document.querySelectorAll('[data-chip]')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Michael Groves/ }).querySelector('.pf4-with-add')).not.toBeNull();
  });
  it('(f) round sheet groups THIS WEEK / EARLIER, ticks attached, reds under par, tap picks and closes', () => {
    const now = new Date('2026-11-19T12:00:00');
    const rounds: ComposerRound[] = [
      { whs_score_id: 'thu', course_id: 'c', course_name: 'Sundridge Park Golf Club (East)', play_date: '2026-11-19', gross_score: 75, course_par: 71 },
      { whs_score_id: 'old', course_id: 'c', course_name: 'Sundridge Park (East)', play_date: '2026-11-06', gross_score: 69, course_par: 71, holes_played: 18 },
    ];
    const pick = vi.fn(); const close = vi.fn();
    render(<ComposerRoundsSheet open onClose={close} rounds={rounds} onPick={pick} attachedId="thu" now={now} />);
    const sheet = screen.getByTestId('rounds-sheet');
    expect(sheet.querySelector('[data-group="week"]')).not.toBeNull();
    expect(sheet.querySelector('[data-group="earlier"]')).not.toBeNull();
    const rows = sheet.querySelectorAll('.composer-rounds-row');
    expect(rows[0]).toHaveAttribute('data-selected', 'true');
    expect(rows[0].querySelector('.composer-rounds-tick[data-on] svg')).not.toBeNull();
    expect(rows[1].querySelector('.composer-rounds-tick svg')).toBeNull();
    expect(rows[1].querySelector('.composer-rounds-score small')).toHaveAttribute('data-under', 'true');
    expect(rows[0].querySelector('.composer-rounds-score small')).not.toHaveAttribute('data-under');
    fireEvent.click(rows[1]);
    expect(pick).toHaveBeenCalledWith(expect.objectContaining({ whs_score_id: 'old' }));
    expect(close).toHaveBeenCalled();
  });
  it('(g) 320 structure: rows and chips can shrink without overflow', () => {
    expect(css).toMatch(/\.composer-rounds-row\{display:grid;grid-template-columns:44px minmax\(0,1fr\) auto 22px/);
    expect(css).toMatch(/\.composer-rounds-course\{min-width:0\}/);
    expect(css).toMatch(/\.composer-rounds-course b\{[^}]*text-overflow:ellipsis/);
    expect(css).toMatch(/\.pf4-with \.pf4-with-offer\{[^}]*max-width:100%/);
    expect(css).toMatch(/\.pf4-with-chip\{[^}]*max-width:100%/);
  });
});
