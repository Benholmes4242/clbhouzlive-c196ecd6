/**
 * BRIEF 1 §8 — the pro request card body in Admin › Inbox › Verifications.
 * Fact rows (kind, tour/PGA, profile link or the "how we can check" answer,
 * club, membership number, requested), the tour-player suggestion for tours
 * we cover (full-name match with the tour in tour_codes, case-insensitive,
 * starts counted from get_player_season_results), the per-kind checklist
 * line, and "Change tour player" on approved rows (set_pro_player_link).
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminTheme as t } from '../theme';
import { formatAgo } from '../lib/formatAgo';
import { useVerifications, type VerificationRow } from '../hooks/useVerifications';
import { isProKind, proChecklistLine, proKindLabel } from '@/features/pro-verification/proRules';

interface PlayerPick { id: string; name: string }

function Fact({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  if (!children && !value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: `1px solid ${t.line}`, fontSize: 13 }}>
      <span style={{ color: t.inkMuted, flex: 'none' }}>{label}</span>
      <span style={{ fontWeight: 600, color: t.ink, textAlign: 'right', minWidth: 0, overflowWrap: 'anywhere' }}>{children ?? value}</span>
    </div>
  );
}

/** Name search over sr_players, shared by the suggestion's "Change" and the
 *  approved row's "Change tour player". "No match" is always offered. */
function PlayerSearch({ onPick, onNoMatch, busy }: { onPick: (p: PlayerPick) => void; onNoMatch: () => void; busy?: boolean }) {
  const [q, setQ] = useState('');
  const results = useQuery({
    queryKey: ['pro-player-search', q],
    enabled: q.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_players')
        .select('id, full_name, tour_codes')
        .ilike('full_name', `%${q.trim().replace(/[%_\\]/g, '')}%`)
        .limit(10);
      if (error) throw error;
      return (data ?? []) as { id: string; full_name: string | null; tour_codes: string[] | null }[];
    },
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
      <input
        aria-label="Search tour players"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search by name"
        style={{ height: 38, borderRadius: t.radius.md, border: `1px solid ${t.line}`, background: t.canvas, color: t.ink, padding: '0 10px', fontSize: 13, outline: 'none' }}
      />
      {(results.data ?? []).map(p => (
        <button key={p.id} type="button" disabled={busy} onClick={() => onPick({ id: p.id, name: p.full_name ?? '' })}
          style={{ textAlign: 'left', padding: '8px 10px', borderRadius: t.radius.md, border: `1px solid ${t.line}`, background: t.surface, color: t.ink, fontSize: 13, cursor: 'pointer' }}>
          {p.full_name}{(p.tour_codes ?? []).length ? ` · ${(p.tour_codes ?? []).join(', ')}` : ''}
        </button>
      ))}
      <button type="button" disabled={busy} onClick={onNoMatch}
        style={{ textAlign: 'left', padding: '8px 10px', borderRadius: t.radius.md, border: `1px dashed ${t.line}`, background: 'transparent', color: t.inkMuted, fontSize: 13, cursor: 'pointer' }}>
        No match
      </button>
    </div>
  );
}

