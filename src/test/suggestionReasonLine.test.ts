import fs from 'node:fs';
import path from 'node:path';
import i18next from 'i18next';
import { beforeAll, describe, expect, it } from 'vitest';
import { suggestionReasonLine } from '@/features/social-suggestions/suggestionReasonLine';
import type { EmptyStateSuggestion } from '@/features/search-v2/hooks/useSearchEmptyStateV2';
import type { FindGolferRow } from '@/components/explore-tab-new/courseled/hooks/useFindGolfers';

const common = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'public/locales/en/common.json'), 'utf8'));
const i = i18next.createInstance();
beforeAll(async () => { await i.init({ lng: 'en', resources: { en: { common } }, defaultNS: 'common' }); });
const t = (k: string, o?: Record<string, unknown>) => i.t(k, o) as string;
const row = (o: Partial<{ reason_type: string; reason_detail: string | null; home_club: string | null; rounds_tracked: number }>) =>
  ({ reason_type: 'popular', reason_detail: null, home_club: null, rounds_tracked: 0, ...o });

describe('suggestionReasonLine', () => {
  it('followed_by keeps a complete phrase', () =>
    expect(suggestionReasonLine(row({ reason_type: 'followed_by', reason_detail: 'Andrew Yetzes and 2 others', home_club: 'X', rounds_tracked: 4 }), t)).toBe('Followed by Andrew Yetzes and 2 others'));
  it('plays with detail', () => expect(suggestionReasonLine(row({ reason_type: 'plays', reason_detail: 'Formby' }), t)).toBe('Plays Formby'));
  it('club and rounds', () => expect(suggestionReasonLine(row({ home_club: 'Formby Golf Club', rounds_tracked: 12 }), t)).toBe('Formby Golf Club · 12 rounds'));
  it('club and one round is singular', () => expect(suggestionReasonLine(row({ home_club: 'Formby Golf Club', rounds_tracked: 1 }), t)).toBe('Formby Golf Club · 1 round'));
  it('rounds only, null club', () => expect(suggestionReasonLine(row({ rounds_tracked: 7 }), t)).toBe('7 rounds tracked'));
  it('one round tracked is singular', () => expect(suggestionReasonLine(row({ rounds_tracked: 1 }), t)).toBe('1 round tracked'));
  it('club only when rounds are 0', () => expect(suggestionReasonLine(row({ home_club: 'Wallasey', rounds_tracked: 0 }), t)).toBe('Wallasey'));
  it('nothing → popular, never "0 rounds"', () => expect(suggestionReasonLine(row({ rounds_tracked: 0 }), t)).toBe('Popular on clbhouz'));
  it('followed_by without detail falls through', () => expect(suggestionReasonLine(row({ reason_type: 'followed_by', rounds_tracked: 3 }), t)).toBe('3 rounds tracked'));
  it('overlay row and sheet row give the identical line', () => {
    const base = { id: 'u', display_name: 'A', username: 'a', profile_photo_url: null, reason_type: 'popular', reason_detail: null, home_club: 'Formby Golf Club', rounds_tracked: 5 };
    const overlay: EmptyStateSuggestion = { ...base, score: 1 };
    const sheet: FindGolferRow = { ...base, handicap_index: null, is_friend: false, friend_pending: false, friend_incoming: false, is_following: false };
    expect(suggestionReasonLine(overlay, t)).toBe(suggestionReasonLine(sheet, t));
  });
});
