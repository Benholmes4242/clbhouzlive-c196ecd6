import React from 'react';
import { readFileSync } from 'node:fs';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OtpSheetContent from '@/pages/auth/components/OtpSheetContent';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const css = readFileSync('src/pages/auth/components/auth-hero.css', 'utf8');
/** Joined bodies of every rule whose selector list contains exactly `needle`. */
function rule(scope: string, needle: string): string {
  const bodies: string[] = [];
  for (const match of scope.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (match[1].split(',').some((sel) => sel.trim().split(/\s+/).pop() === needle)) bodies.push(match[2]);
  }
  if (!bodies.length) throw new Error(`Missing rule for ${needle}`);
  return bodies.join('\n');
}
const compact = css.split('@media (max-height: 640px) {')[1] ?? '';

afterEach(() => cleanup());

describe('AUTH_SQUIRCLES radii', () => {
  it('states the 34% rule once as named custom properties', () => {
    expect(css).toContain('--auth-radius-control: 18px');
    expect(css).toContain('--auth-radius-social: 21px');
    expect(css).toContain('--auth-radius-back: 12px');
    expect(css).toContain('--auth-radius-control-compact: 17px');
    expect(css).toContain('--auth-radius-social-compact: 18px');
  });
  it('gives every full-size control its signed-off corner and drops the old radii', () => {
    expect(rule(css, '.auth-hero-circle')).toContain('border-radius: var(--auth-radius-social)');
    expect(rule(css, '.auth-hero-back')).toContain('border-radius: var(--auth-radius-back)');
    expect(rule(css, '.auth-hero-pill')).toContain('border-radius: var(--auth-radius-control)');
    expect(rule(css, '.auth-hero-input')).toContain('border-radius: var(--auth-radius-control)');
    expect(rule(css, '.auth-hero-otp-box')).toContain('border-radius: var(--auth-radius-control)');
    expect(rule(css, '.auth-hero-circle')).not.toContain('border-radius: 50%');
    expect(css).not.toContain('border-radius: 999px');
    expect(css).not.toContain('border-radius: 14px');
  });
  it('keeps the look-around band square and the amber dot round', () => {
    expect(rule(css, '.auth-hero-band')).toContain('border-radius: 0');
    expect(rule(css, '.auth-hero-dot')).toContain('border-radius: 50%');
  });
  it('adds the matching compact corners inside the max-height: 640px block', () => {
    expect(compact).toBeTruthy();
    expect(rule(compact, '.auth-hero-circle')).toContain('border-radius: var(--auth-radius-social-compact)');
    expect(rule(compact, '.auth-hero-pill')).toContain('border-radius: var(--auth-radius-control-compact)');
    expect(rule(compact, '.auth-hero-input')).toContain('border-radius: var(--auth-radius-control-compact)');
    expect(rule(compact, '.auth-hero-otp-box')).toContain('border-radius: var(--auth-radius-control-compact)');
  });
  it('centres every pill’s text, icon or spinner with flex', () => {
    const pill = rule(css, '.auth-hero-pill');
    expect(pill).toContain('display: flex');
    expect(pill).toContain('align-items: center');
    expect(pill).toContain('justify-content: center');
    const circle = rule(css, '.auth-hero-circle');
    expect(circle).toContain('display: flex');
    expect(circle).toContain('align-items: center');
    expect(circle).toContain('justify-content: center');
  });
});

describe('AUTH_SQUIRCLES Verify spinner', () => {
  it('renders the Verify button with the spinner and no text while submitting', () => {
    const { container } = render(
      <OtpSheetContent
        email="member@example.com"
        submitting
        errorMessage={null}
        resendCooldown={0}
        onVerify={() => {}}
        onResend={() => {}}
        onUseDifferentEmail={() => {}}
      />,
    );
    const verify = container.querySelector('button.auth-hero-pill.auth-hero-send');
    if (!verify) throw new Error('Missing Verify button');
    expect(verify.querySelector('svg.animate-spin')).toBeTruthy();
    expect(verify.textContent).toBe('');
  });
});
