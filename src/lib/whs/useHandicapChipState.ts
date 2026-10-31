import { useHandicapTrend, useWhsConnection } from './hooks';

/**
 * ONE DEFINITION OF "HAS THIS MEMBER CONNECTED A HANDICAP", so the header's
 * "Connect HCP" chip and any surface that invites the member to connect can
 * never disagree.
 *
 * `linked` means the live row returned by useWhsConnection (deleted rows are
 * excluded by its reader). Invitations use !linked; index displays continue
 * to use `connected`: a live row AND a readable current index.
 *
 * SETTLED IS NOT "NOT LOADING" (see useWhsConnection). Both reads are disabled
 * until their input resolves, so callers must gate on `settled` and render
 * NOTHING while it is false - never a skeleton, never the disconnected state.
 * An ERRORED read counts as settled and falls through to "not connected",
 * mirroring the chip.
 */
export interface HandicapChipState {
  linked: boolean;
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
  const linked = !!connection;
  const connected = linked && trend?.current != null;

  return { linked, connected, settled, connection, trend, anyError };
}
