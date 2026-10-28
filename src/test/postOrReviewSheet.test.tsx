import React, { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { readFileSync } from 'node:fs';
import en from '../../public/locales/en/composerFlow.json';

const h = vi.hoisted(() => ({
  suggestions: [] as any[], error: false, profile: { id: 'member' } as { id: string } | null,
  enabled: vi.fn(), openPost: vi.fn(), begin: vi.fn(), track: vi.fn(), settled: vi.fn(), picker: {} as any,
}));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: h.profile }) }));
vi.mock('@/features/composer-flow/hooks/useReviewSuggestions', () => ({ useReviewSuggestions: (open: boolean) => {
  h.enabled(open); return { data: h.suggestions, isError: h.error };
} }));
vi.mock('@/stores/usePostStudioStore', () => ({ usePostStudioStore: (select: any) => select({ openPostStudio: h.openPost }) }));
vi.mock('@/features/composer-flow/composerFlowStore', () => ({ useComposerFlowStore: (select: any) => select({ beginHandoff: h.begin }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: h.track } }));
vi.mock('@/components/ui/sheetHistory', () => ({ afterSheetHistorySettled: (fn: () => void) => { h.settled(fn); } }));
vi.mock('@/features/post-v2/components/BottomSheet', () => ({ default: ({ open, children, fullHeight }: any) => open ? <div data-testid="sheet" data-full-height={String(!!fullHeight)}>{children}</div> : null }));
vi.mock('@/features/composer-flow/ReviewCourseSearchSheet', () => ({ default: (props: any) => {
  h.picker = props;
  return props.open ? <div data-testid="picker"><button onClick={() => props.onPick('picked')}>pick</button><button onClick={props.onClose}>cancel-picker</button></div> : null;
} }));
import ComposerFlowSheet from '@/features/composer-flow/ComposerFlowSheet';
import ComposerStepHeader from '@/features/composer-flow/components/ComposerStepHeader';

