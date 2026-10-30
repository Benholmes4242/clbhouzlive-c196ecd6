/** ST2 owns only Settings' handicap card. Figures use canonical index resolution
 * and the two connection-scoped member readers; no failed/unrun read can print
 * a confident figure. The parent retains chip mutation and navigation ownership. */
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMemberRoundTotal } from '@/hooks/profile/useMemberRoundTotal';
import { useMemberFirstRoundYear } from '@/hooks/profile/useMemberFirstRoundYear';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import { formatHcp } from '@/lib/formatHcp';
import { bodyNameForProvider } from '@/lib/whs/whsCountries';
import { formatRelativeAgoLong } from '@/i18n/format';
import type { WhsConnection } from '@/lib/whs/types';

interface Props {
  userId?: string;
  connection: WhsConnection | null | undefined;
  connectionReady: boolean;
  profileError: boolean;
  egHandicapIndex?: number | null;
  manualHandicapIndex?: number | null;
  checked: boolean;
  updating: boolean;
  onToggle: (checked: boolean) => void;
  onManage: () => void;
}

export function SettingsHandicapCard(p: Props) {
  const rounds = useMemberRoundTotal(p.connection ? p.userId : undefined);
  const first = useMemberFirstRoundYear(p.connection ? p.userId : undefined);
  const index = resolveDisplayHandicap({ egHandicapIndex: p.egHandicapIndex, manualHandicapIndex: p.manualHandicapIndex, hasWhsConnection: !!p.connection }).value;
  const indexKnown = p.connectionReady && !p.profileError && index != null && Number.isFinite(index);
  const total = p.connectionReady && rounds.state === 'ok' ? rounds.total : null;
  const year = p.connectionReady && first.state === 'ok' && total !== 0 ? first.year : null;
  const connected = !!p.connection;
  const switchTitle = connected ? 'Index in the top bar' : 'Connect prompts';
  const figure = (label: string, value: string | number | null) => (
    <div className="st2-figure" data-figure={label}>
      <b className="tabular-nums" data-unknown={value == null}>{value ?? '–'}</b><span>{label}</span>
    </div>
  );
  return <section className="st2-handicap" data-testid="st2-handicap-card">
    {connected ? <>
      <Button variant="ghost" className="st2-top" onClick={p.onManage}>
        <span className="st2-identity"><span className="st2-name">{bodyNameForProvider(p.connection?.provider)}</span>
          <span className="st2-status">{p.connection?.last_synced_at ? `Connected · synced ${formatRelativeAgoLong(p.connection.last_synced_at)}` : 'Connected'}</span>
        </span>
        <span className="st2-manage">Manage<ChevronRight size={18} aria-hidden="true" /></span>
      </Button>
      <div className="st2-figures">{figure('Index', indexKnown ? formatHcp(index) : null)}{figure('Rounds', total)}{figure('First round', year)}</div>
      <p className="st2-line">Every round arrives on its own, scored hole by hole against the course it was played on.</p>
    </> : <>
      <h3 className="st2-name">Official handicap</h3>
      <p className="st2-line st2-disconnected-line">Connect yours and every round arrives on its own, scored hole by hole and measured against the course it was played on.</p>
      <Button variant="ghost" className="st2-connect" onClick={p.onManage}>Connect your handicap</Button>
    </>}
    <div className={`st2-switch-row${connected ? '' : ' st2-disconnected-switch'}`}>
      <span className="st2-switch-copy">{switchTitle}<small>{connected ? 'The handicap button beside search' : 'On your profile and in the top bar'}</small></span>
      <Button variant="ghost" role="switch" aria-label={switchTitle} aria-checked={p.checked} disabled={p.updating} className="bizc-switch st2-switch" onClick={() => p.onToggle(!p.checked)}><i aria-hidden="true" /></Button>
    </div>
  </section>;
}