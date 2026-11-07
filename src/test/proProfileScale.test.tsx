import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// FIX3: pro profile sections below the hero match the golfer profile scale
// (HeroHandicapDisplay): 9px/700 kickers, 16px tile figures, 7px tile labels,
// 12.5px body. Source assertions because jsdom does not apply stylesheets.
const css = readFileSync('src/features/pro-profile/pro-profile.css', 'utf8');
const rule = (selector: string) =>
  css.match(new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\{([^}]+)\\}'))?.[1] ?? '';

describe('FIX3 pro profile section scale', () => {
  it('section padding and heading match the golfer scale', () => {
    expect(rule('.pro-profile-section')).toContain('padding:18px 16px 0');
    expect(rule('.pro-profile-heading')).toContain('margin-bottom:8px');
    const h2 = rule('.pro-profile-heading h2');
    expect(h2).toContain('font-size:9px');
    expect(h2).toContain('font-weight:700');
    expect(h2).toContain('letter-spacing:.16em');
    expect(rule('.pro-profile-source')).toContain('font-size:10px');
  });

  it('season tiles use 16px figures and 7px labels with 6px gap', () => {
    expect(rule('.pro-season-tiles')).toContain('gap:6px');
    expect(rule('.pro-season-tiles .pro-profile-tile')).toContain('padding:8px 5px 7px');
    const b = rule('.pro-season-tiles .pro-profile-tile b');
    expect(b).toContain('font-size:16px');
    expect(b).toContain('font-weight:700');
    const span = rule('.pro-season-tiles .pro-profile-tile span');
    expect(span).toContain('font-size:7px');
    expect(span).toContain('font-weight:700');
    expect(span).toContain('letter-spacing:.1em');
  });

  it('result rows match the golfer scale', () => {
    expect(rule('.pro-profile-row')).toContain('padding:10px 2px');
    const finish = rule('.pro-profile-finish');
    expect(finish).toContain('width:40px');
    expect(finish).toContain('font-size:13px');
    expect(rule('.pro-profile-eliminated')).toContain('font-size:11.5px');
    const event = rule('.pro-profile-event b');
    expect(event).toContain('font-size:13px');
    expect(event).toContain('font-weight:700');
    expect(rule('.pro-profile-event small')).toContain('font-size:11px');
    expect(rule('.pro-profile-score b')).toContain('font-size:13.5px');
    expect(rule('.pro-profile-score b.pro-profile-gross')).toContain('font-size:13px');
    expect(rule('.pro-profile-row .lucide')).toContain('width:14px');
    expect(rule('.pro-profile-all')).toContain('font-size:12px');
  });

  it('career timeline matches the golfer scale', () => {
    const year = rule('.pro-career-timeline b');
    expect(year).toContain('font-size:9px');
    expect(year).toContain('letter-spacing:.14em');
    const text = rule('.pro-career-timeline span');
    expect(text).toContain('font-size:12.5px');
    expect(text).toContain('font-weight:600');
    expect(text).toContain('line-height:1.4');
    expect(rule('.pro-career-timeline small')).toContain('font-size:10.5px');
    expect(rule('.pro-career-timeline>div')).toContain('padding-bottom:12px');
  });

  it('bag and partners match the golfer scale', () => {
    expect(rule('.pro-bag-slot')).toContain('font-size:9px');
    expect(rule('.pro-bag-main b')).toContain('font-size:12.5px');
    expect(rule('.pro-bag-main small')).toContain('font-size:11px');
    expect(rule('.pro-bag-row')).toContain('padding:9px 0');
    expect(rule('.pro-partner-tile')).toContain('height:64px');
    expect(rule('.pro-partner-tile>span:last-child')).toContain('font-size:11px');
  });

  it('Ask section titles and body follow the scale mapping', () => {
    expect(rule('.pro-ask-card b')).toContain('font-size:12.5px');
    expect(rule('.pro-ask-card small')).toContain('font-size:11.5px');
    expect(rule('.pro-ask-q>b')).toContain('font-size:12.5px');
    expect(rule('.pro-ask-q>p')).toContain('font-size:11.5px');
    expect(rule('.pro-ask-kicker')).toContain('font-size:9px');
  });
});
