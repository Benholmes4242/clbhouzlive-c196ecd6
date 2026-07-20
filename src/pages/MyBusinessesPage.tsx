import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyBusinesses } from '@/hooks/useMyBusinesses';
import { BusinessCommandCard } from '@/components/business/BusinessCommandCard';
import { AddBusinessCard } from '@/components/business/AddBusinessCard';
import { BusinessEmptyState } from '@/components/business/BusinessEmptyState';

import { useActiveActor } from '@/context/ActiveActorContext';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { BIZ } from '@/components/business/businessTokens';

// Inline skeleton used by loading state — kept local since it is private to this page.
function BusinessCardSkeleton() {
  return (
    <div
      className="overflow-hidden"
      style={{
        background: BIZ.card,
        border: `1px solid ${BIZ.hair}`,
        borderRadius: BIZ.rCard,
      }}
    >
      <div className="p-4 flex items-center gap-3">
        <div
          className="w-12 h-12 animate-pulse"
          style={{ background: BIZ.fillStrong, borderRadius: BIZ.rInner }}
        />
        <div className="flex-1 space-y-2">
          <div
            className="h-4 animate-pulse rounded-lg w-2/3"
            style={{ background: BIZ.fillStrong }}
          />
          <div
            className="h-3 animate-pulse rounded-lg w-1/3"
            style={{ background: BIZ.fill }}
          />
        </div>
      </div>
      <div style={{ height: '0.5px', background: BIZ.hair }} />
      <div className="p-4 space-y-3">
        <div
          className="h-16 animate-pulse"
          style={{ background: BIZ.fillStrong, borderRadius: BIZ.rInner }}
        />
        <div
          className="h-11 animate-pulse"
          style={{ background: BIZ.fill, borderRadius: BIZ.rInner }}
        />
      </div>
    </div>
  );
}

const MyBusinessesPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseSession();
  const { data: businesses, isLoading, error, refetch } = useMyBusinesses(user?.id);
  const { activeActor } = useActiveActor();

  useHideBottomNav();

  // Sort businesses — active first, then alphabetical.
  const sortedBusinesses = useMemo(() => {
    if (!businesses || businesses.length === 0) return [];
    return [...businesses].sort((a, b) => {
      const aIsActive = activeActor?.type === 'business' && activeActor?.id === a.business.id;
      const bIsActive = activeActor?.type === 'business' && activeActor?.id === b.business.id;
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      return a.business.name.localeCompare(b.business.name);
    });
  }, [businesses, activeActor]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  if (!authLoading && !user) return null;

  const handleCreateBusiness = () => {
    navigate('/business/create');
  };


  if (error) {
    return (
      <ManagePageShell title="Manage business profiles">
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 px-4">
          <p className="text-sm text-center" style={{ color: BIZ.inkMute }}>
            Failed to load your businesses.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-bold text-white active:opacity-90"
            style={{ background: BIZ.amber, border: 'none' }}
          >
            Retry
          </button>
        </div>
      </ManagePageShell>
    );
  }

  const hasBusinesses = sortedBusinesses.length > 0;

  return (
    <ManagePageShell title="Manage business profiles">
      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col gap-4 pt-4 px-4 max-w-xl mx-auto w-full">
          <BusinessCardSkeleton />
          <BusinessCardSkeleton />
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div className="flex flex-col gap-4 pt-4 px-4 max-w-xl mx-auto w-full pb-8">
          {!hasBusinesses ? (
            <BusinessEmptyState onCreate={handleCreateBusiness} />

          ) : (
            <>
              <BusinessesAccordion
                memberships={sortedBusinesses}
                userId={user?.id || ''}
                activeBusinessId={
                  activeActor?.type === 'business' ? activeActor?.id ?? null : null
                }
              />

              <AddBusinessCard onClick={handleCreateBusiness} />
            </>
          )}
        </div>
      )}
    </ManagePageShell>
  );
};

/* ─────────────────────── accordion controller ─────────────────────── */

function BusinessesAccordion({
  memberships,
  userId,
  activeBusinessId,
}: {
  memberships: ReturnType<typeof useMyBusinesses>['data'] extends (infer T)[] | undefined ? T[] : never;
  userId: string;
  activeBusinessId: string | null;
}) {
  // Default open: single business → itself; multi → first entry (sorted: active first).
  const defaultOpenId = memberships[0]?.business?.id ?? null;
  const [openId, setOpenId] = useState<string | null>(defaultOpenId);

  // Re-sync default when the list identity changes (e.g. after create/delete).
  useEffect(() => {
    setOpenId((prev) => {
      if (prev && memberships.some((m) => m.business?.id === prev)) return prev;
      return memberships[0]?.business?.id ?? null;
    });
  }, [memberships]);

  return (
    <>
      {memberships.map((membership, index) => {
        const bizId = membership.business?.id;
        const isExpanded = openId === bizId;
        const isActive = activeBusinessId != null && activeBusinessId === bizId;
        return (
          <BusinessCommandCard
            key={membership.id}
            membership={membership}
            userId={userId}
            index={index}
            isActive={isActive}
            expanded={isExpanded}
            onToggle={() => {
              setOpenId((prev) => (prev === bizId ? null : bizId ?? null));
            }}
          />
        );
      })}
    </>
  );
}


export default MyBusinessesPage;
