import { describe, expect, it } from 'vitest';
import { holePhotoErrorMessage } from '@/lib/courseMedia/holePhotoError';

describe('photo-tagging error classification', () => {
  it('23505 maps to the specified duplicate-photo message', () => {
    expect(holePhotoErrorMessage({ code: '23505', message: 'unique violation' })).toBe('That photo is already tagged.');
  });
  it('retag also maps 23505 instead of its generic failure', () => {
    expect(holePhotoErrorMessage({ code: '23505' }, 'The new tag was not saved.')).toBe('That photo is already tagged.');
  });
  it('other failures preserve their caller fallback', () => {
    expect(holePhotoErrorMessage({ code: '42501' }, 'Tag failed')).toBe('Tag failed');
    expect(holePhotoErrorMessage(null, 'Tag failed')).toBe('Tag failed');
  });
});