import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const f = vi.hoisted(() => ({ data: null as any }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }));
vi.mock('@/features/admin/hooks/useContentDesk', async (orig) => ({ ...(await orig<any>()), useNewsroom: () => ({ data: f.data, error: null }) }));
vi.mock('@/features/admin/components/wire/TheWireTab', () => ({ TourStoryEditorHost: () => <div data-editor="tour" /> }));
vi.mock('@/features/admin/components/amateur/AmateurNewsTab', () => ({ AmateurStoryEditorHost: () => <div data-editor="amateur" /> }));
vi.mock('@/features/admin/components/content/StorySection', () => ({ default: () => <div data-story="" /> }));

import NewsroomSection, { cadenceState, storyColumns } from '@/features/admin/components/content/NewsroomSection';
import { beatColour } from '@/features/admin/components/content/deskTokens';
import { adminTheme } from '@/features/admin/theme';

const story = (id: string, day: number, readers: number | null, extra: Record<string, unknown> = {}) => ({
  id, kind: 'tour', kicker: 'Kicker', headline: `Headline ${id}`, categories: null,
  published_at: new Date(Date.UTC(2026, 9, day, 12)).toISOString(), blocks: 10, readers, views: null,
  avg_read_secs: 120, est_read_secs: null, through: 70, faults: null, ...extra,
});
const payload = (over: Record<string, unknown> = {}) => ({
  week_start: '2026-11-16', week: [], readers_7d: 1, active_7d: 39, avg_read_secs_30d: 146, avg_through: 58,
  live: { tour: 1, amateur: 0 }, queue: [], stories: [story('a', 1, 3)], ...over,
});
const mount = (over: Record<string, unknown> = {}) => { f.data = payload(over); return render(<NewsroomSection />); };
afterEach(() => { cleanup(); f.data = null; });

describe('cadenceState', () => {
  it('3 published is good "on target"', () => expect(cadenceState(3, 0, 2)).toEqual({ tone: 'good', caption: 'on target' }));
  it('0 published, 0 scheduled, 2 days left is bad "3 short, 2 days left"', () => expect(cadenceState(0, 0, 2)).toEqual({ tone: 'bad', caption: '3 short, 2 days left' }));
  it('1 published with 2 days left is neutral "2 to go"', () => expect(cadenceState(1, 0, 2)).toEqual({ tone: 'neutral', caption: '2 to go' }));
  it('scheduled stories count and append "1 queued"', () => {
    const c = cadenceState(1, 1, 1);
    expect(c.tone).toBe('neutral');
    expect(c.caption).toBe('2 to go \u00b7 1 queued');
  });
  it('one day left uses "day"', () => expect(cadenceState(0, 0, 1).caption).toBe('3 short, 1 day left'));
});

describe('Readers panel', () => {
  it('shows Reach, Avg read and Read through and no Live figure', () => {
    const { container } = mount();
    const panel = container.querySelector('[data-newsroom-readers]')!;
    expect(panel.querySelector('[data-fig="reach"]')).not.toBeNull();
    expect(panel.querySelector('[data-fig="avg-read"]')).not.toBeNull();
    expect(panel.querySelector('[data-fig="through"]')).not.toBeNull();
    expect(panel.querySelectorAll('[data-fig]')).toHaveLength(3);
    expect(panel.textContent).not.toMatch(/\bLive\b/);
  });
  it('reach percentage with active_7d 0 renders an em dash', () => {
    const { container } = mount({ active_7d: 0 });
    const caption = container.querySelector('[data-fig="reach"]')!.lastElementChild!;
    expect(caption.textContent).toBe('\u2014');
  });
});

describe('Story by story', () => {
  it('renders 12 columns with the newest right-most', () => {
    const many = Array.from({ length: 14 }, (_, i) => story(`s${i}`, i + 1, i));
    const cols = storyColumns(many as any);
    expect(cols).toHaveLength(12);
    expect(cols[11]!.id).toBe('s13');
    expect(cols[0]!.id).toBe('s2');
  });
  it('pads empty slots on the left when fewer than 12 stories', () => {
    const { container } = mount({ stories: [story('new', 3, 5), story('old', 1, 2)] });
    const slots = [...container.querySelectorAll('[data-story-bars] > *')];
    expect(slots).toHaveLength(12);
    expect(slots.slice(0, 10).every((s) => s.getAttribute('data-slot') === 'empty')).toBe(true);
    expect(slots[11].getAttribute('title')).toBe('Headline new: 5 readers');
  });
  it('draws a zero-reader story as a stub', () => {
    const { container } = mount({ stories: [story('z', 1, 0)] });
    expect(container.querySelector('[data-story-bars] [data-slot="stub"]')).not.toBeNull();
  });
  it('labels only columns 0, 3, 6 and 11', () => {
    const { container } = mount({ stories: Array.from({ length: 12 }, (_, i) => story(`s${i}`, i + 1, 1)) });
    const labels = [...container.querySelectorAll('[data-story-labels] > span')].map((s) => s.textContent);
    expect(labels.map((l, i) => (l ? i : -1)).filter((i) => i >= 0)).toEqual([0, 3, 6, 11]);
  });
});