export function ProRequestFacts({ row, onPlayerChange }: {
  row: VerificationRow;
  /** Reports the effective player id: the suggestion until the reviewer
   *  changes it, null after "No match". */
  onPlayerChange?: (playerId: string | null) => void;
}) {
  const kind = isProKind(row.kind) ? row.kind : null;
  const isTour = kind === 'tour_pro';
  const withCode = isTour && !!row.proTourCode;
  const pending = row.status === 'pending';
  const { setProPlayerLinkMutation } = useVerifications();

  /* undefined = follow the suggestion; 'none' = No match; pick = chosen. */
  const [override, setOverride] = useState<PlayerPick | 'none' | undefined>(undefined);
  const [searching, setSearching] = useState(false);

  const suggestion = useQuery({
    queryKey: ['pro-player-suggestion', row.id],
    enabled: withCode && !!row.displayName,
    queryFn: async () => {
      const code = row.proTourCode!.toLowerCase();
      const { data, error } = await supabase
        .from('sr_players')
        .select('id, full_name, tour_codes')
        .ilike('full_name', row.displayName!);
      if (error) throw error;
      const match = (data ?? []).find(p => (p.tour_codes ?? []).some(c => c.toLowerCase() === code));
      if (!match) return null;
      const year = new Date().getUTCFullYear();
      const { data: results } = await supabase.rpc('get_player_season_results', { p_player_id: match.id, p_year: year });
      return { id: match.id as string, name: (match.full_name ?? row.displayName!) as string, starts: (results ?? []).length, year };
    },
  });

  const effective: PlayerPick | null =
    override === undefined ? (suggestion.data ? { id: suggestion.data.id, name: suggestion.data.name } : null)
    : override === 'none' ? null
    : override;

  useEffect(() => { onPlayerChange?.(effective?.id ?? null); }, [effective?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const linkPlayer = (pick: PlayerPick) => {
    if (!row.requestedBy) return;
    setProPlayerLinkMutation.mutate({ userId: row.requestedBy, playerId: pick.id }, { onSuccess: () => setSearching(false) });
  };

  return (
    <div data-pro-request-facts style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderTop: `1px solid ${t.line}` }}>
        <Fact label="Kind" value={proKindLabel(kind)} />
        {isTour ? <Fact label="Tour" value={row.proTour} /> : <Fact label="PGA" value={row.proBody} />}
        {isTour && (row.proNoProfile
          ? <Fact label="How we can check" value={row.proHowToCheck} />
          : row.proLink && (
            <Fact label="Tour profile">
              <a href={row.proLink} target="_blank" rel="noreferrer" style={{ color: t.brandText }}>{row.proLink}</a>
            </Fact>
          ))}
        {!isTour && <Fact label="Where they coach" value={row.proClub} />}
        {!isTour && <Fact label="Membership number" value={row.proMembershipNumber} />}
        <Fact label="Requested" value={formatAgo(row.createdAt, { suffix: true, empty: '-' })} />
        {withCode && (
          <Fact label="Tour player">
            {override === 'none' ? 'No match'
              : effective
                ? `${effective.name} · ${row.proTour}${suggestion.data && override === undefined ? `, ${suggestion.data.starts} starts in ${suggestion.data.year}` : ''}`
                : suggestion.isLoading ? 'Looking…' : 'No suggestion'}
            {pending && (
              <button type="button" onClick={() => setSearching(s => !s)}
                style={{ marginLeft: 8, background: 'none', border: 0, padding: 0, color: t.brandText, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Change
              </button>
            )}
          </Fact>
        )}
      </div>

      {pending && searching && withCode && (
        <PlayerSearch
          onPick={p => { setOverride(p); setSearching(false); }}
          onNoMatch={() => { setOverride('none'); setSearching(false); }}
        />
      )}

      <div style={{ marginTop: 12, fontSize: 12.5, lineHeight: 1.5, color: t.inkMuted }}>
        <b style={{ color: t.ink }}>{proChecklistLine(kind).split(':')[0]}:</b>{proChecklistLine(kind).slice(proChecklistLine(kind).indexOf(':') + 1)}
      </div>

      {/* §8 — a verified pro's row offers "Change tour player". */}
      {!pending && isTour && row.requestedBy && (
        <div style={{ marginTop: 12 }}>
          <button type="button" onClick={() => setSearching(s => !s)}
            style={{ padding: '8px 12px', borderRadius: t.radius.md, border: `1px solid ${t.line}`, background: t.surface, color: t.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Change tour player
          </button>
          {searching && (
            <PlayerSearch
              busy={setProPlayerLinkMutation.isPending}
              onPick={linkPlayer}
              onNoMatch={() => setSearching(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
