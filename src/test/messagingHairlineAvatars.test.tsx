/** MESSAGING AVATARS: HAIRLINE EVERYWHERE — every messaging SquircleAvatar
 * takes the canonical hairline; the fourball separator is an outer shadow. */
import React from 'react';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn(() => Promise.resolve({ data: null, error: null })) } }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/hooks/messaging/useMessagingActor', () => ({ useMessagingActor: () => ({ actorType: 'personal', actorId: 'me' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' } }) }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: null }), useAllScores: () => ({ data: [] }) }));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({ RoundDetailSheet: () => null }));
vi.mock('@/components/moderation/ReportSheet', () => ({ ReportSheet: () => null }));

afterEach(cleanup);
const DIR = 'src/pages/messaging-v2';
const files = readdirSync(DIR).filter(f => f.endsWith('.tsx'));
const tags = (src: string) => src.match(/<SquircleAvatar\b[^>]*?\/?>/gs) ?? [];

describe('messaging avatars: hairline everywhere', () => {
  it('(a) every messaging SquircleAvatar passes hairlineRing without ring overrides', () => {
    let count = 0;
    for (const f of files) {
      for (const tag of tags(readFileSync(`${DIR}/${f}`, 'utf8'))) {
        count++;
        expect(tag, f).toMatch(/\bhairlineRing\b/);
        expect(tag, f).not.toMatch(/\b(ringColor|ringWidth|thinRing)\b/);
      }
    }
    expect(count).toBeGreaterThan(0);
    expect(tags(readFileSync(`${DIR}/MemberRailTile.tsx`, 'utf8')).join('')).toMatch(/\bhairlineRing\b/);
  });
  it('(b) an incoming last-of-run bubble avatar renders the hairline overlay and no 2px border', async () => {
    const { MessageBubble } = await import('@/pages/messaging-v2/MessageBubble');
    const message = { id: 'm1', conversation_id: 'c1', sender_actor_type: 'personal', sender_actor_id: 't', sender_user_id: 't', sender_name: 'Thomas Holmes', sender_avatar_url: null, sender_username: 't', sender_verified: null, type: 'text', body: 'Hello', attachments: null, metadata: null, reply_to_id: null, reply_preview: null, edited_at: null, deleted_at: null, created_at: '2026-10-29T06:44:00Z', reactions: [], status: 'sent' };
    render(<MemoryRouter><MessageBubble message={message as never} isOutgoing={false} isFirstOfRun isLastOfRun showTicks={false} /></MemoryRouter>);
    const slot = screen.getByTestId('incoming-avatar-slot');
    const els = [...slot.querySelectorAll<HTMLElement>('*')];
    expect(els.some(e => e.getAttribute('aria-hidden') !== null && /^1px solid/.test(e.style.border))).toBe(true);
    expect(els.some(e => /^2px solid/.test(e.style.border))).toBe(false);
  });
  it('(c) the fourball wrapper has no 2px solid border', () => {
    const src = readFileSync(`${DIR}/NewConversationSheet.tsx`, 'utf8');
    const card = src.slice(src.indexOf('data-testid="fourball-card"'), src.indexOf("compose.lastFourball"));
    expect(card).not.toMatch(/2px solid/);
    expect(card).toMatch(/boxShadow: '0 0 0 1\.5px #1E1E23'/);
  });
});
