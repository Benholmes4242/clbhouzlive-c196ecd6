import { describe, it, expect } from 'vitest';

describe('retained account vocabulary rules', () => {
  it('no user-facing string in src says "Alerts"', async () => {
    const { execSync } = await import('node:child_process');
    const out = execSync(`rg -n --glob '*.tsx' --glob '!**/test/**' -e '>\\s*Alerts\\s*<' -e '["\\x27\`]Alerts["\\x27\`]' src || true`, { encoding: 'utf8' });
    expect(out.trim()).toBe('');
  });
  it('no component renders "Your rounds" as a door', async () => {
    const { execSync } = await import('node:child_process');
    const hits = execSync(`grep -rn "label=\\"Your rounds\\"" src || true`).toString();
    expect(hits).toBe('');
  });
});
