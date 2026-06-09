/**
 * Resolve which handicap to DISPLAY.
 *
 * WHS (eg_handicap_index, owned exclusively by the connect-whs / sync edge
 * functions) wins whenever a WHS connection is active. Otherwise we fall back
 * to the user's manually-entered handicap (manual_handicap_index, written from
 * the edit-profile form). If neither exists we return null.
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
  if (args.hasWhsConnection && args.egHandicapIndex != null) {
    return { value: args.egHandicapIndex, source: 'whs' };
  }
  if (args.manualHandicapIndex != null) {
    return { value: args.manualHandicapIndex, source: 'manual' };
  }
  return { value: null, source: 'none' };
}
