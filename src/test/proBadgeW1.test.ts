import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

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

describe('PRO badge W1 source contract', () => {
  it('uses a centred static pearl plate with 7px corners at the unchanged normal size', () => {
    const css = rule(label, '.pro-label');
    for (const declaration of ['border-radius:7px', 'background:var(--pro-label-plate)', 'box-shadow:var(--pro-label-edge)', 'height:20px', 'padding:0 8px', 'font-size:9.5px', 'font-weight:800', 'letter-spacing:0.14em', 'justify-content:center', 'overflow:hidden', 'white-space:nowrap', 'line-height:1']) expect(css).toContain(declaration);
  });

  it('keeps the small dimensions with 5.5px corners', () => {
    const css = rule(label, '.pro-label[data-size="small"]');
    for (const declaration of ['border-radius:5.5px', 'height:16px', 'padding:0 6px', 'font-size:8.5px']) expect(css).toContain(declaration);
  });

  it('uses 7.5px pearl island corners without changing island dimensions', () => {
    const css = rule(controls, '.pro-island-cell .pro-label[data-size]');
    for (const declaration of ['border-radius:7.5px', 'background:var(--pro-label-plate)', 'box-shadow:var(--pro-label-edge)', 'height:22px', 'padding:0 9px', 'font-size:10.5px', 'letter-spacing:0.14em']) expect(css).toContain(declaration);
    expect(css).not.toMatch(/border-radius:\s*999px/);
  });

  it('gives pending tags 7px corners and leaves no pill or motion in badge rules', () => {
    expect(rule(controls, '.pro-being-checked')).toContain('border-radius:7px');
    for (const source of [label, controls, profile]) {
      const badges = source.match(/[^{}]*(?:\.pro-label|\.pro-being-checked)[^{}]*\{[^}]*\}/g) ?? [];
      expect(badges.join('\n')).not.toMatch(/border-radius:\s*999px|animation\s*:|transition\s*:/);
    }
  });

  it('defines the exact four-stop plate, highlight and unchanged ink', () => {
    expect(tokens).toContain('--pro-label-plate: linear-gradient(135deg, #FFFFFF 0%, #E4E7EC 45%, #FFFFFF 70%, #D9DDE3 100%);');
    expect(tokens).toContain('--pro-label-edge: inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 1px rgba(255,255,255,0.35);');
    expect(tokens).toContain('--pro-label-ink: #0A0A0C;');
    expect(rule(profile, '.pro-hero-surname .pro-label')).toContain('top:1px');
  });
});