import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const f = vi.hoisted(() => ({
  upload: vi.fn(), compress: vi.fn(), toastError: vi.fn(), storageFrom: vi.fn(), signed: vi.fn(),
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/utils/r2OnlyUpload', () => ({ uploadToR2Only: f.upload }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: f.toastError } }));
vi.mock('@/uploads/imageCompression', () => ({ compressImage: f.compress, COMPRESSION_PRESETS: { feed: { preset: 'feed' } } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { storage: { from: f.storageFrom } } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'user-1' } }) }));
const actor = { type: 'user', id: 'user-1', displayName: 'Me' };
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: actor, availableActors: [actor], setActiveActor: vi.fn() }) }));
vi.mock('@/components/mentions/MentionsComposerInput', () => ({ MentionsComposerInput: () => null }));

import { CommentComposer } from '@/features/comments-v2/components/CommentComposer';
import { CommentImageV2 } from '@/features/comments-v2/components/CommentImageV2';

const compressed = new File(['small'], 'c.jpeg', { type: 'image/jpeg' });

function attach(container: HTMLElement) {
  const input = container.querySelector('input[type=file]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [new File(['big'], 'a.jpg', { type: 'image/jpeg' })] } });
}

describe('FIX_COMMENT_IMG_1 comment photos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    f.compress.mockResolvedValue({ file: compressed });
    f.storageFrom.mockReturnValue({ createSignedUrl: f.signed });
    f.signed.mockResolvedValue({ data: { signedUrl: 'https://signed.example/x' } });
  });
  afterEach(cleanup);

  it('compresses, uploads once to R2 and submits the returned public URL as an image', async () => {
    const publicUrl = 'https://images.clbhouz.com/comments/user-1/p.jpeg';
    f.upload.mockResolvedValue({ success: true, publicUrl });
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<CommentComposer onSubmit={onSubmit} />);
    attach(container);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled());
    expect(f.compress).toHaveBeenCalledWith(expect.any(File), { preset: 'feed' });
    expect(f.upload).toHaveBeenCalledTimes(1);
    expect(f.upload).toHaveBeenCalledWith(compressed, 'clbhouz-post-images', expect.stringMatching(/^comments\/user-1\/\d+-[a-z0-9]*\.jpeg$/));
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ mediaUrl: publicUrl, mediaType: 'image' });
    expect(f.storageFrom).not.toHaveBeenCalled();
  });

  it('a failed upload toasts the error, leaves no pending image and does not submit', async () => {
    f.upload.mockResolvedValue({ success: false, error: 'x' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onSubmit = vi.fn();
    const { container } = render(<CommentComposer onSubmit={onSubmit} />);
    attach(container);
    await waitFor(() => expect(f.toastError).toHaveBeenCalledWith("Couldn't attach photo", { description: 'x' }));
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();
    fireEvent.click(send);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(f.storageFrom).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('CommentImageV2 renders an https URL directly without signing', async () => {
    const url = 'https://images.clbhouz.com/comments/user-1/p.jpeg';
    const { container } = render(<CommentImageV2 mediaUrl={url} />);
    await waitFor(() => expect(container.querySelector('img')?.getAttribute('src')).toBe(url));
    expect(f.signed).not.toHaveBeenCalled();
  });

  it('CommentImageV2 still signs a bare path from comment-images', async () => {
    render(<CommentImageV2 mediaUrl="user-1/old.jpg" />);
    await waitFor(() => expect(f.signed).toHaveBeenCalledWith('user-1/old.jpg', 3600));
    expect(f.storageFrom).toHaveBeenCalledWith('comment-images');
  });
});
