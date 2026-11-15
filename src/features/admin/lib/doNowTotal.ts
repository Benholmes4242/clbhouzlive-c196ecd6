import type { CommandCentreV2 } from '../hooks/useCommandCentreV2';

/** Dashboard and open full-admin drawer share the seven server-owned task counts. */
export function doNowTotal(d: CommandCentreV2['do_now']): number {
  return d.stuck_rounds.rounds + d.gone_quiet.members + d.clubs_to_pitch.clubs
    + d.first_rounds.members + d.unreacted.posts + d.played_not_connected + d.inbox;
}
