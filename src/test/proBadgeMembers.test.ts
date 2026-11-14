import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProLabel } from '@/features/pro-verification/ProLabel';

const label = readFileSync(process.cwd() + '/src/features/pro-verification/pro-label.css', 'utf8');
const controls = readFileSync(process.cwd() + '/src/features/pro-verification/pro-status-controls.css', 'utf8');
const tokens = readFileSync(process.cwd() + '/src/index.css', 'utf8');
const profile = readFileSync(process.cwd() + '/src/features/pro-profile/pro-profile.css', 'utf8');

function rule(source: string, selector: string) {
  const body = source.split(selector + ' ')[1]?.match(/^\{([^}]+)\}/)?.[1]
    ?? source.split(selector + '{')[1]?.split('}')[0];
  expect(body, selector).toBeDefined();
  return body ?? '';
}

describe('Members badge source contract', () => {
  it('defines the exact plate, amber rim and foil tokens and retires the pearl plate', () => {
    expect(tokens).toContain('--member-badge-plate: linear-gradient(180deg, #26272B 0%, #0E0E10 55%, #050506 100%);');
    expect(tokens).toContain('--member-badge-rim: linear-gradient(135deg, #FFD9A6 0%, #F7931E 35%, #FFC37A 60%, #C46A0E 100%);');
    expect(tokens).toContain('--member-badge-foil: linear-gradient(180deg, #FFE7C4 0%, #FFB45C 45%, #F7931E 70%, #FFD49A 100%);');
    expect(tokens).not.toContain('--pro-label-plate');
  });

  it('keeps the normal badge at 20px with an inside-box amber rim', () => {
    const css = rule(label, '.pro-label');
    for (const declaration of ['height:20px', 'padding:0 7px', 'border-radius:7px', 'border:1px solid transparent', 'box-sizing:border-box', 'var(--member-badge-plate) padding-box, var(--member-badge-rim) border-box']) expect(css).toContain(declaration);
    expect(css).not.toContain('box-shadow');
  });

  it('uses clipped amber foil letters with the signed-off normal type', () => {
    const css = rule(label, '.pro-label-text');
    for (const declaration of ['font-size:9.5px', 'font-weight:800', 'letter-spacing:0.14em', 'margin-right:-0.14em', 'background:var(--member-badge-foil)', 'background-clip:text', '-webkit-text-fill-color:transparent']) expect(css).toContain(declaration);
  });

  it('keeps the small badge at 16px with 8.5px letters', () => {
    const css = rule(label, '.pro-label[data-size="small"]');
    for (const declaration of ['height:16px', 'padding:0 5px', 'border-radius:5.5px']) expect(css).toContain(declaration);
    expect(rule(label, '.pro-label[data-size="small"] .pro-label-text')).toContain('font-size:8.5px');
  });

  it('keeps the island badge at 22px with 10.5px letters and no shadow', () => {
    const css = rule(controls, '.pro-island-cell .pro-label[data-size]');
    for (const declaration of ['height:22px', 'padding:0 8px', 'border-radius:7.5px', 'border:1px solid transparent', 'var(--member-badge-plate) padding-box, var(--member-badge-rim) border-box']) expect(css).toContain(declaration);
    expect(rule(controls, '.pro-island-cell .pro-label[data-size] .pro-label-text')).toContain('font-size:10.5px');
    expect(css).not.toContain('box-shadow');
  });

  it('keeps badge rules free of pill corners and motion while preserving pending and surname rules', () => {
    expect(rule(controls, '.pro-being-checked')).toContain('border-radius:7px');
    expect(rule(profile, '.pro-hero-surname .pro-label')).toContain('top:1px');
    for (const source of [label, controls, profile]) {
      const badges = source.match(/[^{}]*(?:\.pro-label|\.pro-being-checked)[^{}]*\{[^}]*\}/g) ?? [];
      expect(badges.join('\n')).not.toMatch(/border-radius:\s*999px|animation\s*:|transition\s*:/);
    }
  });

  it('renders the exact outer class, default PRO, optional AM and small size', () => {
    const { container, rerender } = render(createElement(ProLabel));
    expect(container.firstElementChild?.className).toBe('pro-label');
    expect(container.firstElementChild?.textContent).toBe('PRO');
    expect(container.firstElementChild?.getAttribute('data-kind')).toBe('pro');
    expect(container.firstElementChild?.firstElementChild?.className).toBe('pro-label-text');
    rerender(createElement(ProLabel, { kind: 'am' }));
    expect(container.firstElementChild?.textContent).toBe('AM');
    expect(container.firstElementChild?.getAttribute('data-kind')).toBe('am');
    rerender(createElement(ProLabel, { size: 'small' }));
    expect(container.firstElementChild?.getAttribute('data-size')).toBe('small');
  });
});