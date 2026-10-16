/**
 * BRIEF_ROUNDS_TAB_REBUILD_PHASES_3_5 §4 — Where you play. courseStats only
 * (full-18 count and average, one population). HOME follows ClubsCard's
 * template: useProfileClubs (primary_club_id, home_club_visibility gate) then
 * useClubsCourses (golf_courses.club_id).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { profileOwnerPossessive } from '@/lib/profileOwnerVoice';
import { useProfileClubs } from '@/components/profile/hooks/useProfileClubs';
import { useClubsCourses } from '@/components/profile/clubs/useClubsCourses';
import { formatNumber } from '@/i18n/format';
import type { ProfileRound } from '../useProfileRounds';
import { courseStats } from '../roundsDerivations';
import { KICKER, RT, TAB, TITLE, fmt1, note } from './roundsTokens';

interface Props {
  rounds: ProfileRound[];
  userId: string;
  viewerId: string | undefined;
  isOwnProfile: boolean;
  ownerFirstName?: string | null;
}

/** Splits names that share a club prefix with another row: club truncates, course stays visible. */
export function splitClubCourse(names: (string | null)[]): ({ club: string; course: string } | null)[] {
  const words = names.map((n) => (n ?? '').split(/\s+/).filter(Boolean));
  return words.map((w, i) => {
    let best = 0;
    words.forEach((o, j) => {
      if (j === i) return;
      let k = 0;
      while (k < w.length && k < o.length && w[k] === o[k]) k++;
      best = Math.max(best, k);
    });
    if (best < 2 || best >= w.length) return null;
    const club = w.slice(0, best).join(' ').replace(/\s*[-–—,]$/, '');
    const rest = w.slice(best).join(' ').replace(/^[-–—,(]\s*|\)$/g, '').replace(/\s+Course$/i, '').trim();
    return rest ? { club, course: `(${rest})` } : null;
  });
}

const CoursesPlayedSection: React.FC<Props> = ({ rounds, userId, viewerId, isOwnProfile, ownerFirstName = null }) => {
  const { t } = useTranslation('common');
  const voice = isOwnProfile ? 'Own' : ownerFirstName ? 'Friend' : 'Other';
  const all = courseStats(rounds);
  const top = all.slice(0, 5);
  // homeClub is already null when home_club_visibility hides it from this viewer.
  const { homeClub } = useProfileClubs(top.length ? userId : undefined, viewerId);
  const { data: byClub = {} } = useClubsCourses(homeClub?.id ? [homeClub.id] : []);
  const homeIds = new Set((homeClub?.id ? byClub[homeClub.id] ?? [] : []).map((c) => c.id));

  if (!top.length) return null;
  const maxN = top[0].rounds;
  const split = splitClubCourse(top.map((c) => c.name));
  const full18 = all.reduce((a, c) => a + c.rounds, 0);
  const lead = top[0];
  const pct = full18 > 0 ? Math.round((lead.rounds / full18) * 100) : null;

  return (
    <section>
      <div style={KICKER}>{t(`profile.rounds.courses.kicker${voice}`, { name: ownerFirstName })}</div>
      <div style={TITLE}>{t(isOwnProfile ? 'profile.rounds.courses.titleOwn' : 'profile.rounds.courses.titleFriend', { possessive: profileOwnerPossessive(ownerFirstName) })}</div>
      <div style={{ marginTop: 5 }}>
        {top.map((c, i) => (
          <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
            <span style={{ width: 130, flex: 'none', fontSize: 11, fontWeight: 600, color: RT.BODY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {split[i] ? (
                <span style={{ display: 'inline-flex', maxWidth: '100%', verticalAlign: 'bottom' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{split[i]!.club}</span>
                  <span style={{ flex: 'none', marginLeft: 3 }}>{split[i]!.course}</span>
                </span>
              ) : (c.name ?? '')}
              {c.courseId && homeIds.has(c.courseId) ? (
                <span style={{ marginLeft: 4, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: RT.AMBER }}>HOME</span>
              ) : null}
            </span>
            <span style={{ flex: 1, height: 5, borderRadius: 999, background: RT.TRACK, overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${(c.rounds / maxN) * 100}%`, borderRadius: 999, background: RT.AMBER, opacity: 0.75 }} />
            </span>
            <span style={{ width: 20, textAlign: 'right', fontSize: 10.5, fontWeight: 700, color: RT.BODY, ...TAB }}>{formatNumber(c.rounds)}</span>
            <span style={{ width: 34, textAlign: 'right', fontSize: 10.5, fontWeight: 700, color: RT.MUTE, ...TAB }}>{c.avg != null ? fmt1(c.avg) : ''}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 9, textAlign: 'right', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: RT.FAINT, whiteSpace: 'pre' }}>
        {'Rounds   Average'}
      </div>
      {lead.name ? (
        <p style={{ ...note(RT.HAIRLINE), margin: '12px 0 0' }}>
          {t(`profile.rounds.courses.played${voice}${pct == null ? 'NoShare' : ''}`, { name: ownerFirstName, course: lead.name, n: formatNumber(lead.rounds), times: lead.rounds === 1 ? 'time' : 'times', pct })}
        </p>
      ) : null}
    </section>
  );
};

export default CoursesPlayedSection;
