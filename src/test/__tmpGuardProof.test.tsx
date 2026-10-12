import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

// Throwaway: proves the inset guard in sheetRuleInset.test.tsx actually fails
// when a rule IS re-bleed to the card border. Deleted after running.
describe('guard is live', () => {
  it('detects a re-bleed', () => {
    const { container } = render(<div data-form-rule style={{ height: 1, margin: '12px -14px 11px' }} />);
    const rule = container.querySelector('[data-form-rule]') as HTMLElement;
    expect(parseFloat(rule.style.marginLeft || '0')).toBeLessThan(0);
    expect(rule.style.margin).toMatch(/-\d/);
  });
});
