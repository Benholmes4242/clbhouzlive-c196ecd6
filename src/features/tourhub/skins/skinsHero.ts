/** Brief 47: the PhotoBand skins input, shared by the tournament page and the overview hero. */
import type { BoardEntry } from '../leaderboard/BoardTable';
import { resolvePlayerAvatarCandidates } from '../_shared/resolvePlayerAvatar';
import type { PhotoBandSkins } from '../components/overview-v3/HybridHeroBands/PhotoBand';
import { skinsHeroFigure, skinsLeadLine, skinsProgress, type SkinsResult } from './skinsRules';

export function skinsBand(result: SkinsResult, entryById: Map<string, BoardEntry>, tourLabel: string | null, tourSlug: string | null | undefined, eventFinished = false): PhotoBandSkins {
  /* Brief 47A: finished — FINAL kicker, no right-hand block, no progress (the champion strip replaces them). */
  const done = eventFinished && result.finished;
  const fig = skinsHeroFigure(result);
  const leader = fig.leaderId ? entryById.get(fig.leaderId) : undefined;
  const name = leader?.player?.full_name ?? '';
  return {
    kicker: [tourLabel?.toUpperCase(), 'SKINS GAME', done ? 'FINAL' : null].filter(Boolean).join(' · '),
    count: done ? null : fig.count,
    caps: fig.caps,
    face: !done && leader?.player ? { key: leader.id, name, candidates: resolvePlayerAvatarCandidates({ name, photoUrl: leader.player.photo_url ?? null, tourSlug }) } : null,
    lead: skinsLeadLine(result),
    progress: done ? null : skinsProgress(result),
  };
}
