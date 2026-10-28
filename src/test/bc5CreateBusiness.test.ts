import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { initialDraft } from '@/features/business-create/createRules';
const s = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn(), member: vi.fn(), invoke: vi.fn(), upload: vi.fn(), log: vi.fn(), order: [] as string[] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => ({
  insert: (data: unknown) => { s.order.push('insert'); s.insert(data); return { select: () => ({ single: async () => ({ data: { id: 'new', slug: 'park' }, error: s.insert.mock.results[0]?.value ?? null }) }) }; },
  update: (data: unknown) => { s.order.push('patch'); s.update(data); return { eq: async () => ({ error: s.update.mock.results[0]?.value ?? null }) }; },
  upsert: async (...args: unknown[]) => { s.order.push(table); return { error: s.member(...args) ?? null }; },
}), functions: { invoke: async (...args: unknown[]) => { s.order.push('claim'); return { error: s.invoke(...args) ?? null }; } } } }));
vi.mock('@/utils/r2OnlyUpload', () => ({ uploadToR2Only: (...args: unknown[]) => { s.order.push('upload'); return s.upload(...args); } }));
vi.mock('@/lib/logger', () => ({ AppLog: { error: s.log } }));
import { createBusiness } from '@/features/business-create/createBusiness';
const club = { id: 'club', name: 'Park Golf Club', club_key: 'park', country: 'United Kingdom', latitude: 51.4, longitude: 0.03 };
const draft = () => ({ ...initialDraft(new URLSearchParams()), category: 'Golf Club' as const, selectedClub: club, claimProofNote: '  Manager  ', address: { label: 'Bromley', city: 'Bromley', precision: 'city' as const } });
const run = (d = draft(), qc = new QueryClient()) => createBusiness(d, { userId: 'me', sourceCourseId: 'course', queryClient: qc });
beforeEach(() => { vi.clearAllMocks(); s.order = []; s.insert.mockReset(); s.update.mockReset(); s.member.mockReset(); s.invoke.mockReset(); s.upload.mockReset(); s.upload.mockResolvedValue({ success: true, publicUrl: '/saved.jpg' }); });
describe('BC5 shared creation', () => {
  it('inserts current fields exactly once and never grants club ownership', async () => {
    await run(); expect(s.insert).toHaveBeenCalledOnce();
    expect(s.insert.mock.calls[0][0]).toMatchObject({ name: 'Park Golf Club', category: 'Golf Club', description: null, founded_year: null, website: null, email: null, phone: null, booking_url: null, social_links: null, is_verified: false, amenities: [], primary_action: null, show_opening_hours: false, club_name: 'Park Golf Club', lat: 51.4, lng: 0.03, country: 'United Kingdom', location: 'Bromley', city: 'Bromley', opening_hours: draft().openingHours });
    expect(s.insert.mock.calls[0][0]).not.toHaveProperty('club_id'); expect(s.insert.mock.calls[0][0]).not.toHaveProperty('club_key');
  });
  it('uploads after insert and patches before the owner and claim', async () => {
    const d = draft(); d.logo.pendingFile = new File(['x'], 'logo.jpg', { type: 'image/jpeg' });
    const result = await run(d); expect(s.order).toEqual(['insert', 'upload', 'patch', 'business_members', 'claim']);
    expect(s.update).toHaveBeenCalledWith(expect.objectContaining({ logo_url: '/saved.jpg' })); expect(result.savedImages?.logo).toBe('/saved.jpg');
  });
  it('upserts the owner with the existing conflict options', async () => {
    await run(); expect(s.member).toHaveBeenCalledWith({ business_id: 'new', user_profile_id: 'me', role: 'owner' }, { onConflict: 'business_id,user_profile_id', ignoreDuplicates: true });
  });
  it('files a golf-club claim with trimmed proof and source course', async () => {
    expect((await run()).claim).toBe('filed'); expect(s.invoke).toHaveBeenCalledWith('request-course-claim', { body: { business_id: 'new', club_id: 'club', club_key: 'park', source_course_id: 'course', proof_note: 'Manager' } });
  });
  it('does not claim for non-clubs', async () => {
    const d = { ...draft(), category: 'Golf Academy' as const, businessName: 'Academy' }; const result = await createBusiness(d, { userId: 'me', queryClient: new QueryClient() });
    expect(result.claim).toBe('none'); expect(s.invoke).not.toHaveBeenCalled();
  });
  it('returns ownerless recovery and stops before claiming or refreshing', async () => {
    s.member.mockReturnValue({ message: 'denied' }); const qc = new QueryClient(); const invalidate = vi.spyOn(qc, 'invalidateQueries');
    expect((await run(draft(), qc)).ownerless).toEqual({ name: 'Park Golf Club', id: 'new', target: '/business/park' }); expect(s.invoke).not.toHaveBeenCalled(); expect(invalidate).not.toHaveBeenCalled(); expect(s.log).toHaveBeenCalledWith('BusinessProfileEditor', 'save failed at step: members upsert (FATAL: ownerless business)', expect.objectContaining({ severity: 'fatal' }));
  });
  it.each(['logo', 'cover'] as const)('records returned-empty %s upload failures as partials', async kind => {
    const d = draft(); d[kind] = { ...d[kind], pendingFile: new File(['x'], 'photo.jpg') }; s.upload.mockResolvedValue({ success: false, error: 'failed' });
    const result = await run(d); expect(result.partials).toEqual([kind === 'logo' ? 'logo' : 'cover photo']); expect(result.claim).toBe('filed');
  });
  it('collects both failures without preventing creation', async () => {
    const d = draft(); d.logo = { ...d.logo, pendingFile: new File(['x'], 'logo.jpg') }; d.cover = { ...d.cover, pendingFile: new File(['x'], 'cover.jpg') }; s.upload.mockRejectedValue(new Error('failed'));
    expect((await run(d)).partials).toEqual(['logo', 'cover photo']);
  });
  it('image patch failure suppresses saved images and records photos', async () => {
    const d = draft(); d.logo = { ...d.logo, pendingFile: new File(['x'], 'logo.jpg') }; s.update.mockReturnValue({ message: 'denied' });
    const result = await run(d); expect(result.partials).toEqual(['photos']); expect(result.savedImages).toEqual({ logo: null, cover: null });
  });
  it('claim failure returns soft failure without another insert', async () => {
    s.invoke.mockReturnValue({ message: 'Already claimed' }); const result = await run(); expect(result.claim).toBe('failed'); expect(result.claimError).toBe('Already claimed'); expect(s.insert).toHaveBeenCalledOnce();
  });
  it('insert failure stops all subsequent work', async () => {
    s.insert.mockReturnValue({ message: 'denied' }); await expect(run()).rejects.toMatchObject({ step: 'insert' }); expect(s.member).not.toHaveBeenCalled(); expect(s.upload).not.toHaveBeenCalled();
  });
  it('refresh failure never turns saved creation into a rejection', async () => {
    const qc = new QueryClient(); vi.spyOn(qc, 'invalidateQueries').mockRejectedValue(new Error('refresh'));
    expect((await run(draft(), qc)).id).toBe('new');
  });
});