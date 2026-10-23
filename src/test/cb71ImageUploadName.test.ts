import { describe, expect, it } from 'vitest';
import { imageUploadFileName, assertSavableImageUrl, FALLBACK_IMAGE_EXT } from '@/lib/media/imageUploadName';

const f = (name: string, type: string) => new File([new Uint8Array([1])], name, { type });

describe('CB71 image upload file names', () => {
  it('a nameless, extension-less file with a known type gets that type\'s extension', () => {
    expect(imageUploadFileName(f('', 'image/jpeg'), '1784831373455-ijo0fl0387b')).toBe('1784831373455-ijo0fl0387b.jpeg');
    expect(imageUploadFileName(f('blob', 'image/png'), 'a')).toBe('a.png');
    expect(imageUploadFileName(f('x', 'image/webp'), 'a')).toBe('a.webp');
    expect(imageUploadFileName(f('x', 'image/heic'), 'a')).toBe('a.heic');
  });

  it('MIME type wins over a mismatched original name', () => {
    expect(imageUploadFileName(f('IMG_1.HEIC', 'image/webp'), 'a')).toBe('a.webp');
  });

  it('an empty-type file falls back to the name\'s extension, then jpeg', () => {
    expect(imageUploadFileName(f('IMG_1.PNG', ''), 'a')).toBe('a.png');
    expect(imageUploadFileName(f('photo', ''), 'a')).toBe(`a.${FALLBACK_IMAGE_EXT}`);
    expect(FALLBACK_IMAGE_EXT).toBe('jpeg');
  });

  it('a trailing-dot name is fixed, never a bare dot', () => {
    expect(imageUploadFileName(f('photo.', ''), 'a')).toBe('a.jpeg');
    expect(imageUploadFileName(f('', 'image/jpeg'), '1784831373455-x.')).toBe('1784831373455-x.jpeg');
  });

  it('the save guard rejects an extension-less or trailing-dot URL and accepts a real one', () => {
    const base = 'https://media.clbhouz.co.uk/u/clbhouz-post-images/';
    expect(() => assertSavableImageUrl(`${base}1784831373455-ijo0fl0387b`, `${base}1784831373455-ijo0fl0387b`)).toThrow();
    expect(() => assertSavableImageUrl(`${base}1784831373455-x.`, `${base}1784831373455-x.`)).toThrow();
    expect(() => assertSavableImageUrl('', '')).toThrow();
    const ok = `${base}1792652450526-ggycllc1u77.jpeg`;
    expect(assertSavableImageUrl(ok, ok)).toBe(ok);
  });

  it('the save guard rejects a URL that is not the upload\'s returned publicUrl', () => {
    expect(() => assertSavableImageUrl('https://m/a.jpeg', 'https://m/b.jpeg')).toThrow();
  });
});