const i18n = createInstance();
void i18n.init({ lng: 'en', fallbackLng: 'en', resources: { en: { composerFlow: en } }, initAsync: false });
function Host({ returnPath }: { returnPath?: string }) {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  return <><output data-testid="location">{location.pathname}</output><ComposerFlowSheet open={open} onClose={() => setOpen(false)} returnPath={returnPath} /></>;
}
function mount(returnPath?: string) {
  return render(<I18nextProvider i18n={i18n}><MemoryRouter initialEntries={['/clubhouse']}><Host returnPath={returnPath} /></MemoryRouter></I18nextProvider>);
}
beforeEach(() => { cleanup(); vi.clearAllMocks(); h.suggestions = []; h.error = false; h.profile = { id: 'member' }; });
describe('direct entry sheet', () => {
  it('renders a heading and Post then OR then Review, without a counter or NEXT', () => {
    const { container } = mount();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Post or review');
    const boxes = [...container.querySelectorAll('section')];
    expect(boxes).toHaveLength(2);
    expect(boxes[0].querySelector('h2')).toHaveTextContent('Post');
    expect(boxes[1].querySelector('h2')).toHaveTextContent('Review a course');
    expect(boxes[0].nextElementSibling).toHaveAttribute('aria-hidden', 'true');
    expect(boxes[0].nextElementSibling).toHaveTextContent('OR');
    expect(screen.queryByText(/Step \d of/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'NEXT' })).toBeNull();
    expect(screen.getByTestId('sheet')).toHaveAttribute('data-full-height', 'false');
  });
  it.each(['camera', 'library'] as const)('%s clicks only its own input synchronously', source => {
    const { container } = mount();
    const inputs = [...container.querySelectorAll('input[type=file]')] as HTMLInputElement[];
    const clicks = inputs.map(input => vi.spyOn(input, 'click').mockImplementation(() => {}));
    fireEvent.click(screen.getByRole('button', { name: `Post from ${source}` }));
    const index = source === 'camera' ? 0 : 1;
    expect(clicks[index]).toHaveBeenCalledTimes(1);
    expect(clicks[1 - index]).not.toHaveBeenCalled();
    expect(inputs[index]).toHaveAttribute('accept', 'image/*,video/*');
    expect(inputs[0]).toHaveAttribute('capture', 'environment');
    expect(inputs[0].multiple).toBe(false);
    expect(inputs[1].multiple).toBe(true);
  });
  it.each(['camera', 'library'] as const)('%s files open the studio with original files and close the sheet', source => {
    const { container } = mount('/amateur');
    const input = container.querySelectorAll('input')[source === 'camera' ? 0 : 1];
    const file = new File(['photo'], 'golf.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(h.track).toHaveBeenCalledWith('composer_post_source', { source, count: 1 });
    expect(h.begin).toHaveBeenCalledWith('/amateur');
    expect(h.openPost).toHaveBeenCalledWith({ media: [file], returnPath: '/amateur' });
    expect(h.begin.mock.invocationCallOrder[0]).toBeLessThan(h.openPost.mock.invocationCallOrder[0]);
    expect(screen.queryByTestId('sheet')).toBeNull();
    expect(input).toHaveValue('');
  });
  it.each(['camera', 'library'] as const)('%s cancel leaves the sheet open without a handoff', source => {
    const { container } = mount();
    fireEvent.change(container.querySelectorAll('input')[source === 'camera' ? 0 : 1], { target: { files: [] } });
    expect(h.openPost).not.toHaveBeenCalled();
    expect(h.begin).not.toHaveBeenCalled();
    expect(h.track).not.toHaveBeenCalled();
    expect(screen.getByTestId('sheet')).toBeInTheDocument();
  });
  it('keeps the existing ten-media cap', () => {
    const { container } = mount();
    const files = Array.from({ length: 12 }, (_, i) => new File(['x'], `${i}.jpg`, { type: 'image/jpeg' }));
    fireEvent.change(container.querySelectorAll('input')[1], { target: { files } });
    expect(h.openPost).toHaveBeenCalledWith({ media: files.slice(0, 10), returnPath: undefined });
    expect(h.track).toHaveBeenCalledWith('composer_post_source', { source: 'library', count: 10 });
  });
  it('search opens the Review a course sheet and only navigates after close settles', async () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Find a course to review' }));
    expect(screen.getByTestId('picker')).toBeInTheDocument();
    expect(h.picker.userId).toBe('member');
    fireEvent.click(screen.getByRole('button', { name: 'pick' }));
    expect(screen.queryByTestId('sheet')).toBeNull();
    expect(h.track).toHaveBeenCalledWith('composer_course_source', { source: 'search' });
    expect(h.begin).toHaveBeenCalledWith('/clubhouse');
    expect(screen.getByTestId('location')).toHaveTextContent('/clubhouse');
    await waitFor(() => expect(h.settled).toHaveBeenCalledTimes(1));
    h.settled.mock.calls[0][0]();
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/courses/picked/rate'));
  });
  it('suggested row tracks its reason kind and follows the close-first route', async () => {
    h.suggestions = [{ courseId: 'club', courseName: 'Club Course', thumbnail: null, reason: 'Your club', reasonKind: 'club' }];
    mount();
    const row = screen.getByRole('button', { name: /Club Course/ });
    expect(row.querySelectorAll('button')).toHaveLength(0);
    fireEvent.click(row);
    expect(h.track).toHaveBeenCalledWith('composer_course_source', { source: 'suggested', reason: 'club' });
    expect(screen.queryByTestId('sheet')).toBeNull();
    await waitFor(() => expect(h.settled).toHaveBeenCalledTimes(1));
    h.settled.mock.calls[0][0]();
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/courses/club/rate'));
  });
  it('no suggestions leaves search as the last review control', () => {
    const { container } = mount();
    const box = container.querySelectorAll('section')[1];
    expect(box.querySelectorAll('button')).toHaveLength(1);
    expect(box.lastElementChild).toHaveClass('post-or-review-search');
  });
  it('a failed read hides even cached suggestion rows', () => {
    h.error = true; h.suggestions = [{ courseId: 'bad', courseName: 'Cached course' }];
    mount();
    expect(screen.queryByRole('button', { name: /Cached course/ })).toBeNull();
  });
});
describe('display-only counters', () => {
  it('total one keeps the leading control without counter or segments', () => {
    const click = vi.fn();
    const { container } = render(<I18nextProvider i18n={i18n}><ComposerStepHeader step={1} total={1} left="back" onLeft={click} /></I18nextProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(click).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Step \d/)).toBeNull();
    expect(container.querySelector('[aria-hidden]')).toBeNull();
  });
  it.each([2, 3])('internal review step %s displays one fewer out of two', step => {
    render(<I18nextProvider i18n={i18n}><ComposerStepHeader step={step - 1} total={2} left="none" /></I18nextProvider>);
    expect(screen.getByText(`Step ${step - 1} of 2`)).toBeInTheDocument();
    const source = readFileSync('src/features/review-v2/ReviewComposerV2.tsx', 'utf8');
    expect(source).toContain('<ComposerStepHeader step={step - 1} total={REVIEW_TOTAL_STEPS - 1} left="none"');
  });
});