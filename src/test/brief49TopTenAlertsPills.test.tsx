import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { getActivityLink } from '@/features/activity-v2/utils/activityLinks';
import { routeForNotif } from '../../supabase/functions/_shared/notifRoute';
import { TenPills } from '@/components/topTen/TenBand';
import type { TenBlockData } from '@/components/topTen/topTenModel';
afterEach(cleanup);
const base = { actor_user_id: 'actor', entity_type: 'post', entity_id: 'p2' };
describe('Brief 49 alert parity and shared pills', () => {
  it.each(['inbox', 'push'])('%s new_course uses data.post_id before post entity id', surface => {
    const route = surface === 'inbox' ? (r: unknown) => getActivityLink(r as never) : (r: unknown) => routeForNotif(r as never);
    expect(route({ ...base, notif_type: 'new_course', data: { post_id: 'p1' } })).toBe('/?post=p1');
    expect(route({ ...base, notif_type: 'new_course', data: {} })).toBe('/?post=p2');
  });
  it.each(['inbox', 'push'])('%s ten comments, replies, mentions and post reactions retain their routes', surface => {
    const route = surface === 'inbox' ? (r: unknown) => getActivityLink(r as never) : (r: unknown) => routeForNotif(r as never);
    for (const notif_type of ['top_ten_comment', 'top_ten_reply', 'top_ten_mention']) expect(route({ ...base, notif_type, entity_type: 'top_ten', data: { target_user_id: 'owner', course_id: 'c1', comment_id: 'cm1' } })).toBe('/profile/owner?tab=courses&course=c1&top_ten_comment=cm1');
    for (const notif_type of ['like', 'mention']) expect(route({ ...base, notif_type, data: { post_id: 'p1' } })).toBe('/post/p1');
    expect(route({ ...base, notif_type: 'comment', data: { post_id: 'p1', comment_id: 'cm1' } })).toBe('/post/p1/comment/cm1');
  });
  it('long pills use auto height and a two-line clamp while short pills retain the 26px minimum', () => {
    const css = readFileSync('src/styles/top-ten.css', 'utf8');
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    try {
      const block = { count: 10, played_count: 4, shared_line: 'Royal County Down Golf Club (Championship) is in your top three too' } as TenBlockData;
      const { container } = render(<TenPills block={block} />);
      const pills = [...container.querySelectorAll('.ten-pill')];
      expect(pills).toHaveLength(2);
      for (const pill of pills) {
        const computed = getComputedStyle(pill);
        expect(computed.height).toBe('auto'); expect(computed.minHeight).toBe('26px');
        expect(computed.padding).toBe('5px 10px'); expect(computed.lineHeight).toBe('16px');
        expect(computed.borderRadius).toBe('13px'); expect(computed.overflow).toBe('hidden');
      }
      // jsdom does not lay out text or reliably retain vendor properties.
      const rule = css.match(/\.ten-pills \.ten-pill \{([^}]+)\}/)?.[1];
      expect(rule).toContain('-webkit-line-clamp:2'); expect(rule).toContain('-webkit-box-orient:vertical');
      expect(rule).toContain('display:-webkit-box'); expect(rule).toContain('text-overflow:ellipsis');
    } finally { style.remove(); }
  });
});