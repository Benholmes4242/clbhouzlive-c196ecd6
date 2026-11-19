/** MESSAGES AMBER GLASS — own text bubbles are amber glass with white text. */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn(() => Promise.resolve({ data: null, error: null })) } }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/hooks/messaging/useMessagingActor', () => ({ useMessagingActor: () => ({ actorType: 'personal', actorId: 'me' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' } }) }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: null }), useAllScores: () => ({ data: [] }) }));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({ RoundDetailSheet: () => null }));
vi.mock('@/components/moderation/ReportSheet', () => ({ ReportSheet: () => null }));

import { MessageBubble } from '@/pages/messaging-v2/MessageBubble';
import { INK_ON_LIGHT } from '@/lib/tokens/surfaces';

afterEach(cleanup);
const base = { id: 'm1', conversation_id: 'c1', sender_actor_type: 'personal', sender_actor_id: 'me', sender_user_id: 'me', sender_name: 'Me', sender_avatar_url: null, sender_username: 'me', sender_verified: null, type: 'text', body: 'Hello there', attachments: null, metadata: null, reply_to_id: null, reply_preview: null, edited_at: null, deleted_at: null, created_at: '2026-10-29T06:44:00Z', reactions: [], status: 'sent' };
const mount = (over: Record<string, unknown> = {}, isOutgoing = true) => render(<MemoryRouter><MessageBubble message={{ ...base, ...over } as never} isOutgoing={isOutgoing} isFirstOfRun isLastOfRun showTicks={false} /></MemoryRouter>).container;
const bubbleOf = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('div')].find(d => d.style.maxWidth === '78%')!;
const ns = (v: string | null | undefined) => (v ?? '').replace(/\s+/g, '').replace(/0\.(\d)0\b/g, '0.$1');
const rgb = (hex: string) => { const n = parseInt(hex.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };

describe('own bubble amber glass', () => {
  it('(a) outgoing text bubble: amber gradient, inset amber edge, #F4F6F8 text', () => {
    const b = bubbleOf(mount());
    // jsdom's CSS parser rejects gradient backgrounds, so the rendered style
    // cannot carry it; the fill is asserted on the bubble's OUT_BG source.
    const src = readFileSync('src/pages/messaging-v2/MessageBubble.tsx', 'utf8');
    expect(src).toMatch(/background: isDeleted \|\| hugMedia \? 'transparent' : bg,/);
    expect(ns(src.match(/const OUT_BG = '([^']+)'/)?.[1])).toBe(ns('linear-gradient(155deg, rgba(247,147,30,0.30) 0%, rgba(247,147,30,0.16) 100%)'));
    expect(ns(b.style.boxShadow)).toBe(ns('inset 0 0 0 1px rgba(247,147,30,0.48)'));
    expect(b.style.color).toBe(rgb('#F4F6F8'));
  });
  it('(b) incoming bubble keeps ec-glass and its fill, with no amber', () => {
    const b = bubbleOf(mount({ sender_user_id: 't', sender_actor_id: 't' }, false));
    expect(b.className).toContain('ec-glass');
    expect(b.style.background).toBe('rgba(255, 255, 255, 0.1)');
    expect(b.outerHTML).not.toMatch(/247, ?147, ?30/);
  });
  it('(c) outgoing reply quote: amber rule, #FFD9A8 name, #E6CDAA snippet', () => {
    const c = mount({ reply_preview: { id: 'r', sender_name: 'Thomas', body: 'See you on the 1st', type: 'text' } });
    const quote = [...c.querySelectorAll<HTMLElement>('div')].find(d => d.style.borderLeft.startsWith('2px solid'))!;
    expect(ns(quote.style.borderLeft)).toBe(ns('2px solid rgba(247,147,30,0.70)'));
    const [name, snippet] = [...quote.querySelectorAll<HTMLElement>('span')];
    expect(name.style.color).toBe(rgb('#FFD9A8'));
    expect(name.style.fontWeight).toBe('600');
    expect(snippet.style.color).toBe(rgb('#E6CDAA'));
  });
  it('(d) outgoing action row has the amber 0.35 top rule', () => {
    const c = mount({ metadata: { action: { label: 'Connect your handicap', route: '/settings' } } });
    const btn = c.querySelector<HTMLElement>('button.w-full')!;
    expect(ns(btn.style.borderTopColor)).toBe(ns('rgba(247,147,30,0.35)'));
    expect(btn.style.color).toBe(rgb('#F4F6F8'));
  });
  it('(e) reaction chip under an outgoing bubble stays white with INK_ON_LIGHT', () => {
    const c = mount({ reactions: [{ emoji: '👍', actor_id: 'x', actor_type: 'personal', user_id: 'x' }] });
    const chip = [...c.querySelectorAll<HTMLElement>('span')].find(s => s.style.borderRadius === '11px')!;
    expect(chip.style.background).toBe('rgb(255, 255, 255)');
    const probe = document.createElement('span'); probe.style.color = INK_ON_LIGHT;
    expect(chip.style.color).toBe(probe.style.color);
  });
});
