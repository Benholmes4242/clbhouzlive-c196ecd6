import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { FeedPost } from '@/components/media-system/types/media';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/pro-verification/useProMembers', () => ({ useProMembers: () => ({ members: new Map() }) }));
vi.mock('@/features/amateur-ranking/useAmateurMembers', () => ({ useAmateurMembers: () => ({ members: new Map([['member', {}]]) }) }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));
import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
import { ReviewPostCard } from '@/components/feed/ReviewPostCard';
const post = { id: 'post', userId: 'member', actorType: 'personal', displayName: 'Ben Loveard', createdAt: '2026-11-18', caption: 'A full review excerpt with enough words to wrap onto the second line.', review: { courseName: 'Reflection Bay', rating: 9, reviewText: 'A full review excerpt with enough words to wrap onto the second line.' }, mediaItems: [] } as unknown as FeedPost;
afterEach(cleanup);
describe('review excerpt text flow', () => {
  it('media-first review body opts every nested member name into text flow', () => {
    const { container } = render(<MemoryRouter><ReviewPostCard post={post} layout="mediaFirst" articleRef={null} onProfile={() => {}} onReadReview={() => {}} onPrefetch={() => {}} media={<span data-media />} footer={null} /></MemoryRouter>);
    const body = container.querySelector('[data-review-body]');
    expect(body?.querySelector('[data-flow="text"]')).not.toBeNull();
    expect(body?.querySelector('.pro-inline-name:not([data-flow])')).toBeNull();
    expect(body?.querySelector('.pro-label')).toHaveAttribute('data-kind', 'am');
    expect(container.querySelector('[data-review-who] .pro-inline-name')).not.toHaveAttribute('data-flow');
    const css = readFileSync('src/features/pro-verification/pro-label.css', 'utf8');
    const badgeRule = css.match(/\.pro-inline-name\[data-flow="text"\] \.pro-label\s*\{([^}]*)\}/)?.[1];
    expect(badgeRule).toMatch(/(?:^|;)\s*font-size:\s*7\.5px\s*;/);
    expect(badgeRule).toMatch(/(?:^|;)\s*line-height:\s*1\s*;/);
  });
  it('default member name preserves its existing structure including badge attributes', () => {
    const { container } = render(<InlineProMemberName userId="member">Ben Loveard</InlineProMemberName>);
    expect(container.innerHTML).toMatchInlineSnapshot(`"<span class=\"pro-inline-name\"><span class=\"pro-inline-text\">Ben Loveard</span><span class=\"pro-label\" data-size=\"small\" data-kind=\"am\" data-tappable=\"\" role=\"button\" tabindex=\"0\" aria-label=\"AM, what this means\" aria-haspopup=\"dialog\" aria-expanded=\"false\"><span class=\"pro-label-text\">AM</span></span></span>"`);
  });
});