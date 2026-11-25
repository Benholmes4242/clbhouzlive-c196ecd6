import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({ rows: [] as { id: string; name: string; sub_country: string; region: string; country: null; member_count: number }[] }));
vi.mock('@/features/home-club/useHomeClubSearch', () => ({ useHomeClubSearch: () => ({ data: h.rows, loading: false, error: null }) }));
vi.mock('@/features/home-club/useSetHomeClub', () => ({ useSetHomeClub: () => ({ mutateAsync: vi.fn(async () => {}), isPending: false }) }));
import { HomeClubPickerSheet } from '@/features/home-club/HomeClubPickerSheet';
import { RequestCourseCTA } from '@/components/courses/RequestCourseCTA';
afterEach(cleanup);
const INK = 'rgb(248, 250, 252)';
const AMBER = 'rgb(247, 147, 30)';
describe('Brief 21 G — home club sheet buttons are white', () => {
  it('Confirm home club is #F8FAFC with no amber background', () => {
    h.rows = [{ id: 'park', name: 'Park Golf Club', sub_country: 'Kent', region: 'Bromley', country: null, member_count: 2 }];
    render(<HomeClubPickerSheet open onClose={() => {}} />);
    fireEvent.change(document.querySelector('input') as HTMLInputElement, { target: { value: 'Park' } });
    fireEvent.click(screen.getByText('Park Golf Club').closest('button') as HTMLElement);
    const confirm = document.querySelector('[data-confirm-home-club]') as HTMLElement;
    expect(getComputedStyle(confirm).backgroundColor).toBe(INK);
    expect(getComputedStyle(confirm).backgroundColor).not.toBe(AMBER);
  });
  it('the dark Request this club button is #F8FAFC with no amber background', () => {
    render(<RequestCourseCTA variant="hero" tone="dark" prefillName="Nowhere" homeClub />);
    const button = document.querySelector('[data-request-cta-primary]') as HTMLElement;
    expect(getComputedStyle(button).backgroundColor).toBe(INK);
    expect(getComputedStyle(button).backgroundColor).not.toBe(AMBER);
  });
  it('the light Request button keeps its amber', () => {
    render(<RequestCourseCTA variant="hero" prefillName="Nowhere" />);
    expect(getComputedStyle(document.querySelector('[data-request-cta-primary]') as HTMLElement).backgroundColor).toBe(AMBER);
  });
});
