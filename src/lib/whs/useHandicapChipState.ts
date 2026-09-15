import { useHandicapTrend, useWhsConnection } from './hooks';

/**
 * ONE DEFINITION OF "HAS THIS MEMBER CONNECTED A HANDICAP", so the header's
 * "Connect HCP" chip and any surface that invites the member to connect can
 * never disagree.
 *
 * The predicate is the one the header chip has always used: a live
 * whs_connections row AND a readable current index. A connection with no index
 * yet is NOT connected for display purposes - that is the state the chip has
 * always treated as disconnected, and two surfaces disagreeing about it is
 * exactly the fault this hook exists to prevent.
 *
 * SETTLED IS NOT "NOT LOADING" (see useWhsConnection). Both reads are disabled
 * until their input resolves, so callers must gate on `settled` and render
 * NOTHING while it is false - never a skeleton, never the disconnected state.
 * An ERRORED read counts as settled and falls through to "not connected",
 * mirroring the chip.
 */
export interface HandicapChipState {
  connected: boolean;
  settled: boolean;
  connection: ReturnType<typeof useWhsConnection>['data'];
  trend: ReturnType<typeof useHandicapTrend>['data'];
  anyError: boolean;
}

export function useHandicapChipState(userId: string | undefined): HandicapChipState {
  const { data: connection, isFetched: connFetched, isError: connError } = useWhsConnection(userId);
  const { data: trend, isFetched: trendFetched, isError: trendError } = useHandicapTrend(connection?.id);

  const anyError = connError || trendError;
  const settled = anyError || (!!userId && connFetched && (!connection || trendFetched));
  const connected = !!connection && trend?.current != null;

  return { connected, settled, connection, trend, anyError };
}
