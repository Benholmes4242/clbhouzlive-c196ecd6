import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/components/profile/edit-v2/ImageCropperModal', () => ({ getCroppedImg: vi.fn(async () => new Blob(['c'], { type: 'image/jpeg' })) }));
vi.mock('react-easy-crop', () => ({ default: (p: { onCropComplete: (a: unknown, b: unknown) => void }) => <div data-testid="cropper"><button onClick={() => p.onCropComplete({}, { x: 0, y: 0, width: 10, height: 10 })}>Position</button></div> }));

import { WelcomeCropper } from '@/features/onboarding/WelcomeCropper';

const cssFiles = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? cssFiles(p) : p.endsWith('.css') ? [p] : []; });

describe('FIX_PHOTO_CROPPER_WHOLE_PHOTO', () => {
  it('no stylesheet sets max-width/max-height none on the cropper image', () => {
    for (const f of cssFiles('src')) {
      const css = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const reaches = /welcome-cropper[^,]*\bimg\b|reactEasyCrop_/.test(m[1]);
        if (reaches) expect(/max-(width|height)\s*:\s*none/.test(m[2]), `${f}: ${m[1]}`).toBe(false);
      }
    }
    const tsx = readFileSync('src/features/onboarding/WelcomeCropper.tsx', 'utf8');
    expect(tsx).not.toMatch(/max-w-none|max-h-none/);
  });

  it('stage has the signed-off offsets for both appearances', () => {
    const css = readFileSync('src/features/onboarding/welcome-cropper.css', 'utf8');
    expect(css).toMatch(/\.welcome-cropper-stage\{position:absolute;left:0;right:0;top:calc\(env\(safe-area-inset-top, 0px\) \+ 76px\);bottom:calc\(env\(safe-area-inset-bottom, 0px\) \+ 150px\);overflow:hidden\}/);
    expect(css).toMatch(/\[data-appearance="business"\] \.welcome-cropper-stage\{bottom:calc\(env\(safe-area-inset-bottom, 0px\) \+ 172px\)\}/);
  });

  it('the cropper sits inside the stage', () => {
    render(<WelcomeCropper image="x" onCancel={() => {}} onUse={() => {}} appearance="business" />);
    const stage = document.querySelector('[data-welcome-cropper-stage]')!;
    expect(stage.querySelector('[data-testid="cropper"]')).not.toBeNull();
    expect(stage.closest('[data-appearance="business"]')).not.toBeNull();
  });

  it('Cancel and Use photo call their handlers', async () => {
    const onCancel = vi.fn(); const onUse = vi.fn();
    render(<WelcomeCropper image="x" onCancel={onCancel} onUse={onUse} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' })); expect(onCancel).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Position' })); fireEvent.click(screen.getByRole('button', { name: 'Use photo' })); await waitFor(() => expect(onUse).toHaveBeenCalledTimes(1));
    expect(onUse.mock.calls[0][0]).toBeInstanceOf(File);
  });

  it('ProfilePageV2 opens WelcomeCropper for the avatar with the existing handlers', () => {
    const src = readFileSync('src/pages/ProfilePageV2.tsx', 'utf8');
    expect(src).not.toMatch(/ImageCropModal/);
    const block = src.slice(src.indexOf('<WelcomeCropper'), src.indexOf('/>', src.indexOf('<WelcomeCropper')));
    expect(block).toMatch(/aspect=\{AVATAR_CROP_ASPECT\}/);
    expect(block).toMatch(/frameShape="squircle"/);
    expect(block).toMatch(/onCancel=\{\(\) => handleCropCancel\(false\)\}/);
    expect(block).toMatch(/onUse=\{handleCropComplete\}/);
  });
});
