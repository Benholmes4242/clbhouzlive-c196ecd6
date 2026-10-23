import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyBusinesses, type BusinessMembership } from '@/hooks/useMyBusinesses';
import { BusinessEmptyState } from '@/components/business/BusinessEmptyState';
import { DeleteBusinessDialog } from '@/components/business/DeleteBusinessDialog';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import {
  BusinessHomeHeader, BusinessHomeHeaderSkeleton, BusinessSwitcher, H,
} from '@/components/business/home/BusinessHomeHeader';
import { BusinessHomeSections } from '@/components/business/home/BusinessHomeSections';

/**
 * CB66 — Business home. One selected business and its header; below it the
 * selected business's existing card body stands in until later sections.
 *
 * Selection: last selected on this page (localStorage per user, convenience
 * only) → active actor's business if a membership → first A-Z. Chip order is
 * fixed at first load: selected-on-load first, then A-Z; taps never reshuffle.
 */
export const selectionStorageKey = (userId: string) => `clbhouz.businessHome.selected.${userId}`;

function readStored(userId: string): string | null {
  try { return window.localStorage.getItem(selectionStorageKey(userId)); } catch { return null; }
}
function writeStored(userId: string, id: string) {
  try { window.localStorage.setItem(selectionStorageKey(userId), id); } catch { /* convenience only */ }
}

const MyBusinessesPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseSession();
  const { data: businesses, isLoading, error, refetch } = useMyBusinesses(user?.id);
  const { activeActor } = useActiveActor();
  const userId = user?.id || '';

  // Hoisted confirm-delete state — the dialog lives at page level so cache
  // eviction of the deleted business never races Radix's DismissableLayer
  // cleanup. See `src/lib/radixLockSanitizer.ts`.
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const handleRequestDelete = useCallback((input: { id: string; name: string }) => setPendingDelete(input), []);

  useHideBottomNav();

  const memberships = useMemo(
    () => (businesses ?? []).filter((m): m is BusinessMembership => !!m.business),
    [businesses],
  );

  // Selected-on-load id, decided once per user when memberships first arrive.
  const [loadId, setLoadId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (memberships.length === 0) return;
    const ids = new Set(memberships.map((m) => m.business.id));
    if (selectedId && ids.has(selectedId)) return;
    const az = [...memberships].sort((a, b) => a.business.name.localeCompare(b.business.name));
    const stored = userId ? readStored(userId) : null;
    const actorId = activeActor?.type === 'business' ? activeActor.id : null;
    const pick =
      (stored && ids.has(stored) && stored) ||
      (actorId && ids.has(actorId) && actorId) ||
      az[0].business.id;
    setLoadId((prev) => (prev && ids.has(prev) ? prev : pick));
    setSelectedId(pick);
  }, [memberships, selectedId, userId, activeActor]);

  const ordered = useMemo(() => {
    const az = [...memberships].sort((a, b) => a.business.name.localeCompare(b.business.name));
    const first = az.find((m) => m.business.id === loadId);
    return first ? [first, ...az.filter((m) => m !== first)] : az;
  }, [memberships, loadId]);

  const selected = ordered.find((m) => m.business.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (userId) writeStored(userId, id);
  };

  useEffect(() => {
    // eslint-disable-next-line settled/no-not-loading-empty-check -- authLoading is the session flag, not a React Query.
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  // eslint-disable-next-line settled/no-not-loading-empty-check -- authLoading is the session flag, not a React Query.
  if (!authLoading && !user) return null;

  const handleCreateBusiness = () => navigate('/business/create');
  const title = memberships.length === 1 ? 'Your business' : 'Your businesses';

  if (error) {
    return (
      <ManagePageShell title="Your businesses">
        <div data-business-error="" style={{ margin: '28px 16px 0', textAlign: 'center' }}>
          <b className="block" style={{ fontSize: 15, fontWeight: 700, color: H.ink }}>Your businesses didn't load</b>
          <span className="block" style={{ marginTop: 4, fontSize: 13, color: H.mute }}>Check your connection and try again.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center"
            style={{
              marginTop: 12, height: 30, padding: '0 13px', borderRadius: 15, border: `1px solid ${H.btnHair}`,
              background: H.actFill, color: H.ink, fontSize: 12.5, fontWeight: 700,
            }}
          >
            Try again
          </button>
        </div>
      </ManagePageShell>
    );
  }

  const loading = authLoading || isLoading;

  return (
    <ManagePageShell title={title}>
      <div className="max-w-xl mx-auto w-full">
        {loading && <BusinessHomeHeaderSkeleton />}

        {!loading && memberships.length === 0 && (
          <div className="pt-4 px-4 w-full pb-8">
            <BusinessEmptyState onCreate={handleCreateBusiness} />
          </div>
        )}

        {!loading && memberships.length > 0 && (
          <>
            <BusinessSwitcher
              memberships={ordered}
              selectedId={selected?.business.id ?? null}
              onSelect={handleSelect}
              onAdd={handleCreateBusiness}
            />
            {selected && (
              <>
                <BusinessHomeHeader
                  key={selected.business.id}
                  membership={selected}
                  userId={userId}
                  onRequestDelete={handleRequestDelete}
                />
                <BusinessHomeSections key={`sections-${selected.business.id}`} membership={selected} userId={userId} />
              </>
            )}
          </>
        )}
      </div>

      {pendingDelete && user?.id && (
        <DeleteBusinessDialog
          open={!!pendingDelete}
          onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
          businessId={pendingDelete.id}
          businessName={pendingDelete.name}
          userId={user.id}
        />
      )}
    </ManagePageShell>
  );
};

export default MyBusinessesPage;
