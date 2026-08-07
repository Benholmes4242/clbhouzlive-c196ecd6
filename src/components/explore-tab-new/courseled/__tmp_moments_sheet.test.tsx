import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MomentsSheet } from '@/components/explore-tab-new/courseled/MomentsSheet';
import type { Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: unknown) => {
      const opt = (o ?? {}) as { defaultValue?: string; count?: number };
      if (typeof o === 'string') return o;
      const dv = opt.defaultValue ?? k;
      const n = opt.count;
      if (n === 1) return dv.replace('{{count}} moments', '1 moment').replace('{{count}} courses', '1 course');
      return dv.replace('{{count}}', String(n ?? ''));
    },
  }),
}));

function mk(courseId: string, name: string | null, i: number, lead: boolean, video = false): Moment {
  return {
    key: `${courseId}-${i}`,
    courseId,
    courseName: name,
    post: { createdAt: '2026-08-01T00:00:00Z', id: `p${i}` } as Moment['post'],
    thumbnail: `https://x/${i}.jpg`,
    mediaType: video ? 'video' : 'image',
    mediaIndex: 0,
    mediaId: `m${i}`,
    isCourseLead: lead,
  };
}

function heights() {
  return Array.from(document.querySelectorAll('button')).map(
    (b) => (b as HTMLElement).style.height || (b as HTMLElement).style.aspectRatio,
  );
}

describe('MomentsSheet grouped', () => {
  it('n=1 renders one full-width 132 tile', () => {
    render(
      <MomentsSheet open onClose={() => {}} onTilePress={() => {}} moments={[mk('c1', 'Solo Links', 0, true)]} />,
    );
    const head = screen.getByText('Solo Links') as HTMLElement;
    expect(head.style.textOverflow).toBe('ellipsis');
    expect(head.style.whiteSpace).toBe('nowrap');
    expect(screen.getByText('1 moment')).toBeTruthy();
    expect(heights()).toEqual(['132px']);
  });

  it('n=2 renders both tiles at 168', () => {
    render(
      <MomentsSheet
        open
        onClose={() => {}}
        onTilePress={() => {}}
        moments={[mk('c1', 'Two Links', 0, true), mk('c1', 'Two Links', 1, false)]}
      />,
    );
    expect(screen.getByText('2 moments')).toBeTruthy();
    expect(heights()).toEqual(['168px', '168px']);
  });

  it('n=3 is 168 + two 81s', () => {
    render(
      <MomentsSheet
        open
        onClose={() => {}}
        onTilePress={() => {}}
        moments={[0, 1, 2].map((i) => mk('c1', 'Three Links', i, i === 0))}
      />,
    );
    expect(screen.getByText('3 moments')).toBeTruthy();
    expect(heights()).toEqual(['168px', '81px', '81px']);
  });

  it('n=5 adds a square overflow grid', () => {
    render(
      <MomentsSheet
        open
        onClose={() => {}}
        onTilePress={() => {}}
        moments={[0, 1, 2, 3, 4].map((i) => mk('c1', 'Five Links', i, i === 0, true))}
      />,
    );
    expect(screen.getByText('5 moments')).toBeTruthy();
    expect(heights()).toEqual(['168px', '81px', '81px', '1 / 1', '1 / 1']);
    // all-video group: every glyph renders, lead included
    expect(document.querySelectorAll('svg path[d="M8 5v14l11-7z"]')).toHaveLength(5);
    // no scrim divs when unlabelled
    expect(document.querySelectorAll('div[style*="linear-gradient(0deg, rgba(10,14,10,0.6)"]')).toHaveLength(0);
  });

  it('groups in first-appearance order, one header each, no tile labels', () => {
    const moments = [
      mk('a', 'Alpha GC', 0, true),
      mk('b', 'Bravo GC', 1, true),
      mk('a', 'Alpha GC', 2, false),
      mk('b', 'Bravo GC', 3, false),
      mk('b', 'Bravo GC', 4, false),
    ];
    render(<MomentsSheet open onClose={() => {}} onTilePress={() => {}} moments={moments} />);
    expect(screen.getAllByText('Alpha GC')).toHaveLength(1);
    expect(screen.getAllByText('Bravo GC')).toHaveLength(1);
    expect(screen.getByText('2 courses')).toBeTruthy();
    const text = document.body.innerText ?? document.body.textContent ?? '';
    const order = [text.indexOf('Alpha GC'), text.indexOf('Bravo GC')];
    expect(order[0]).toBeLessThan(order[1]);
  });

  it('lead is the isCourseLead tile even when it is not first', () => {
    const moments = [
      mk('c1', 'Late Lead GC', 0, false),
      mk('c1', 'Late Lead GC', 1, true),
      mk('c1', 'Late Lead GC', 2, false),
    ];
    render(<MomentsSheet open onClose={() => {}} onTilePress={() => {}} moments={moments} />);
    const tall = document.querySelector('button[style*="168px"]');
    expect(tall?.querySelector('img')?.getAttribute('src')).toContain('/1.jpg');
  });

  it('no isCourseLead flag at all still renders a lead', () => {
    const moments = [0, 1, 2].map((i) => mk('c1', 'No Flag GC', i, false));
    render(<MomentsSheet open onClose={() => {}} onTilePress={() => {}} moments={moments} />);
    expect(heights()).toEqual(['168px', '81px', '81px']);
  });
});
