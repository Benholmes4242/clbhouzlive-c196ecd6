import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('react-easy-crop', () => ({ default: (p: { objectFit: string; minZoom: number; maxZoom: number; restrictPosition: boolean }) => <output data-testid="crop" data-fit={p.objectFit} data-min={p.minZoom} data-max={p.maxZoom} data-restrict={String(p.restrictPosition)} /> }));
import { WelcomeCropper } from '@/features/onboarding/WelcomeCropper';
describe('FIX6 Welcome cropper', () => {
  it('fits without stretching and restricts zoom to 1–4', () => {
    const { getByTestId } = render(<WelcomeCropper image="image" onCancel={vi.fn()} onUse={vi.fn()} />);
    expect(getByTestId('crop')).toHaveAttribute('data-fit', 'contain');
    expect(getByTestId('crop')).toHaveAttribute('data-min', '1');
    expect(getByTestId('crop')).toHaveAttribute('data-max', '4');
    expect(getByTestId('crop')).toHaveAttribute('data-restrict', 'true');
  });
});