describe('Up next', () => {
  it('buttons are outlined, not filled, and still call onCreate for each beat', () => {
    const { container } = mount();
    for (const b of ['tour', 'amateur']) {
      const btn = container.querySelector(`[data-create="${b}"]`) as HTMLElement;
      expect(btn.style.background).toBe('transparent');
    }
    // jsdom drops var() borders, so the outline is confirmed from source.
    const src = readFileSync(resolve(process.cwd(), 'src/features/admin/components/content/NewsroomSection.tsx'), 'utf8');
    expect(src).toContain("onClick={() => onCreate(b)} style={{ ...btnOutline(), textTransform: 'uppercase' }}");
    fireEvent.click(container.querySelector('[data-create="tour"]')!);
    expect(container.querySelector('[data-editor="tour"]')).not.toBeNull();
    cleanup();
    const again = mount();
    fireEvent.click(again.container.querySelector('[data-create="amateur"]')!);
    expect(again.container.querySelector('[data-editor="amateur"]')).not.toBeNull();
  });
  it('an empty queue says so', () => {
    mount();
    expect(screen.getByText('Nothing drafted or scheduled')).toBeInTheDocument();
  });
});

describe('Published rows', () => {
  it('through null shows an em dash and no percentage', () => {
    const { container } = mount({ stories: [story('n', 1, 2, { through: null })] });
    const line = container.querySelector('[data-through-line]')!;
    expect(line.textContent).toBe('\u2014');
    expect(container.querySelector('[data-through-fill]')).toBeNull();
  });
  it('"1 reader" versus "2 readers"', () => {
    mount({ stories: [story('one', 2, 1), story('two', 1, 2)] });
    const rows = screen.getAllByRole('button').filter((b) => b.hasAttribute('data-published-row'));
    expect(rows[0].textContent).toContain('reader');
    expect(rows[0].textContent).not.toContain('readers');
    expect(rows[1].textContent).toContain('readers');
  });
});

describe('beat chips', () => {
  it('sit in a wrapping row', () => {
    const { container } = mount();
    const row = container.querySelector('[data-beat-chips]') as HTMLElement;
    expect(row.style.flexWrap).toBe('wrap');
    expect(row.style.overflow).toBe('');
    expect(row.querySelectorAll('button')).toHaveLength(3);
  });
});

describe('source scan', () => {
  const files = ['NewsroomSection.tsx', 'ContentSegments.tsx', 'v3Styles.ts'].map((n) => [n, readFileSync(resolve(process.cwd(), 'src/features/admin/components/content', n), 'utf8')] as const);
  it.each(files)('%s has no weight above 700, size below 10, amber or ellipsis', (_n, s) => {
    expect([...s.matchAll(/fontWeight:\s*(\d+)/g)].filter((m) => Number(m[1]) > 700)).toEqual([]);
    expect([...s.matchAll(/fontSize:\s*(\d+(?:\.\d+)?)/g)].filter((m) => Number(m[1]) < 10)).toEqual([]);
    expect(s).not.toMatch(/\b(t|desk)\.(brand|brandText|brandSoft|warn|warnText|warnSoft|warnOutline)\b/);
    expect(s).not.toMatch(/#F7931E|#F2C14E|#F9C874/i);
    expect(s).not.toMatch(/textOverflow:\s*'ellipsis'/);
  });
});

describe('beatColour', () => {
  it('amateur is no longer the brand amber', () => {
    expect(beatColour('amateur')).not.toBe(adminTheme.brand);
    expect(beatColour('amateur')).toBe('rgba(233,237,243,0.55)');
    expect(beatColour('tour')).toBe(adminTheme.ink);
  });
});
