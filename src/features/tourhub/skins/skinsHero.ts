/** Brief 47: the PhotoBand skins input, shared by the tournament page and the overview hero. */
import type { BoardEntry } from '../leaderboard/BoardTable';
import { resolvePlayerAvatarCandidates } from '../_shared/resolvePlayerAvatar';
import type { PhotoBandSkins } from '../components/overview-v3/HybridHeroBands/PhotoBand';
import { skinsHeroFigure, skinsLeadLine, skinsProgress, type SkinsResult } from './skinsRules';

export function skinsBand(result: SkinsResult, entryById: Map<string, BoardEntry>, tourLabel: string | null, tourSlug: string | null | undefined): PhotoBandSkins {
  const fig = skinsHeroFigure(result);
  const leader = fig.leaderId ? entryById.get(fig.leaderId) : undefined;
  const name = leader?.player?.full_name ?? '';
  return {
    kicker: [tourLabel?.toUpperCase(), 'SKINS GAME'].filter(Boolean).join(' · '),
    count: fig.count,
    caps: fig.caps,
    face: leader?.player ? { key: leader.id, name, candidates: resolvePlayerAvatarCandidates({ name, photoUrl: leader.player.photo_url ?? null, tourSlug }) } : null,
    lead: skinsLeadLine(result),
    progress: skinsProgress(result),
  };
}
