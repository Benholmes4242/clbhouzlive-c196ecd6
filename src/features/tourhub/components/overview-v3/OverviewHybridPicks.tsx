/** Overview-only pick rail; the parent owns its existing PicksSheet/record
 * callbacks. Tournament PicksBlock remains unchanged. */
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '../PlayerAvatar';
import type { AITopContender } from '../../hooks/useAIPredictions';
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { todayFromEntry } from '../../leaderboard/BoardTable';
import { fmtScore } from '../../utils/fmtScore';
import { finishedVerdict, type PickResult } from './HybridHeroBands/pickInsightRules';
import { earliestPickTee } from './HybridHeroBands/LivePicksBlock';
import { pickStatusToken } from './HybridHeroBands/PicksBlock';
import { upcomingPicksTitle, finishedPicksTitle, livePicksTitle, type PicksIntro } from './heroHeadRules';
import { venueTee } from './upcomingOverviewRules';
import { ordinal } from './liveStateRules';
import { HybridHead } from './OverviewHybridSections';
import { useOverviewBandReady } from './overviewShells';

export function hybridPickStatus(entry: BoardEntry | undefined, round: number | null, tee: string | null, zone: string | null, par: number | null): string | null {
  const token = pickStatusToken(entry?.status); if (token) return token;
  const today = entry && round != null ? todayFromEntry(entry, round) : null;
  if (today != null && (entry?.thru ?? 0) >= 18) return par != null ? `${par + today} today · F` : 'F';
  if (today != null && (entry?.thru ?? 0) > 0) return `Thru ${entry?.thru}`;
  const when = venueTee(tee, zone); return when ? `${when.day} ${when.time}` : null;
}
export function OverviewHybridPicks({ picks, tour, phase, entries, tees, round, par, zone, intro, results, championIds, onOpen, onRecord }: { picks: AITopContender[]; tour: string; phase: 'live' | 'upcoming' | 'completed'; entries: BoardEntry[]; tees: Map<string, string> | null; round: number | null; par: number | null; zone: string | null; intro: PicksIntro | null; results: PickResult[]; championIds: string[]; onOpen: (id: string) => void; onRecord: () => void }) {
  const { t } = useTranslation('tourhub'); useOverviewBandReady('picks', true);
  const cards = picks.slice(0, 3); if (!cards.length) return null;
  const title = phase === 'completed' ? finishedPicksTitle(finishedVerdict(results, championIds).bold) : intro ? livePicksTitle(t as never, intro) : upcomingPicksTitle(t as never, cards.length, earliestPickTee(cards, tees, zone));
  return <section data-overview-picks data-picks-layout="hybrid-rail"><HybridHead eyebrow="Our picks" title={title} action={phase === 'completed' ? 'Our record ›' : 'How we pick'} onAction={onRecord} /><div className="ov48-rail">{cards.map((p, i) => {
    const entry = entries.find(e => e.player?.id === p.playerId || e.team?.members?.some(m => m.player?.id === p.playerId));
    const status = phase === 'completed' ? `Pick ${i + 1}` : phase === 'upcoming' ? (() => { const v = venueTee(tees?.get(p.playerId) ?? null, zone); return v ? `${v.day} ${v.time}` : null; })() : hybridPickStatus(entry, round, tees?.get(p.playerId) ?? null, zone, par);
    const won = championIds.includes(p.playerId);
    return <Button key={p.playerId} variant={null} size={null} className="ov48-pick" data-overview-pick-card onClick={() => onOpen(p.playerId)} aria-label={p.playerName}><div className="ov48-pick-top"><PlayerAvatar playerId={p.playerId} playerName={p.playerName} tourCode={tour} photoUrl={p.photoUrl} headshotOverride={p.headshotOverride} size={40} /><span className="ov48-pick-status">{status}</span></div><b className="ov48-pick-name">{p.playerName}</b><span className="ov48-pick-score">{phase === 'upcoming' ? <><b>{ordinal(i + 1)}</b> pick</> : <>{entry?.score != null ? <b className={entry.score < 0 ? 'ov48-under' : undefined}>{fmtScore(entry.score)}</b> : null}{won ? <Trophy size={11} className="ov48-gold" /> : null}{entry?.position != null ? `${entry.position_tied ? 'T' : ''}${ordinal(entry.position)}` : pickStatusToken(entry?.status)}</>}</span></Button>;
  })}</div></section>;
}