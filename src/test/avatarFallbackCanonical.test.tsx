/**
 * AVATAR FALLBACK CANON — one dark fill, first-and-last initials, for every
 * personal and business profile with no photo or logo.
 *
 * Covers: getInitialsFromName first/last-token rule, the ClubProfileHero
 * crest fallback (dark fill, no light plate without a logo), the search
 * ClubRow tile, and a repo guard that the slate palette hash
 * (getAvatarFallbackColor) is never called outside tourhub.
 */
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { avatarFallbackFill, getInitialsFromName } from '@/lib/avatarFallback';
import { ClubProfileHero } from '@/components/business/hero/ClubProfileHero';
import { ClubRow } from '@/features/search-v2/components/ClubRow';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

describe('getInitialsFromName first/last rule', () => {
  it('takes the first letter of the first and last tokens', () => {
    expect(getInitialsFromName('MasterGolf Travel')).toBe('MT');
    expect(getInitialsFromName('Mary Jane Smith')).toBe('MS');
    expect(getInitialsFromName('machgolfclub')).toBe('M');
    expect(getInitialsFromName('')).toBe('');
  });

  it('avatarFallbackFill is the canonical dark gradient', () => {
    // jsdom strips gradient backgrounds from the style attribute, so the
    // fill itself is asserted here and the DOM tests assert structure.
    expect(avatarFallbackFill('MasterGolf Travel')).toContain('#1E1E23');
    expect(avatarFallbackFill(null)).toContain('#1E1E23');
  });
});

describe('ClubProfileHero crest fallback', () => {
  const hero = (over: Partial<React.ComponentProps<typeof ClubProfileHero>> = {}) =>
    render(
      <ClubProfileHero
        name="MasterGolf Travel"
        placeLine="Travel · London"
        onShare={vi.fn()}
        renderMore={(tr) => tr}
        team={null}
        isFollowing={false}
        onFollowToggle={vi.fn()}
        onBookTeeTime={vi.fn()}
        onMessage={vi.fn()}
        {...over}
      />,
    );

  it('no logo: MT on the dark fill, and no light plate on the button', () => {
    const { container } = hero({ logoUrl: null });
    const crest = container.querySelector('[data-club-crest]') as HTMLElement;
    expect(crest).not.toBeNull();
    expect(crest.getAttribute('style') ?? '').not.toContain('#F4F4F2');
    const fallback = crest.querySelector('span') as HTMLElement;
    expect(fallback.textContent).toBe('MT');
    // Gradient fill is stripped by jsdom (see avatarFallbackFill assertion);
    // the fallback branch is what carries it.
    expect(fallback.getAttribute('style') ?? '').toContain('inset 0 0 0 1px rgba(248, 250, 252, 0.1)');
  });

  it('with a logo: the plate stays #F4F4F2', () => {
    const { container } = hero({ logoUrl: 'https://example.com/logo.png' });
    const crest = container.querySelector('[data-club-crest]') as HTMLElement;
    expect(crest.getAttribute('style') ?? '').toContain('#F4F4F2');
    expect(crest.querySelector('img')).not.toBeNull();
  });
});

describe('search ClubRow fallback tile', () => {
  it('no logo: MT on the dark fill', () => {
    const { container } = render(
      <ClubRow
        club={{ id: 'club-1', name: 'MasterGolf Travel', logo_url: null } as never}
        query=""
        onSelect={vi.fn()}
      />,
    );
    const tile = container.querySelector('button')!.firstElementChild as HTMLElement;
    expect(tile.textContent).toBe('MT');
    // No white plate and no TRACK fill without a logo; the gradient fill is
    // stripped by jsdom (see avatarFallbackFill assertion).
    const style = tile.getAttribute('style') ?? '';
    expect(style).not.toContain('#FFFFFF');
    expect(style).not.toContain('TRACK');
  });
});

describe('slate palette guard', () => {
  it('no file outside tourhub calls getAvatarFallbackColor', () => {
    const root = join(__dirname, '..');
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry)) continue;
        const rel = relative(root, full);
        if (rel.startsWith('test')) continue;
        if (rel === join('lib', 'avatarFallback.ts')) continue;
        if (rel.startsWith(join('features', 'tourhub'))) continue;
        if (readFileSync(full, 'utf8').includes('getAvatarFallbackColor(')) offenders.push(rel);
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});
