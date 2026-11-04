/**
 * BRIEF 1 — Pro verification (request + review flow). Covers the shared
 * rules (validity, RPC args, prefill, status lines), the Rounds-gate pro
 * branches, the activity ledger kinds and links, the Edit profile pills,
 * the ProDetailsSheet submit/withdraw paths and the admin Pros tab/card.
 * react-i18next mock copied in full from profileCoursesRecord.test.tsx:33.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const f = vi.hoisted(() => ({
  rpc: vi.fn(),
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
  pro: {
    verified: false, pending: false, declined: false,
    kind: null as string | null, tour: null as string | null, tourCode: null as string | null,
    club: null as string | null, body: null as string | null,
    reviewReason: null as string | null, request: null as unknown,
    isLoading: false,
  },
  invalidate: vi.fn(),
  reviewMutate: vi.fn(),
  setProPlayerLink: vi.fn(),
}));

vi.mock('@/lib/toast', () => ({ toast: f.toast }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: f.rpc,
    from: () => {
      const chain = {
        select: () => chain,
        ilike: async () => ({ data: [], error: null }),
      };
      return chain;
    },
  },
}));
vi.mock('@/features/pro-verification/useMyProStatus', () => ({
  useMyProStatus: () => f.pro,
  useInvalidateMyProStatus: () => f.invalidate,
}));
vi.mock('@/features/admin/hooks/useVerifications', () => ({
  useVerifications: () => ({
    data: [], isLoading: false, refetch: vi.fn(),
    counts: { all: 0, pending: 0, business: 0, golfer: 0, pro: 0, courseClaim: 0 },
    reviewMutation: { mutate: f.reviewMutate, isPending: false },
    revokeMutation: { mutate: vi.fn(), isPending: false },
    removeGolferMutation: { mutate: vi.fn(), isPending: false },
    setProPlayerLinkMutation: { mutate: f.setProPlayerLink, isPending: false },
  }),
  useProofConflict: () => ({ data: null }),
}));

import {
  EMPTY_PRO_DRAFT, OTHER_TOUR, PRO_TOUR_CHIPS,
  isProKind, proChecklistLine, proDeclineReasonLabel, proDeclineReasonText,
  proDraftFromRequest, proDraftValid, proGateStatus, proKindLabel,
  proRequestArgs, proStatusLine,
  type ProDetailsDraft, type ProRequestRow,
} from '@/features/pro-verification/proRules';
import { roundsGateState } from '@/features/explore-magazine/RoundsGate';
import { resolveKind } from '@/features/activity-v2/components/ledgerKinds';
import { getActivityLink } from '@/features/activity-v2/utils/activityLinks';
import type { ActivityFeedRowV2 } from '@/features/activity-v2/hooks/useActivityFeedV2';
import { EditProfilePro } from '@/features/edit-profile/EditProfilePro';
import { ProDetailsSheet } from '@/features/pro-verification/ProDetailsSheet';
import { VerificationsTab } from '@/features/admin/components/VerificationsReview';
import type { VerificationRow } from '@/features/admin/hooks/useVerifications';

const draft = (over: Partial<ProDetailsDraft>): ProDetailsDraft => ({ ...EMPTY_PRO_DRAFT, ...over });
const requestRow = (over: Partial<ProRequestRow>): ProRequestRow => ({
  id: 'r1', kind: 'tour_pro', status: 'pending', pro_tour: 'PGA TOUR', pro_tour_code: 'pga',
  pro_body: null, pro_club: null, pro_membership_number: null, pro_link: 'https://pgatour.com/player/1',
  pro_no_profile: false, pro_how_to_check: null, pro_player_id: null, review_reason: null,
  created_at: '2026-11-01T10:00:00Z', ...over,
});

function mountSheet(open = true) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onClose = vi.fn();
  render(<QueryClientProvider client={qc}><ProDetailsSheet userId="me" open={open} onClose={onClose} /></QueryClientProvider>);
  return onClose;
}

beforeEach(() => {
  vi.clearAllMocks();
  f.rpc.mockResolvedValue({ data: null, error: null });
  f.pro = {
    verified: false, pending: false, declined: false, kind: null, tour: null, tourCode: null,
    club: null, body: null, reviewReason: null, request: null, isLoading: false,
  };
});
afterEach(cleanup);

describe('BRIEF 1 §2 — pro rules', () => {
  it('a tour draft needs a tour, and Other tour needs the typed name', () => {
    expect(proDraftValid(draft({}))).toBe(false);
    expect(proDraftValid(draft({ tour: 'PGA TOUR', link: 'https://x' }))).toBe(true);
    expect(proDraftValid(draft({ tour: OTHER_TOUR, link: 'https://x' }))).toBe(false);
    expect(proDraftValid(draft({ tour: OTHER_TOUR, otherTour: ' Alps Tour ', link: 'https://x' }))).toBe(true);
  });
  it('a tour draft needs the profile link, or the no-profile answer instead', () => {
    expect(proDraftValid(draft({ tour: 'PGA TOUR' }))).toBe(false);
    expect(proDraftValid(draft({ tour: 'PGA TOUR', noProfile: true }))).toBe(false);
    expect(proDraftValid(draft({ tour: 'PGA TOUR', noProfile: true, howToCheck: 'Tour card 2026' }))).toBe(true);
  });
  it('a teaching draft needs the PGA body and the club', () => {
    expect(proDraftValid(draft({ kind: 'teaching_pro' }))).toBe(false);
    expect(proDraftValid(draft({ kind: 'teaching_pro', body: 'The PGA (GB&I)' }))).toBe(false);
    expect(proDraftValid(draft({ kind: 'teaching_pro', body: 'The PGA (GB&I)', club: ' Sunningdale ' }))).toBe(true);
  });
  it('coded tours send their code; uncoded chips and Other send p_tour_code null', () => {
    expect(proRequestArgs(draft({ tour: 'PGA TOUR', link: 'https://x' }))).toEqual(expect.objectContaining({ p_tour: 'PGA TOUR', p_tour_code: 'pga' }));
    expect(proRequestArgs(draft({ tour: 'Korn Ferry Tour', link: 'https://x' }))).toEqual(expect.objectContaining({ p_tour_code: 'pgad' }));
    expect(proRequestArgs(draft({ tour: 'HotelPlanner Tour', link: 'https://x' })).p_tour_code).toBeNull();
    const other = proRequestArgs(draft({ tour: OTHER_TOUR, otherTour: 'Alps Tour', link: 'https://x' }));
    expect(other.p_tour).toBe('Alps Tour');
    expect(other.p_tour_code).toBeNull();
  });
  it('a no-profile request omits the link and sends how_to_check', () => {
    const args = proRequestArgs(draft({ tour: 'LPGA Tour', noProfile: true, link: 'https://x', howToCheck: 'Card holder' }));
    expect(args.p_link).toBeUndefined();
    expect(args.p_no_profile).toBe(true);
    expect(args.p_how_to_check).toBe('Card holder');
  });
  it('a teaching request sends body and club, with optional membership and coaching link', () => {
    expect(proRequestArgs(draft({ kind: 'teaching_pro', body: 'PGA of America', club: 'The Club', membershipNumber: ' 12345 ', coachingLink: '' })))
      .toEqual({ p_kind: 'teaching_pro', p_body: 'PGA of America', p_club: 'The Club', p_membership_number: '12345', p_link: undefined });
  });
  it('reopening prefills a coded tour request onto its chip', () => {
    const d = proDraftFromRequest(requestRow({}));
    expect(d).toEqual(expect.objectContaining({ kind: 'tour_pro', tour: 'PGA TOUR', otherTour: '', link: 'https://pgatour.com/player/1', noProfile: false }));
  });
  it('reopening an uncoded tour request lands on Other tour with the typed name', () => {
    const d = proDraftFromRequest(requestRow({ pro_tour: 'Alps Tour', pro_tour_code: null, pro_no_profile: true, pro_how_to_check: 'Card', pro_link: null }));
    expect(d).toEqual(expect.objectContaining({ tour: OTHER_TOUR, otherTour: 'Alps Tour', noProfile: true, howToCheck: 'Card' }));
  });
  it('reopening a teaching request prefills body, club and optionals', () => {
    const d = proDraftFromRequest(requestRow({ kind: 'teaching_pro', pro_body: 'The PGA (GB&I)', pro_club: 'Sunningdale', pro_membership_number: '9', pro_link: 'https://coach' }));
    expect(d).toEqual(expect.objectContaining({ kind: 'teaching_pro', body: 'The PGA (GB&I)', club: 'Sunningdale', membershipNumber: '9', coachingLink: 'https://coach' }));
  });
  it('the status line joins the kind and the tour or club', () => {
    expect(proStatusLine('tour_pro', 'PGA TOUR', null)).toBe('Tour professional · PGA TOUR');
    expect(proStatusLine('teaching_pro', null, 'Sunningdale')).toBe('Teaching professional · Sunningdale');
    expect(proStatusLine(null, null, null)).toBe('Tour professional');
  });
  it('decline reasons render in plain words', () => {
    expect(proDeclineReasonText('not_on_tour_site', 'PGA TOUR')).toBe("We couldn't find you on the PGA TOUR's site.");
    expect(proDeclineReasonText('not_pga_member')).toBe("We couldn't confirm a current membership with that PGA.");
    expect(proDeclineReasonText('details_mismatch')).toBe("The details didn't match your profile.");
    expect(proDeclineReasonText('other')).toBe('Your pro verification was declined.');
    expect(proDeclineReasonLabel('not_on_tour_site')).toBe("Couldn't find you on the tour's site");
  });
  it('kind guards and labels agree', () => {
    expect(isProKind('tour_pro')).toBe(true);
    expect(isProKind('teaching_pro')).toBe(true);
    expect(isProKind('notable')).toBe(false);
    expect(proKindLabel('teaching_pro')).toBe('Teaching professional');
    expect(proChecklistLine('tour_pro')).toContain("the tour's own site");
    expect(proChecklistLine('teaching_pro')).toContain("the PGA's own directory");
  });
  it('the gate status ranks verified above pending', () => {
    expect(proGateStatus({ verified: true, pending: true })).toBe('verified');
    expect(proGateStatus({ verified: false, pending: true })).toBe('pending');
    expect(proGateStatus({ verified: false, pending: false })).toBe('none');
  });
});

describe('BRIEF 1 §7 — the shared Rounds gate', () => {
  it('a verified pro is connected without waiting on the connection read', () => {
    expect(roundsGateState('u1', { isSuccess: false, data: undefined }, 'verified')).toBe('connected');
    expect(roundsGateState('u1', { isSuccess: true, data: null }, 'verified')).toBe('connected');
  });
  it('a pending pro gets the proPending hold, never the connect gate', () => {
    expect(roundsGateState('u1', { isSuccess: true, data: null }, 'pending')).toBe('proPending');
  });
  it('no pro status keeps the CB13 states untouched', () => {
    expect(roundsGateState('u1', { isSuccess: true, data: null }, 'none')).toBe('gated');
    expect(roundsGateState(undefined, { isSuccess: true, data: null }, 'pending')).toBe('signedOut');
    expect(roundsGateState('u1', { isSuccess: false, data: undefined }, 'pending')).toBe('loading');
  });
  it('CB45 fail-open still wins for pros', () => {
    expect(roundsGateState('u1', { isSuccess: false, isError: true, data: undefined }, 'pending')).toBe('connected');
  });
});

describe('BRIEF 1 §9 — activity kinds and links', () => {
  it.each(['golfer_verified', 'golfer_verification_approved', 'golfer_verification_rejected', 'golfer_verification_removed'])('%s renders the system verified tile', type => {
    const spec = resolveKind({ notif_type: type, actor_user_id: null });
    expect(spec.left).toBe('tile');
    expect(spec.isSystem).toBe(true);
  });
  const row = (type: string): ActivityFeedRowV2 => ({
    notif_id: 'n1', notif_type: type, created_at: '2026-11-01T10:00:00Z', is_read: false,
    message: null, title: null, entity_id: null, entity_type: null, data: {},
    actor_user_id: null, actor_username: null, actor_display_name: null, actor_avatar_url: null,
    actor_kind: 'personal', actor_route_id: null, liker_avatar_urls: null,
    target_course_name: null, target_course_image: null, target_poster_url: null, target_review_rating: null,
  } as unknown as ActivityFeedRowV2);
  it('approved opens the profile; declined and removed open Edit profile', () => {
    expect(getActivityLink(row('golfer_verified'))).toBe('/profile');
    expect(getActivityLink(row('golfer_verification_approved'))).toBe('/profile');
    expect(getActivityLink(row('golfer_verification_rejected'))).toBe('/edit-profile');
    expect(getActivityLink(row('golfer_verification_removed'))).toBe('/edit-profile');
  });
});

describe('BRIEF 1 §5 — Edit profile pills', () => {
  it.each([
    [{}, 'Not requested'],
    [{ pending: true, kind: 'tour_pro', tour: 'PGA TOUR' }, 'Being checked'],
    [{ verified: true, kind: 'teaching_pro', club: 'Sunningdale' }, 'Verified'],
    [{ declined: true, kind: 'tour_pro', tour: 'PGA TOUR', reviewReason: 'details_mismatch' }, 'Not verified'],
  ])('state %j renders the %s pill', (state, pill) => {
    Object.assign(f.pro, state);
    render(<EditProfilePro userId="me" />);
    expect(screen.getByTestId('ep-pro').textContent).toContain(pill);
  });
  it('a verified row never opens the sheet; every other state does', () => {
    Object.assign(f.pro, { verified: true, kind: 'tour_pro', tour: 'PGA TOUR' });
    render(<EditProfilePro userId="me" />);
    fireEvent.click(screen.getByRole('button', { name: /Golf professional/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
    cleanup();
    Object.assign(f.pro, { verified: false, pending: true, kind: 'tour_pro', tour: 'PGA TOUR' });
    render(<EditProfilePro userId="me" />);
    fireEvent.click(screen.getByRole('button', { name: /Golf professional/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  it('a declined row names the reason and invites a fresh request', () => {
    Object.assign(f.pro, { declined: true, kind: 'tour_pro', tour: 'PGA TOUR', reviewReason: 'not_on_tour_site' });
    render(<EditProfilePro userId="me" />);
    expect(screen.getByTestId('ep-pro').textContent).toContain("We couldn't find you on the PGA TOUR's site. Tap to send it again.");
  });
});

describe('BRIEF 1 §2 — ProDetailsSheet', () => {
  it('the footer stays disabled until the tour draft is valid, then submits with the tour code', async () => {
    const onClose = mountSheet();
    const send = screen.getByRole('button', { name: 'Request verification' });
    expect(send).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'PGA TOUR' }));
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Your tour profile'), { target: { value: 'https://pgatour.com/player/1' } });
    expect(send).toBeEnabled();
    fireEvent.click(send);
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('request_pro_verification', expect.objectContaining({
      p_kind: 'tour_pro', p_tour: 'PGA TOUR', p_tour_code: 'pga', p_link: 'https://pgatour.com/player/1', p_no_profile: false,
    })));
    expect(onClose).toHaveBeenCalledWith('sent');
  });
  it('an uncoded chip sends p_tour_code null', async () => {
    mountSheet();
    fireEvent.click(screen.getByRole('button', { name: 'HotelPlanner Tour' }));
    fireEvent.change(screen.getByLabelText('Your tour profile'), { target: { value: 'https://x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Request verification' }));
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('request_pro_verification', expect.objectContaining({ p_tour: 'HotelPlanner Tour', p_tour_code: null })));
  });
  it('Other tour asks for the typed name and sends it with a null code', async () => {
    mountSheet();
    fireEvent.click(screen.getByRole('button', { name: OTHER_TOUR }));
    const send = screen.getByRole('button', { name: 'Request verification' });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Which tour'), { target: { value: 'Alps Tour' } });
    fireEvent.change(screen.getByLabelText('Your tour profile'), { target: { value: 'https://x' } });
    fireEvent.click(send);
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('request_pro_verification', expect.objectContaining({ p_tour: 'Alps Tour', p_tour_code: null })));
  });
  it('the no-profile checkbox swaps the link for the how-can-we-check answer', async () => {
    mountSheet();
    fireEvent.click(screen.getByRole('button', { name: 'LPGA Tour' }));
    fireEvent.click(screen.getByRole('button', { name: /I don't have a tour profile/ }));
    expect(screen.getByLabelText('Your tour profile')).toBeDisabled();
    const send = screen.getByRole('button', { name: 'Request verification' });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByLabelText('How can we check'), { target: { value: '2026 tour card' } });
    fireEvent.click(send);
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('request_pro_verification', expect.objectContaining({ p_no_profile: true, p_how_to_check: '2026 tour card' })));
  });
  it('the teaching kind submits the PGA body and club', async () => {
    mountSheet();
    fireEvent.click(screen.getByRole('button', { name: /Teaching professional/ }));
    fireEvent.click(screen.getByRole('button', { name: 'The PGA (GB&I)' }));
    fireEvent.change(screen.getByLabelText('Where you coach'), { target: { value: 'Sunningdale' } });
    fireEvent.click(screen.getByRole('button', { name: 'Request verification' }));
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('request_pro_verification', expect.objectContaining({ p_kind: 'teaching_pro', p_body: 'The PGA (GB&I)', p_club: 'Sunningdale' })));
  });
  it('a pending request prefills and offers withdraw, which calls the withdraw RPC', async () => {
    f.pro.pending = true;
    f.pro.kind = 'tour_pro';
    f.pro.request = requestRow({});
    const onClose = mountSheet();
    await waitFor(() => expect(screen.getByLabelText('Your tour profile')).toHaveValue('https://pgatour.com/player/1'));
    expect(screen.getByRole('button', { name: 'PGA TOUR' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw request' }));
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('withdraw_pro_verification'));
    expect(onClose).toHaveBeenCalledWith('withdrawn');
  });
  it('an RPC error toasts the server message and keeps the sheet open', async () => {
    f.rpc.mockResolvedValue({ data: null, error: { message: 'already pending' } });
    const onClose = mountSheet();
    fireEvent.click(screen.getByRole('button', { name: 'PGA TOUR' }));
    fireEvent.change(screen.getByLabelText('Your tour profile'), { target: { value: 'https://x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Request verification' }));
    await waitFor(() => expect(f.toast.error).toHaveBeenCalledWith('already pending'));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('BRIEF 1 §8 — the admin Pros tab', () => {
  const base: VerificationRow = {
    id: 'x', type: 'golfer', status: 'pending', requestedBy: 'u0',
    createdAt: '2026-11-01T10:00:00Z', reviewedAt: null,
  } as VerificationRow;
  const rows: VerificationRow[] = [
    { ...base, id: 'g1', requestedBy: 'u1', displayName: 'Notable Golfer', kind: null },
    { ...base, id: 'p1', requestedBy: 'u2', displayName: 'Rory Test', kind: 'tour_pro', proTour: 'PGA TOUR', proTourCode: 'pga', proLink: 'https://pgatour.com/player/1', proNoProfile: false },
    { ...base, id: 'b1', type: 'business', requestedBy: 'u3', displayName: 'Test Club' },
  ];
  const review = { mutate: f.reviewMutate, isPending: false } as unknown as Parameters<typeof VerificationsTab>[0]['review'];
  const mountAdmin = () => render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <VerificationsTab data={rows} loading={false} review={review} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  it('the Pros tab counts pending pro requests and Users keeps notable only', () => {
    mountAdmin();
    expect(screen.getByRole('button', { name: /Pros/ }).textContent).toContain('1');
    fireEvent.click(screen.getByRole('button', { name: /Users/ }));
    expect(screen.getByText('Notable Golfer')).toBeInTheDocument();
    expect(screen.queryByText('Rory Test')).toBeNull();
  });
  it('the pro row names the subject and kind; the card shows facts, checklist and pro actions', async () => {
    mountAdmin();
    fireEvent.click(screen.getByRole('button', { name: /Pros/ }));
    const card = screen.getByText('Rory Test').closest('button')!;
    expect(card.textContent).toContain('Tour professional');
    fireEvent.click(card);
    await screen.findByRole('button', { name: 'Verify as pro' });
    expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
    expect(screen.getByText('https://pgatour.com/player/1')).toBeInTheDocument();
    expect(screen.getByText(/the tour's own site/)).toBeInTheDocument();
    expect(screen.queryByText(/Invite-only/)).toBeNull();
  });
  it('Verify as pro sends the request with the chosen player id (none suggested here)', async () => {
    mountAdmin();
    fireEvent.click(screen.getByRole('button', { name: /Pros/ }));
    fireEvent.click(screen.getByText('Rory Test').closest('button')!);
    fireEvent.click(await screen.findByRole('button', { name: 'Verify as pro' }));
    expect(f.reviewMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p1', type: 'golfer', decision: 'approved', playerId: null }),
      expect.anything(),
    );
  });
  it('Decline offers the pro reasons, not the notable-golfer ones', async () => {
    mountAdmin();
    fireEvent.click(screen.getByRole('button', { name: /Pros/ }));
    fireEvent.click(screen.getByText('Rory Test').closest('button')!);
    fireEvent.click(await screen.findByRole('button', { name: 'Decline' }));
    expect(await screen.findByText("Couldn't find you on the tour's site")).toBeInTheDocument();
    expect(screen.getByText('Not a current member of that PGA')).toBeInTheDocument();
    expect(screen.queryByText('Not notable enough')).toBeNull();
  });
});
