import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { formatPurse } from '../../_shared/formatPurse';
import { fmtScore } from '../../utils/fmtScore';
import { AMBER, FONT, INK, INK_FAINT, INK_MUTE, STATUS_LIVE_ON_DARK, TOUR_HERO_PHOTO_H } from '../../_shared/tokens';
import { heroCanonBackground } from '../../_shared/heroGradient';
import { isStrokeEvent } from '../../_shared/eventFormat';
import { useTournamentDefendingChamp } from '../../hooks/useTournamentDefendingChamp';
import type { TournamentMeta } from '../../leaderboard/useTournamentMeta';
import type { EventState } from '../../components/overview-v3/useTournamentPulse';
import type { TournamentContest } from '../data/tournamentContest';
import { DARK_CHROME_GLASS_MATERIAL } from '@/features/chrome-v2/ChromeIsland';

const FALLBACK_BG = `linear-gradient(180deg, ${A.PANEL} 0%, ${A.CANVAS} 100%)`;
const IMAGE_FOCAL = '50% 72%';

interface Props {
  meta: TournamentMeta;
  state: EventState;
  imageUrl: string | null;
  tourCode: string;
  contest: TournamentContest;
  fieldCount: number | null;
}

function Figure({ value, label, cjk }: { value: string; label: string; cjk: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: INK, fontVariantNumeric: 'tabular-nums lining-nums' }}>{value}</div>
      <div style={{ marginTop: 5, fontSize: 10, fontWeight: 700, letterSpacing: cjk ? 0 : '0.13em', textTransform: cjk ? 'none' : 'uppercase', color: INK_FAINT }}>{label}</div>
    </div>
  );
}

export function HeroSection({ meta, state, imageUrl, tourCode, contest, fieldCount }: Props) {
  const { t, i18n } = useTranslation('tourhub');
  const cjk = /^(ja|ko)/.test(i18n.language);
  const { data: defendingChamp } = useTournamentDefendingChamp(state === 'upcoming' ? meta.id : null);
  const defending = defendingChamp?.name ?? meta.defending_champion ?? null;
  const purse = meta.purse != null ? formatPurse(meta.purse) : null;
  const leaderName = contest.leader?.player?.full_name ?? null;
  const score = contest.leader?.score == null ? null : fmtScore(contest.leader.score);
  const cityCountry = [meta.venue_city, meta.venue_country].filter(Boolean).join(', ');
  const venueLine = [meta.venue_name, cityCountry || null].filter(Boolean).join(' · ');
  const tourRaw = meta.tour_full_name ?? tourCode ?? '';
  const tourLabel = cjk ? tourRaw : tourRaw.toUpperCase();
  const roundScheduled = state === 'live' && meta.current_round_status === 'scheduled';
  const chipLabel = state === 'live'
    ? roundScheduled
      ? t('tournament.hero.chip.roundN', { round: meta.current_round ?? 1 })
      : t('status.live')
    : state === 'completed'
      ? t('status.results')
      : t('status.upcoming');
  const showLiveDot = state === 'live' && !roundScheduled;

  // The verdict is a claim about who is winning. Non-stroke formats (team /
  // cup / match) cannot support one, so no sentence is substituted.
  const stroke = isStrokeEvent(meta.event_type);
  let verdict: string | null = null;
  if (!stroke) {
    verdict = null;
  } else if (state === 'live' && leaderName) {
    if (!contest.sharedLead && contest.margin != null && contest.holesLeft != null && contest.chasersWithinFour >= 2) verdict = t('tournament.hero.verdict.liveContest', { leader: leaderName, margin: contest.margin, count: contest.chasersWithinFour, holes: contest.holesLeft });
    else if (contest.sharedLead && contest.holesLeft != null) verdict = t('tournament.hero.verdict.liveShared', { count: contest.leaders.length, holes: contest.holesLeft });
    else if (!contest.sharedLead && contest.margin != null && contest.margin >= 5) verdict = t('tournament.hero.verdict.liveClear', { leader: leaderName, margin: contest.margin });
    else if (score != null) verdict = t('tournament.hero.verdict.liveScore', { leader: leaderName, score });
  } else if (state === 'completed' && leaderName) {
    if (contest.sharedLead) verdict = t('tournament.hero.verdict.completedPlayoff', { winner: leaderName });
    else if (contest.margin != null && contest.margin >= 1) verdict = t('tournament.hero.verdict.completedMargin', { winner: leaderName, margin: contest.margin });
  } else if (state === 'upcoming' && fieldCount != null && purse) {
    verdict = defending
      ? t('tournament.hero.verdict.upcomingDefender', { field: fieldCount, purse, champion: defending })
      : t('tournament.hero.verdict.upcomingField', { field: fieldCount, purse });
  }

  const figures = [
    fieldCount != null ? { value: formatNumber(fieldCount), label: t('tournament.hero.fieldLabel') } : null,
    purse ? { value: purse, label: t('tournament.hero.purseLabel') } : null,
    meta.venue_par != null ? { value: String(meta.venue_par), label: t('tour.par') } : null,
  ].filter((item): item is { value: string; label: string } => item != null);

  return (
    <div style={{ fontFamily: FONT, color: INK }}>
      <div style={{ position: 'relative', minHeight: TOUR_HERO_PHOTO_H, margin: 0, borderRadius: 0, overflow: 'hidden', paddingTop: 20, background: heroCanonBackground(imageUrl, FALLBACK_BG, IMAGE_FOCAL), display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ padding: '8px 14px 14px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minHeight: 28, padding: '0 10px', borderRadius: 999, ...DARK_CHROME_GLASS_MATERIAL, fontSize: 10, fontWeight: 800, color: INK, letterSpacing: cjk ? 0 : '0.12em', textTransform: cjk ? 'none' : 'uppercase' }}>
            {showLiveDot ? <span style={{ width: 7, height: 7, borderRadius: 999, background: STATUS_LIVE_ON_DARK }} /> : null}
            <span>{chipLabel}</span>
            {showLiveDot ? <span style={{ color: AMBER }}>{t('overview.hero.factRound')} {meta.current_round ?? 1}</span> : null}
          </div>
          {tourLabel ? <div style={{ marginTop: 8, fontSize: 10, fontWeight: 800, color: INK_MUTE, letterSpacing: cjk ? 0 : '0.14em', textTransform: cjk ? 'none' : 'uppercase' }}>{tourLabel}</div> : null}
          <h1 style={{ fontSize: 'clamp(20px, 6.4vw, 25px)', fontWeight: 700, color: INK, lineHeight: 1.04, letterSpacing: '-0.02em', margin: '4px 0 0', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{meta.name}</h1>
          {venueLine && <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>{venueLine}</div>}
          {verdict && <div style={{ maxWidth: 320, marginTop: 10, fontSize: 15, fontWeight: 600, color: INK, lineHeight: 1.42, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}>{verdict}</div>}
        </div>
      </div>
      {figures.length > 0 && <div style={{ background: A.PANEL, padding: '12px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>{figures.map((figure) => <Figure key={figure.label} {...figure} cjk={cjk} />)}</div>}
    </div>
  );
}