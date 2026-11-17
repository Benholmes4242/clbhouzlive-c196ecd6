import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const rpc = vi.fn().mockResolvedValue({ error: null });
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));
vi.mock('@/features/guest/useGuestActionGate', () => ({ useGuestSheetGate: (o: boolean) => o }));
vi.mock('@/utils/haptics', () => ({ haptic: () => {} }));
const success = vi.fn(); const error = vi.fn();
vi.mock('@/lib/toast', () => ({ toast: { success: (...a: unknown[]) => success(...a), error: (...a: unknown[]) => error(...a) } }));

import { ReportSheet, reportSheetTitle } from '@/components/moderation/ReportSheet';

describe('REPORT_SHEET_CANON', () => {
  beforeEach(() => { rpc.mockClear(); success.mockClear(); });
  it('titles per report type and subject', () => {
    expect(reportSheetTitle('message')).toBe('Report message');
    expect(reportSheetTitle('review')).toBe('Report review');
    expect(reportSheetTitle('group')).toBe('Report group');
    expect(reportSheetTitle('user')).toBe('Report golfer');
    expect(reportSheetTitle('user', 'business')).toBe('Report business');
  });
  it('other needs details; payload keeps the message prefix', async () => {
    const close = vi.fn();
    render(<ReportSheet open onOpenChange={close} reportType="message" reportedUserId="u1" reportedMessageId="m1" />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
    const send = screen.getByRole('button', { name: /send report/i });
    expect(send).toBeDisabled();
    fireEvent.click(radios[4]);
    expect(radios[4]).toHaveAttribute('aria-checked', 'true');
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Report details'), { target: { value: 'x' } });
    expect(send).not.toBeDisabled();
    fireEvent.click(send);
    await waitFor(() => expect(close).toHaveBeenCalledWith(false));
    expect(rpc).toHaveBeenCalledWith('submit_report', { p_reported_user_id: 'u1', p_reported_conversation_id: null, p_reason: 'other', p_details: '[MSG:m1] x' });
    expect(success).toHaveBeenCalledWith('Report sent', expect.anything());
  });
});
