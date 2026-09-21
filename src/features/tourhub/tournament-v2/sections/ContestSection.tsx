import { useTranslation } from 'react-i18next';
import type { EventState } from '../../components/overview-v3/useTournamentPulse';
import type { TournamentContest } from '../data/tournamentContest';
import { SectionEyebrow } from './SectionEyebrow';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { FONT, INK, INK_FAINT, INK_SOFT, SURFACE, WHITE_ALPHA_10 } from '../../_shared/tokens';
import { formatToPar } from '../../overview/data/liveRoundStats';

interface Props { contest: TournamentContest; state: EventState }

export function ContestSection({ contest, state }: Props) {
  const { t, i18n } = useTranslation('tourhub');
  if (state === 'upcoming' || !contest.leader || !contest.leadForm) return null;
  const cjk = /^(ja|ko)/.test(i18n.language);
  // Standings are never stated as ordinal words here: the board owns rank labels,
  // prose states names and gaps only.
  const chasers = contest.pack.filter((row) => row.gap > 0);
  const nextName = chasers[0]?.entry.player?.full_name ?? null;
  const thirdName = chasers[1]?.entry.player?.full_name ?? null;
  const gapPhrase = (shots: number) => t('tournament.contest.gapShots', { count: shots });
  const leaderNames = contest.leaders.map((row) => row.player?.full_name ?? '').filter(Boolean);
  const levelScore = contest.leader?.score == null ? null : formatToPar(contest.leader.score);

  let subline: string | null = null;
  if (contest.sharedLead || contest.leadForm === 'word') {
    const past = state === 'completed';
    const chaserGap = chasers[0] ? gapPhrase(chasers[0].gap) : null;
    const withChaser = !past && nextName && chaserGap;
    const vars: Record<string, string | number> = {
      a: leaderNames[0] ?? '',
      b: leaderNames[1] ?? '',
      c: leaderNames[2] ?? '',
      count: Math.max(0, leaderNames.length - 2),
      score: levelScore ?? '',
      next: nextName ?? '',
      gap: chaserGap ?? '',
    };
    const form = leaderNames.length >= 4 ? 'Many' : leaderNames.length === 3 ? 'Three' : 'Two';
    if (leaderNames.length >= 2 && levelScore) {
      subline = past && contest.playoffDecided
        ? t(`tournament.contest.sublinePlayoff${form}`, vars)
        : t(`tournament.contest.sublineLevel${form}${past ? 'Past' : withChaser ? 'Chaser' : ''}`, vars);
    }
  } else if (nextName && contest.leader) {
    const leaderName = contest.leader.player?.full_name ?? '';
    subline = thirdName && chasers[1]
      ? t('tournament.contest.sublineSingleThird', {
          leader: leaderName,
          next: nextName,
          third: thirdName,
          gap: gapPhrase(Math.max(1, chasers[1].gap - chasers[0].gap)),
        })
      : t('tournament.contest.sublineSingle', { leader: leaderName, next: nextName });
  }
  const maxGap = contest.pack.length ? Math.max(...contest.pack.map((row) => row.gap)) : 0;
  const showTrack = contest.pack.length >= 5;
  const past = state === 'completed';
  const word = past
    ? contest.playoffDecided
      ? t('tournament.contest.playoff')
      : t('tournament.contest.finishedLevel')
    : t('tournament.contest.sharedLead', { count: contest.leaders.length });
  const qualifier = past
    ? null
    : contest.holesLeft != null
      ? t('tournament.contest.withToPlay', { holes: contest.holesLeft })
      : null;

  return (
    <section style={{ fontFamily: FONT }}>
      <SectionEyebrow kicker={t(state === 'live' ? 'tournament.contest.liveEyebrow' : 'tournament.contest.completedEyebrow')} />
      <div style={{ background: SURFACE, padding: '4px 16px 16px' }}>
        {contest.leadForm === 'figure' ? (
          <>
            <div style={{ fontSize: 66, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 0.84, color: INK, fontVariantNumeric: 'tabular-nums lining-nums' }}>{contest.margin}</div>
            <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, letterSpacing: cjk ? 0 : '0.14em', textTransform: cjk ? 'none' : 'uppercase', color: INK_FAINT }}>
              {state === 'completed' ? t('tournament.contest.shotsClear') : t(contest.margin === 1 ? 'tournament.contest.shotLead' : 'tournament.contest.shotsLead')}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.02, color: INK }}>{word}</div>
            {qualifier && <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, letterSpacing: cjk ? 0 : '0.14em', textTransform: cjk ? 'none' : 'uppercase', color: INK_FAINT }}>{qualifier}</div>}
          </>
        )}
        {subline && <div style={{ marginTop: 10, fontSize: 13.5, fontWeight: 400, color: INK_SOFT, lineHeight: 1.42 }}>{subline}</div>}
        {showTrack && (
          <div style={{ marginTop: 22 }} aria-label={t('tournament.contest.packAria')}>
            <div style={{ position: 'relative', margin: '0 6px', height: 12 }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 4.5, height: 3, borderRadius: 3, background: WHITE_ALPHA_10 }} />
              {contest.pack.map(({ entry, gap }) => (
                <span key={entry.id} style={{ position: 'absolute', left: maxGap === 0 ? 0 : `${(gap / maxGap) * 100}%`, top: 0, width: 12, height: 12, borderRadius: '50%', transform: 'translateX(-6px)', border: `2px solid ${SURFACE}`, background: gap === 0 ? A.AMBER : gap <= 3 ? A.GREEN : INK_FAINT }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9.5, fontWeight: 700, letterSpacing: cjk ? 0 : '0.1em', textTransform: cjk ? 'none' : 'uppercase', color: INK_FAINT }}>
              {maxGap === 0 ? <span>{t('tournament.contest.allLevel')}</span> : <><span>{t('tournament.contest.leader')}</span><span>{t('tournament.contest.back', { gap: maxGap })}</span></>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
