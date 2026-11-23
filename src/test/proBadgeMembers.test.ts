import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProLabel } from '@/features/pro-verification/ProLabel';
import { ProfileCoverBand } from '@/components/profile/hero/ProfileCoverBand';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const label = readFileSync(process.cwd() + '/src/features/pro-verification/pro-label.css', 'utf8');
const controls = readFileSync(process.cwd() + '/src/features/pro-verification/pro-status-controls.css', 'utf8');
const tokens = readFileSync(process.cwd() + '/src/index.css', 'utf8');
const profile = readFileSync(process.cwd() + '/src/features/pro-profile/pro-profile.css', 'utf8');
const creator = readFileSync(process.cwd() + '/src/features/creator/profile-creator.css', 'utf8');

function rule(source: string, selector: string) {
  const body = [...source.matchAll(/([^{}]+)\{([^}]+)\}/g)]
    .find((match) => match[1].trim() === selector || match[1].split(',').some((part) => part.trim() === selector))?.[2];
  expect(body, selector).toBeDefined();
  return body ?? '';
}

describe('Members badge source contract', () => {
  it('wraps the personal identity row while keeping its badge group unsplit', () => {
    expect(rule(label, '.pro-identity-row, .profile-creator-identity')).toContain('flex-wrap:wrap');
    expect(rule(label, '.identity-badges')).toContain('flex:none');
  });

  it('keeps the plate and rim rule on the shared badge', () => {
    expect(rule(label, '.pro-label')).toContain('var(--member-badge-plate) padding-box, var(--member-badge-rim) border-box');
  });

  it('uppercases the shared foil letters', () => {
    expect(rule(label, '.pro-label-text')).toContain('text-transform:uppercase');
  });

  it('removes the independent Creator badge rule', () => {
    expect(creator).not.toMatch(/\.profile-creator-label\s*\{/);
  });

  it('shows PRO alone, with no creator badge, on a pro-and-creator profile', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const band = createElement(ProfileCoverBand, { coverUrl: null, avatar: null, displayName: 'Charlie Okonkwo-Bramwell', subline: null, isPro: true, isCreator: true });
    const { container, unmount } = render(createElement(QueryClientProvider, { client }, createElement(MemoryRouter, null, band)));
    expect(container.querySelector('.profile-creator-label')).toBeNull();
    const group = container.querySelector('.identity-badges');
    expect(group?.children).toHaveLength(1);
    expect(group?.children[0].className).toBe('pro-label');
    expect(group?.previousElementSibling?.tagName).toBe('H1');
    expect(label).not.toContain('.profile-creator-label');
    unmount();
    client.clear();
  });

  it('defines the exact plate, amber rim and foil tokens and retires the pearl plate', () => {
    expect(tokens).toContain('--member-badge-plate: linear-gradient(180deg, #26272B 0%, #0E0E10 55%, #050506 100%);');
    expect(tokens).toContain('--member-badge-rim: linear-gradient(135deg, #FFFFFF 0%, #B9BEC6 38%, #FFFFFF 62%, #8A9099 100%);');
    expect(tokens).toContain('--member-badge-foil: linear-gradient(180deg, #FFFFFF 0%, #E4E7EC 55%, #FFFFFF 100%);');
    expect(tokens).not.toContain('--pro-label-plate');
  });

  it('keeps the normal badge at 16px with an inside-box white rim', () => {
    const css = rule(label, '.pro-label');
    for (const declaration of ['height:16px', 'padding:0 5px', 'border-radius:5.4px', 'border:1px solid transparent', 'box-sizing:border-box', 'var(--member-badge-plate) padding-box, var(--member-badge-rim) border-box']) expect(css).toContain(declaration);
    expect(css).not.toContain('box-shadow');
  });

  it('uses clipped amber foil letters with the signed-off normal type', () => {
    const css = rule(label, '.pro-label-text');
    for (const declaration of ['font-size:7.5px', 'font-weight:700', 'letter-spacing:0.14em', 'margin-right:-0.14em', 'background:var(--member-badge-foil)', 'background-clip:text', '-webkit-text-fill-color:transparent']) expect(css).toContain(declaration);
  });

  it('keeps the small badge at 12px with 6.5px letters', () => {
    const css = rule(label, '.pro-label[data-size="small"]');
    for (const declaration of ['height:12px', 'padding:0 4px', 'border-radius:4.1px']) expect(css).toContain(declaration);
    expect(rule(label, '.pro-label[data-size="small"] .pro-label-text')).toContain('font-size:6.5px');
  });

  it('keeps the island badge at 18px with 8.5px letters and no shadow', () => {
    const css = rule(controls, '.pro-island-cell .pro-label[data-size]');
    for (const declaration of ['height:18px', 'padding:0 6px', 'border-radius:6.1px', 'border:1px solid transparent', 'var(--member-badge-plate) padding-box, var(--member-badge-rim) border-box']) expect(css).toContain(declaration);
    expect(rule(controls, '.pro-island-cell .pro-label[data-size] .pro-label-text')).toContain('font-size:8.5px');
    expect(css).not.toContain('box-shadow');
  });

  it('keeps badge rules free of pill corners and motion while preserving pending and surname rules', () => {
    expect(rule(controls, '.pro-being-checked')).toContain('border-radius:7px');
    expect(rule(profile, '.pro-hero-surname .pro-label')).toContain('top:0');
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