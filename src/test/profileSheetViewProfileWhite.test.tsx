/**
 * BRIEF_PROFILE_SHEET_VIEW_PROFILE_WHITE — the header pill is the quiet door.
 * It reads ink on the canonical dark hairline; amber belongs to the
 * notification tile only.
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import IdentityHeader from '@/features/profile-sheet-v2/components/IdentityHeader';
import { DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { A } from '@/features/courses/components/holes/analytical/tokens';

// The avatar itself is not under test here; keep its ring colour canonical.
vi.mock('@/components/ui/SquircleAvatar', async () => {
  const actual = await vi.importActual<typeof import('@/components/ui/SquircleAvatar')>(
    '@/components/ui/SquircleAvatar'
  );
  return { ...actual, SquircleAvatar: () => <span /> };
});

const norm = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase();

const hexToRgb = (hex: string) => {
  const [r, g, b] = hex.replace('#', '').match(/.{2}/g)!.map((part) => parseInt(part, 16));
  return `rgb(${r}, ${g}, ${b})`;
};

const renderPill = () => {
  const { getByText } = render(
    <IdentityHeader id="u1" name="Ellie Grant" line="Handicap 7" onOpen={() => {}} />
  );
  return getByText('View profile ›') as HTMLElement;
};

describe('profile sheet "View profile" pill', () => {
  it('reads ink, not amber', () => {
    const pill = renderPill();
    const actual = norm(pill.style.color || getComputedStyle(pill).color);
    expect([norm(A.INK), norm(hexToRgb(A.INK))]).toContain(actual);
    expect(actual).not.toContain(norm(A.AMBER));
    expect(actual).not.toContain('247');
  });

  it('is edged with the canonical dark hairline, not the amber border', () => {
    const pill = renderPill();
    expect(norm(pill.style.border)).toBe(norm(`1px solid ${DARK_HAIRLINE}`));
    expect(norm(pill.style.border)).not.toContain('247');
  });

  it('keeps its frozen typography, shape and pass-through behaviour', () => {
    const pill = renderPill();
    expect(pill.style.fontSize).toBe('11.5px');
    expect(pill.style.fontWeight).toBe('800');
    expect(pill.style.letterSpacing).toBe('0.04em');
    expect(pill.style.borderRadius).toBe('999px');
    expect(pill.style.padding).toBe('5px 10px 5px 11px');
    expect(pill.style.whiteSpace).toBe('nowrap');
    expect(pill.style.pointerEvents).toBe('none');
  });
});
