/**
 * CONTENT_V3_4_PAGES — admin Content Pages tab (Help and Legal) list sections.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const h = vi.hoisted(() => ({ insight: { visits: 3, searches: 1, no_answer: 0, no_answer_terms: [] as any[] } as any }));
const mut = () => ({ mutateAsync: vi.fn(), isPending: false });
const ARTICLES = [
  { id: 'a1', category: 'Account', question: 'How do I sign in?', answer: 'x', sort_order: 0, is_published: true, updated_at: '2026-07-02T10:00:00Z' },
  { id: 'a2', category: 'Courses', question: 'Why is my course missing?', answer: 'x', sort_order: 0, is_published: false, updated_at: '2026-07-02T10:00:00Z' },
];
vi.mock('@/features/admin/hooks/useContentDesk', () => ({
  useHelpInsight: () => ({ data: h.insight, isLoading: false, isError: false, error: null }),
  isPermissionError: () => false,
}));
vi.mock('@/features/admin/hooks/useHelpArticlesAdmin', () => ({
  useHelpArticlesAdmin: () => ({
    isLoading: false, articles: ARTICLES,
    grouped: { Account: [ARTICLES[0]], Courses: [ARTICLES[1]] },
    create: mut(), update: mut(), remove: mut(),
  }),
}));
vi.mock('@/features/admin/hooks/useLegalDocumentsAdmin', () => ({
  useLegalDocumentsAdmin: () => ({
    isLoading: false,
    documents: [{ id: 'd1', slug: 'terms', title: 'Terms of Service', body: '', sort_order: 1, effective_date: '2026-07-13', is_published: true }],
    create: mut(), update: mut(), remove: mut(),
  }),
}));

import HelpArticlesTab from '@/features/admin/components/HelpArticlesTab';
import LegalDocumentsTab, { effectiveLabel } from '@/features/admin/components/LegalDocumentsTab';
import { CC3 } from '@/features/admin/components/InboxPanels';

beforeEach(() => { h.insight = { visits: 3, searches: 1, no_answer: 0, no_answer_terms: [] }; });

describe('CONTENT_V3_4 Pages tab', () => {
  it('tones No answer bad only above 0', () => {
    const { container, unmount } = render(<HelpArticlesTab />);
    expect(container.querySelector('[data-tone]')?.getAttribute('data-tone')).toBe('ink');
    unmount();
    h.insight = { ...h.insight, no_answer: 2 };
    const r = render(<HelpArticlesTab />);
    expect(r.container.querySelector('[data-tone]')?.getAttribute('data-tone')).toBe('bad');
  });

  it('shows the quiet line only when visits is 0', () => {
    const { unmount } = render(<HelpArticlesTab />);
    expect(screen.queryByText('Nobody has opened Help in 30 days.')).toBeNull();
    unmount();
    h.insight = { ...h.insight, visits: 0 };
    render(<HelpArticlesTab />);
    expect(screen.getByText('Nobody has opened Help in 30 days.')).toBeTruthy();
  });

  it('article rows have no published dot, unpublished shows Hidden, header counts hidden', () => {
    const { container } = render(<HelpArticlesTab />);
    expect(container.querySelector('[aria-label="Published"]')).toBeNull();
    const hiddenRow = screen.getByText('Why is my course missing?').closest('button')!;
    expect(within(hiddenRow).getByText('Hidden')).toBeTruthy();
    const shownRow = screen.getByText('How do I sign in?').closest('button')!;
    expect(within(shownRow).queryByText('Hidden')).toBeNull();
    expect(container.querySelector('[data-figure="articles-meta"]')?.textContent).toBe('2 \u00b7 1 hidden');
  });

  it('+ New sits in the Articles and Legal headers and opens the create sheets; no + New document row', () => {
    const help = render(<HelpArticlesTab />);
    const art = help.container.querySelector('[data-section="articles"]') as HTMLElement;
    fireEvent.click(within(art).getByRole('button', { name: '+ New' }));
    expect(screen.getByText('New article')).toBeTruthy();
    help.unmount();
    const legal = render(<LegalDocumentsTab />);
    expect(screen.queryByRole('button', { name: '+ New document' })).toBeNull();
    const sec = legal.container.querySelector('[data-section="legal"]') as HTMLElement;
    fireEvent.click(within(sec).getByRole('button', { name: '+ New' }));
    expect(screen.getByText('New document')).toBeTruthy();
  });

  it('effectiveLabel uses mute for a recent published document and faint for a hidden one', () => {
    const now = new Date('2026-07-20T12:00:00Z');
    expect(effectiveLabel({ is_published: true, effective_date: '2026-07-13' }, now).colour).toBe(CC3.mute);
    expect(effectiveLabel({ is_published: false, effective_date: '2026-07-13' }, now).colour).toBe(CC3.faint);
  });

  it('list sections have no heavy weights, tiny sizes, amber or okText', () => {
    for (const [file, editor] of [['HelpArticlesTab.tsx', 'export function ArticleEditor'], ['LegalDocumentsTab.tsx', 'function DocumentEditor']]) {
      const src = readFileSync(resolve(__dirname, '../features/admin/components', file), 'utf8');
      const list = src.slice(src.indexOf('export default function'), src.indexOf(editor));
      expect(list.length).toBeGreaterThan(500);
      for (const m of list.matchAll(/fontWeight:\s*(\d+)/g)) expect(Number(m[1])).toBeLessThanOrEqual(700);
      for (const m of list.matchAll(/fontSize:\s*([\d.]+)/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(10);
      for (const bad of ['warnText', 'brandText', 't.brand', 'brandSoft', 'okText']) expect(list).not.toContain(bad);
    }
  });
});
