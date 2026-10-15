import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
import { buildSignature } from '@/components/profile/courses/yourSignature';
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
    expect(screen.getAllByTestId('signature-row').map((r) => r.textContent?.replace(/[\d.]/g, ''))).toEqual(['Design', 'Condition', 'Clubhouse', 'Facilities']);
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
});
