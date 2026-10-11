import copy from './teeAlertCopy.json' with { type: 'json' };

interface DueAlert { user_id: string; tournament_id: string; round: number; tee_time: string }
interface DrawGroup {
  tee_time: string;
  players: Array<{ player: { id: string; full_name: string | null } | null }> | null;
}

/** A last-off time is not a leader-group time in a two-tee/wave draw. */
export function confirmedLastGroup(groups: DrawGroup[], leaders: string[], teeTime: string): DrawGroup | null {
  if (!leaders.length || !groups.length) return null;
  const last = Math.max(...groups.map((group) => Date.parse(group.tee_time)));
  if (!Number.isFinite(last) || last !== Date.parse(teeTime)) return null;
  return groups.find((group) => Date.parse(group.tee_time) === last &&
    group.players?.some((member) => member.player && leaders.includes(member.player.id))) ?? null;
}

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? '');
}

/** The queue owns send retries; never leave a confirmed alert eligible twice. */
export async function enqueueAndStamp(enqueue: () => Promise<void>, stamp: () => Promise<void>): Promise<void> {
  try { await enqueue(); }
  finally { await stamp(); }
}

export async function dispatchTeeAlerts(supabase: any): Promise<void> {
  const { data: due, error } = await supabase.rpc('tour_tee_alerts_due');
  if (error) { console.error('[TeeAlert] Due read failed:', error.message); return; }
  const draws = new Map<string, { groups: DrawGroup[]; leaders: string[]; timezone: string }>();
  for (const alert of (due ?? []) as DueAlert[]) {
    try {
      const key = `${alert.tournament_id}:${alert.round}`;
      let draw = draws.get(key);
      if (!draw) {
        const [groupsResult, leadersResult, tournamentResult] = await Promise.all([
          supabase.from('sr_tee_times').select('tee_time, players:sr_tee_time_players(player:sr_players!sr_tee_time_players_player_id_fkey(id, full_name))')
            .eq('tournament_id', alert.tournament_id).eq('round_number', alert.round).order('tee_time', { ascending: false }),
          supabase.from('sr_leaderboards').select('player_id').eq('tournament_id', alert.tournament_id).eq('position', 1),
          supabase.from('sr_tournaments').select('timezone').eq('id', alert.tournament_id).maybeSingle(),
        ]);
        if (groupsResult.error || leadersResult.error || tournamentResult.error) {
          console.error('[TeeAlert] Draw/leader read failed'); continue;
        }
        draw = { groups: groupsResult.data ?? [], leaders: (leadersResult.data ?? []).map((row: { player_id: string | null }) => row.player_id).filter(Boolean),
          timezone: tournamentResult.data?.timezone || 'UTC' };
        draws.set(key, draw);
      }
      const group = confirmedLastGroup(draw.groups, draw.leaders, alert.tee_time);
      if (!group) continue;
      const names = (group.players ?? []).map((member) => member.player?.full_name?.trim()).filter((name): name is string => !!name);
      if (!names.length) continue;
      // Locale currently lives only on the client; production enables English
      // alone. Do not guess locale from device language or create a DB column.
      const locale = 'en';
      const players = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(names);
      const time = new Intl.DateTimeFormat(locale, { timeZone: draw.timezone, hour: 'numeric', minute: '2-digit' }).format(new Date(group.tee_time));
      await enqueueAndStamp(async () => {
        const { error: enqueueError } = await supabase.from('push_notification_queue').insert({
          user_id: alert.user_id,
          title: interpolate(copy[locale].pushTitle, { players, time }),
          body: interpolate(copy[locale].pushBody, { players, time }),
          data: { type: 'tee_off', route: `/tourhub/tournament/${alert.tournament_id}` },
        });
        if (enqueueError) throw enqueueError;
      }, async () => {
        const { error: stampError } = await supabase.from('tour_tee_alerts').update({ fired_at: new Date().toISOString() })
          .eq('user_id', alert.user_id).eq('tournament_id', alert.tournament_id).eq('round', alert.round).is('fired_at', null);
        if (stampError) throw stampError;
      });
    } catch (error) { console.error('[TeeAlert] Dispatch failed:', error instanceof Error ? error.message : String(error)); }
  }
}