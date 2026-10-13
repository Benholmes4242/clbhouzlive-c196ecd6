import { describe, expect, it } from 'vitest';
import { memberIndexText, indexSeriesToToday, mergeSessionSteps } from '@/features/admin/lib/memberRadarRules';
import { isPermissionDenied } from '@/features/admin/hooks/useMembersRadar';

describe('members radar — index only when connected (4)', () => {
  it('a member without a connected handicap shows an em dash, even at 0', () => {
    expect(memberIndexText(0, false)).toBe('—');
  });
  it('a connected member shows the index', () => expect(memberIndexText(12.4, true)).toBe('12.4'));
});

describe('members radar — chart ends today (5)', () => {
  it('appends today at profile.index when the last point is older and differs', () => {
    const s = indexSeriesToToday([{ date: '2026-09-01', index: 14.2 }], 13.8, '2026-10-13');
    expect(s[s.length - 1]).toEqual({ date: '2026-10-13', index: 13.8 });
  });
  it('does not append when the last point already equals profile.index', () => {
    expect(indexSeriesToToday([{ date: '2026-09-01', index: 13.8 }], 13.8, '2026-10-13')).toHaveLength(1);
  });
});

describe('members radar — timeline merge (6)', () => {
  it('merges back-to-back screens with the same label across an event, summing seconds', () => {
    const out = mergeSessionSteps([
      { at: '1', kind: 'screen', label: 'Feed', seconds: 30 },
      { at: '2', kind: 'event', name: 'post_liked' },
      { at: '3', kind: 'screen', label: 'Feed', seconds: 45 },
      { at: '4', kind: 'screen', label: 'Profile', seconds: 10 },
    ]);
    expect(out.map((s) => s.kind)).toEqual(['screen', 'event', 'screen']);
    expect(out[0].seconds).toBe(75);
    expect(out[2].label).toBe('Profile');
  });
});

describe('members radar — permission denied', () => {
  it('recognises Postgres 42501', () => expect(isPermissionDenied({ code: '42501' })).toBe(true));
});

import { dropTeamInvites } from '@/features/admin/hooks/useInvites';
describe('invites — a team member never appears under Invites', () => {
  it('drops an expired invite for someone with an unexpired membership', () => {
    const out = dropTeamInvites(
      [{ id: 'i1', invitedUserId: 'thomas' }, { id: 'i2', invitedUserId: 'other' }],
      [{ userId: 'thomas', expiresAt: null }],
    );
    expect(out.map((i) => i.id)).toEqual(['i2']);
  });
  it('keeps the invite when the membership has expired', () => {
    const out = dropTeamInvites([{ id: 'i1', invitedUserId: 'x' }], [{ userId: 'x', expiresAt: '2000-01-01' }]);
    expect(out).toHaveLength(1);
  });
});
