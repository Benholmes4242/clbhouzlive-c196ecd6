import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'fs';

const toastMock = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }));
vi.mock('@/lib/toast', () => ({ toast: toastMock }));
vi.mock('@/services/drafts/draftService', () => ({ deleteDraft: vi.fn(() => Promise.resolve()) }));
vi.mock('@/features/post-v2/lib/refreshAuthorPosts', () => ({ refreshAuthorPosts: vi.fn() }));
vi.mock('@/lib/ui/haptics', () => ({ triggerHaptic: vi.fn() }));

import { uploadEventBus } from '@/uploads/uploadEventBus';
import { UploadToastsBridge } from '@/uploads/UploadToastsBridge';
import { UploadProgressBanner } from '@/components/uploads/UploadProgressBanner';
import { registerAppNavigate } from '@/lib/appNavigate';

const emit = (name: string, evt: unknown) => act(() => { (uploadEventBus as any).emit(name, evt); });
const qc = () => new QueryClient();

beforeEach(() => { toastMock.success.mockClear(); });
afterEach(() => { cleanup(); registerAppNavigate(null); });

describe('glass toasts, one confirmation', () => {
  it('post completion toasts "Your post is live" with View opening /post/{id}', () => {
    const nav = vi.fn(); registerAppNavigate(nav);
    render(<QueryClientProvider client={qc()}><UploadToastsBridge /></QueryClientProvider>);
    emit('upload:complete', { jobId: 'j1', uploadType: 'post', postId: 'p9' });
    const [msg, opts] = toastMock.success.mock.calls[0];
    expect(msg).toBe('Your post is live');
    opts.action.onClick();
    expect(nav).toHaveBeenCalledWith('/post/p9');
  });

  it('no postId means no View action; review has no action', () => {
    render(<QueryClientProvider client={qc()}><UploadToastsBridge /></QueryClientProvider>);
    emit('upload:complete', { jobId: 'j2', uploadType: 'post' });
    emit('upload:complete', { jobId: 'j3', uploadType: 'review' });
    expect(toastMock.success.mock.calls[0][1].action).toBeUndefined();
    expect(toastMock.success.mock.calls[1][0]).toBe('Your review is live');
    expect(toastMock.success.mock.calls[1][1].action).toBeUndefined();
  });

  it('the upload tile leaves the moment upload:complete arrives', () => {
    render(<UploadProgressBanner />);
    emit('upload:enqueued', { jobId: 'j4', uploadType: 'post', fileCount: 3 });
    expect(screen.getByTestId('upload-tile')).toBeTruthy();
    emit('upload:complete', { jobId: 'j4' });
    expect(screen.queryByTestId('upload-tile')).toBeNull();
  });

  it('failed upload shows Retry pill and Dismiss text button', () => {
    render(<UploadProgressBanner />);
    emit('upload:enqueued', { jobId: 'j5', uploadType: 'post', fileCount: 1 });
    emit('upload:failed', { jobId: 'j5', error: 'x' });
    expect(screen.getByRole('button', { name: 'Retry' }).className).toBe('glass-tile-action');
    expect(screen.getByRole('button', { name: 'Dismiss' }).className).toBe('glass-tile-cancel');
  });

  it('Toaster is unstyled with glass class names and no rich colours or close button', () => {
    const src = readFileSync('src/components/ui/sonner.tsx', 'utf8');
    expect(src).toContain('unstyled: true');
    expect(src).toContain("toast: 'glass-toast'");
    expect(src).not.toMatch(/richColors|closeButton/);
  });
});
