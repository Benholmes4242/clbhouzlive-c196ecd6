import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn(), rpc: vi.fn(), auth: { getSession: vi.fn() } } }));
import { ConnectTopChrome, connectWrapperBackground } from '@/components/profile/handicap/whs/WhsConnectScreen';
import { SURFACE } from '@/components/profile/handicap/whs/connect/designTokens';

const STAGES = ['intro', 'country', 'form', 'comingSoon', 'sync', 'declined', 'done'];

describe('connect done chrome (BRIEF_CONNECT_DONE_CHROME)', () => {
  it('done renders no back control and no HANDICAP label', () => {
    render(<ConnectTopChrome stage="done" title="Handicap" immersive />);
    expect(document.querySelector('[aria-label^="Back to"]')).toBeNull();
    expect(screen.queryByText(/handicap/i)).toBeNull();
  });
  it.each(['intro', 'country', 'form', 'comingSoon', 'sync', 'declined'])('%s still renders BackRow', (s) => {
    render(<ConnectTopChrome stage={s} title="Handicap" onBack={() => {}} immersive />);
    expect(document.querySelector('[aria-label^="Back to"]')).not.toBeNull();
  });
  it('wrapper background is SURFACE on every stage, done included', () => {
    for (const s of STAGES) expect(connectWrapperBackground(s)).toBe(SURFACE);
  });
});
