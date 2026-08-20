/**
 * Resolve which handicap to DISPLAY.
 *
 * A CONNECTED account's handicap comes from the federation, full stop. When a
 * WHS connection is active we return eg_handicap_index and NEVER fall back to
 * manual_handicap_index — a stale manual figure surfacing for a connected
 * member is the exact failure mode this rule eliminates. A null eg value on a
 * connected account means "not synced yet", not "use the manual number".
 *
 * Manual entry survives only for members with no connection.
 */
export interface ResolveHandicapInput {
  egHandicapIndex: number | null | undefined;
  manualHandicapIndex: number | null | undefined;
  hasWhsConnection: boolean;
}

export interface ResolvedHandicap {
  value: number | null;
  source: 'whs' | 'manual' | 'none';
}

export function resolveDisplayHandicap(args: ResolveHandicapInput): ResolvedHandicap {
  if (args.hasWhsConnection) {
    return args.egHandicapIndex != null
      ? { value: args.egHandicapIndex, source: 'whs' }
      : { value: null, source: 'whs' };
  }
  if (args.manualHandicapIndex != null) {
    return { value: args.manualHandicapIndex, source: 'manual' };
  }
  return { value: null, source: 'none' };
}

