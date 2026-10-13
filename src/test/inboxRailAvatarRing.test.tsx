import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { MemberRailTile } from '@/pages/messaging-v2/MemberRailTile';

/**
 * THE MESSAGES RAIL WEARS THE CHAT ROW'S RING.
 *
 * The suggested-people rail at the top of the inbox and the conversation rows
 * below it are the same people at two sizes, so they must wear the same ring:
 * the 1px hairline every messaging avatar already uses. Without the prop the
 * tile falls back to SquircleAvatar's default 2px grey ring, which reads as a
 * frame around the tile rather than an edge on the photo.
 */

const HAIRLINE = 'rgba(255,255,255,0.22)';
const WIDE_RING = '2px solid #b8c6c9';

/** The squircle box carries the 34% radius; so does the hairline overlay, which
 *  is the aria-hidden one, so the box is the radius holder that is not the overlay. */
function squircleBox(container: HTMLElement): HTMLElement {
  const boxes = Array.from(container.querySelectorAll<HTMLElement>('div')).filter(
    (d) => d.style.borderRadius === '34%' && d.getAttribute('aria-hidden') !== 'true',
  );
  expect(boxes.length).toBe(1);
  return boxes[0];
}

function hairlineOverlay(container: HTMLElement): HTMLElement | undefined {
  return Array.from(container.querySelectorAll<HTMLElement>('div[aria-hidden="true"]')).find((d) =>
    d.style.border.includes(HAIRLINE),
  );
}

const tile = (hairlineRing?: boolean) =>
  render(
    <MemberRailTile
      avatarUrl={null}
      userId="u1"
      name="Thomas Holmes"
      label="Thomas"
      hairlineRing={hairlineRing}
    />,
  );

describe('messages rail avatar ring', () => {
  it('wears the 1px hairline when asked', () => {
    const { container } = tile(true);
    expect(squircleBox(container).style.border).toBe('none');
    expect(hairlineOverlay(container)?.style.border).toBe(`1px solid ${HAIRLINE}`);
    expect(container.innerHTML).not.toContain(WIDE_RING);
  });

  it('falls back to the wide 2px ring when not asked — the fault being fixed', () => {
    const { container } = tile(false);
    expect(squircleBox(container).style.border).toBe(WIDE_RING);
    expect(hairlineOverlay(container)).toBeUndefined();
  });

  it('the inbox rail asks for it, so it cannot drift back to the wide ring', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/pages/messaging-v2/InboxV2Page.tsx'),
      'utf8',
    );
    const calls = source
      .split('<MemberRailTile')
      .slice(1)
      .map((chunk) => chunk.split('/>')[0]);
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call).toMatch(/\bhairlineRing\b/);
    }
  });
});
