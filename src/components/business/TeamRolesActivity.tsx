import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import type { BusinessRole } from '@/hooks/useBusinessTeam';
import { useBusinessTeamFeed } from '@/hooks/useBusinessTeamFeed';
import { teamInitials } from './teamSummary';
import { feedLines, feedTime, MAX_FEED_LINES, ROLE_TABLE, TABLE_ROLES, type FeedLine, type TimeLabel } from './teamFeed';

/** CB78 section four: the role table (everyone) and Recent team activity
 * (owners/admins). Rules and permission evidence live in teamFeed.ts. */

const P = 'business.team.sectionFour';

export function TeamRoleTable({ businessName, viewerRole }: { businessName: string; viewerRole: BusinessRole | undefined }) {
  const { t } = useTranslation('common');
  if (!viewerRole) return null;
  const showNote = viewerRole === 'editor' || viewerRole === 'analyst';
  return <>
    <section className="team-list team-s4" data-team-role-table>
      <div className="team-request-kicker">{t(`${P}.rolesKicker`)}</div>
      <table className="team-s4-table">
        <thead><tr>
          <th />
          {TABLE_ROLES.map(r => <th key={r} data-role-col={r} className={r === viewerRole ? 'team-s4-you' : undefined}>{t(`business.team.sectionTwo.roles.${r}`)}</th>)}
        </tr></thead>
        <tbody>
          {ROLE_TABLE.map(row => <tr key={row.ability} data-ability={row.ability}>
            <td>{t(`${P}.abilities.${row.ability}`, { business: businessName })}</td>
            {row.marks.map((on, i) => <td key={TABLE_ROLES[i]} className={on ? 'team-s4-yes' : 'team-s4-no'} data-mark={on ? 'yes' : 'no'}>{on ? '✓' : '–'}</td>)}
          </tr>)}
        </tbody>
      </table>
    </section>
    {showNote && <p className="team-s4-note" data-team-role-note>{t(`${P}.note`)}</p>}
  </>;
}

export function TeamActivityCard({ businessId, businessName, canManage, viewerId }: { businessId: string; businessName: string; canManage: boolean; viewerId: string | null | undefined }) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const feed = useBusinessTeamFeed(businessId, canManage);
  if (!canManage || !feed.isSuccess) return null;
  const all = feedLines(feed.data, viewerId);
  if (!all.length) return null;
  const lines = all.slice(0, MAX_FEED_LINES);
  const now = new Date();
  const timeText = (l: TimeLabel) => l.key === 'hours' ? t(`${P}.time.hours`, { count: l.count }) : 'text' in l ? l.text : t(`${P}.time.${l.key}`);
  const sentence = (l: FeedLine) => {
    const role = l.role ? t(`business.team.sectionTwo.roles.${l.role}`) : '';
    const folded = l.count > 1 ? '_folded' : '';
    return t(`${P}.kinds.${l.kind}${folded}`, { business: businessName, person: l.person ?? '', role, count: l.count });
  };
  return <section className="team-list team-s4" data-team-activity-card>
    <div className="team-request-kicker">{t(`${P}.activityKicker`)}</div>
    {lines.map((l, i) => {
      const name = l.isViewer ? t(`${P}.you`) : l.actorName;
      return <div key={`${l.kind}-${l.at}-${i}`} className={`team-s4-act${i === 0 ? ' team-s4-act--first' : ''}`} data-feed-line={l.kind}>
        <div className="team-s4-tile">{l.avatarUrl ? <img src={l.avatarUrl} alt="" /> : teamInitials(l.actorName || '')}</div>
        <div className="team-s4-tx"><b data-feed-actor>{name}</b> {sentence(l)}</div>
        <div className="team-s4-time" data-feed-time>{timeText(feedTime(l.at, now))}</div>
      </div>;
    })}
    {all.length > MAX_FEED_LINES && <button type="button" className="team-s4-foot" data-feed-see-all onClick={() => navigate(`/business/${businessId}/activity`)}>
      {t(`${P}.seeAll`)}<ChevronRight size={14} />
    </button>}
  </section>;
}
