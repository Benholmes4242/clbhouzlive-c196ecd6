import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
import { buildSignature } from '@/components/profile/courses/yourSignature';
import { A, courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
import { YourSignatureSection } from '@/components/profile/courses/YourSignatureSection';

const row = (o: Partial<Record<string, number | null>> = {}) => ({
  rating: 8, design_score: null, condition_score: null, clubhouse_score: null, facilities_score: null, ...o,
});

describe('profile courses signature', () => {
  it('each category uses its own non-null denominator', () => {
    const rows = Array.from({ length: 10 }, (_, i) => row({ design_score: 8, clubhouse_score: i < 3 ? 9 : null }));
    const m = buildSignature(rows)!;
    const club = m.categories.find((c) => c.label === 'Clubhouse')!;
    expect(club.n).toBe(3);
    expect(club.mean).toBe(9);
    expect(m.categories.find((c) => c.label === 'Design')!.n).toBe(10);
  });

  it('renders the four in the documented order', () => {
    const rows = Array.from({ length: 5 }, () => row({ design_score: 9, condition_score: 8, clubhouse_score: 7, facilities_score: 6 }));
    render(<YourSignatureSection rows={rows} />);
    const cols = [...document.querySelectorAll('[data-category]')].map((c) => c.getAttribute('data-category'));
    expect(cols).toEqual(['design', 'condition', 'clubhouse', 'facilities']);
  });

  it('renders nothing below the 5-review floor', () => {
    const rows = [...Array.from({ length: 4 }, () => row({ design_score: 9 })), row(), row()];
    const { container } = render(<YourSignatureSection rows={rows} />);
    expect(container.innerHTML).toBe('');
  });

  it('the sentence never compares with other members', () => {
    const rows = Array.from({ length: 6 }, () => row({ design_score: 9.5, facilities_score: 6 }));
    render(<YourSignatureSection rows={rows} />);
    const t = screen.getByTestId('signature-sentence').textContent!.toLowerCase();
    expect(t).not.toContain('member average');
    expect(t).not.toContain('clbhouz average');
  });

  it('compares with the four-category mean, not the overall rating average', () => {
    // overall 8.4 = design exactly; four-category mean is 8.0, so design sits 0.4 above
    const rows = Array.from({ length: 5 }, () => row({ rating: 8.4, design_score: 8.4, condition_score: 8, clubhouse_score: 7.8, facilities_score: 7.8 }));
    render(<YourSignatureSection rows={rows} />);
    const t = screen.getByTestId('signature-sentence').textContent!;
    expect(t).toContain('design voter — you mark it 0.4 above your average across the four');
    expect(t).not.toMatch(/ 0 |0\.0/);
  });

  it('even categories get the even sentence with no figures', () => {
    const rows = Array.from({ length: 5 }, () => row({ design_score: 8.1, condition_score: 8, clubhouse_score: 7.9, facilities_score: 8 }));
    render(<YourSignatureSection rows={rows} />);
    const t = screen.getByTestId('signature-sentence').textContent!;
    expect(t).toBe('You rate the four evenly — none sits more than 0.2 from your average across them.');
    expect(t.replace('0.2', '')).not.toMatch(/\d/);
  });

  it('no branch ever prints a zero difference', () => {
    const cases = [
      [9, 8, 7, 6], [8.3, 8, 8, 7.7], [8.3, 8, 7.95, 7.95], [8, 8, 8, 8], [8.24, 8, 8, 7.96], [10, 7, 7, 7],
    ];
    for (const [d, c, h, f] of cases) {
      const rows = Array.from({ length: 5 }, () => row({ design_score: d, condition_score: c, clubhouse_score: h, facilities_score: f }));
      const { unmount } = render(<YourSignatureSection rows={rows} />);
      const t = screen.getByTestId('signature-sentence').textContent!;
      expect(t).not.toContain(' 0 ');
      expect(t).not.toContain('0.0');
      unmount();
    }
  });

  it('every rated figure is white A.INK, the helper keeps null muted, and no bar is drawn', () => {
    const rows = Array.from({ length: 5 }, () => row({ design_score: 9, condition_score: 8.9 }));
    const { container } = render(<YourSignatureSection rows={rows} />);
    const norm = (c: string) => { const el = document.createElement('i'); el.style.color = c; return el.style.color; };
    const fig = (k: string) => container.querySelector(`[data-category="${k}"] [data-category-figure]`) as HTMLElement;
    expect(courseSubScoreTone(9)).toBe(A.INK);
    expect(courseSubScoreTone(8.9)).toBe(A.INK);
    expect(fig('design').style.color).toBe(norm(A.INK));
    expect(fig('condition').style.color).toBe(norm(A.INK));
    expect(courseSubScoreTone(null)).toBe(A.MUTE);
    expect(fig('clubhouse')).toBeNull();
    expect(fig('facilities')).toBeNull();
    expect(container.querySelector('[data-category-score] ')?.hasAttribute('data-category-figure')).toBe(true);
    expect([...container.querySelectorAll<HTMLElement>('div')].some((d) => d.style.height === '8px')).toBe(false);
  });
});
