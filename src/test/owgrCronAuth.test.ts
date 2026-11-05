import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticateSyncRequest, internalTargetError } from '../../supabase/functions/sync-pro-world-rankings/requestAuth';
import { authorized, syncEach } from '../../supabase/functions/sync-pro-world-rankings/runSync';

const secret = 'test-internal-secret';
const cors = { 'Access-Control-Allow-Origin': '*' };
const request = (provided?: string, body?: object) => new Request('https://example.test/sync', {
  method: 'POST', headers: { Authorization: 'Bearer test-admin', ...(provided === undefined ? {} : { 'x-internal-secret': provided }) },
  body: body ? JSON.stringify(body) : undefined,
});
beforeEach(() => vi.stubGlobal('Deno', { env: { get: (name: string) => name === 'INTERNAL_FN_SECRET' ? secret : undefined } }));
afterEach(() => vi.unstubAllGlobals());

describe('OWGR internal cron authentication', () => {
  it('correct secret with no body runs all pros without JWT', async () => {
    const req = request(secret);
    const jwt = vi.fn(async () => new Response(null, { status: 401 }));
    expect(await authenticateSyncRequest(req, cors, jwt)).toBeNull();
    expect(internalTargetError(req, undefined, cors)).toBeNull();
    expect(jwt).not.toHaveBeenCalled();
    const sources = ['first', 'second'].map(user_id => ({ user_id, owgr_url: '', owgr_slug: '' }));
    const profiles = sources.map(s => ({ id: s.user_id, pro_kind: 'tour_pro', pro_verified_at: '2026-11-01', pro_player_id: null }));
    const sync = vi.fn(async () => {});
    expect(await syncEach(sources, profiles, sync, async () => {})).toEqual({ checked: 2, updated: 2, failed: [] });
    expect(sync.mock.calls).toHaveLength(2);
  });
  it('correct secret with user_id is refused with 400', async () => {
    const req = request(secret, { user_id: '00000000-0000-4000-8000-000000000001' });
    expect(await authenticateSyncRequest(req, cors, async () => null)).toBeNull();
    const body = await req.json();
    expect(internalTargetError(req, body.user_id, cors)?.status).toBe(400);
  });
  it('wrong secret returns 401 even with valid admin JWT and never falls through', async () => {
    const jwt = vi.fn(async () => null);
    expect((await authenticateSyncRequest(request('wrong'), cors, jwt))?.status).toBe(401);
    expect(jwt).not.toHaveBeenCalled();
  });
  it('unset internal secret returns 500 without JWT fallback', async () => {
    vi.stubGlobal('Deno', { env: { get: () => undefined } });
    const jwt = vi.fn(async () => null);
    expect((await authenticateSyncRequest(request(secret), cors, jwt))?.status).toBe(500);
    expect(jwt).not.toHaveBeenCalled();
  });
  it('no header preserves admin JWT access and targeted runs', async () => {
    const req = request();
    const admin = vi.fn(async () => true);
    const jwt = vi.fn(async () => await authorized(false, true, admin) ? null : new Response(null, { status: 403 }));
    expect(await authenticateSyncRequest(req, cors, jwt)).toBeNull();
    expect(jwt).toHaveBeenCalledOnce();
    expect(admin).toHaveBeenCalledOnce();
    expect(internalTargetError(req, 'target', cors)).toBeNull();
  });
  it('no header preserves service-role access without admin lookup', async () => {
    const admin = vi.fn(async () => false);
    const jwt = vi.fn(async () => await authorized(true, true, admin) ? null : new Response(null, { status: 403 }));
    expect(await authenticateSyncRequest(request(), cors, jwt)).toBeNull();
    expect(jwt).toHaveBeenCalledOnce();
    expect(admin).not.toHaveBeenCalled();
  });
  it('empty internal header is present and refuses JWT fallback', async () => {
    const jwt = vi.fn(async () => null);
    expect((await authenticateSyncRequest(request(''), cors, jwt))?.status).toBe(401);
    expect(jwt).not.toHaveBeenCalled();
  });
});