import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BusinessInvite, BusinessMember } from '@/hooks/useBusinessTeam';
import { shortBusinessName } from './home/BusinessHomeHeader';
import { inviteName, summaryInvites, teamAvatarMembers, teamInitials, teamSummaryRule } from './teamSummary';

/** The optional shell subtitle fits the full name first, then the shared short-name rule. */
export function TeamSubtitle({ name }: { name: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [short, setShort] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const full = document.createElement('span');
      full.textContent = name;
      full.style.font = getComputedStyle(el).font;
      full.style.position = 'absolute';
      full.style.whiteSpace = 'nowrap';
      el.appendChild(full);
      const tooWide = full.getBoundingClientRect().width > el.clientWidth;
      full.remove();
      setShort(tooWide);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [name]);
  return <span ref={ref} className="team-subtitle-name" title={name}>{short ? shortBusinessName(name) ?? name : name}</span>;
}

export function TeamSummary({ team, invites, businessName, loading, failed, waitingSettled, canManage, requestCount }: {
  team: BusinessMember[]; invites: BusinessInvite[]; businessName: string;
  loading: boolean; failed: boolean; waitingSettled: boolean; canManage: boolean; requestCount: number;
}) {
  const { t } = useTranslation('common');
  if (loading) return <div className="team-summary" data-team-summary-loading aria-busy="true"><div className="team-summary-skeleton-tile" /><div className="team-summary-skeleton-bar" /></div>;
  if (failed) return null;
  const { live, expired } = summaryInvites(invites, team, new Date());
  const rule = waitingSettled ? teamSummaryRule(canManage, requestCount, live, expired) : null;
  return <div className="team-summary" data-team-summary>
    <div className="team-summary-stack" data-team-avatar-stack>
      {teamAvatarMembers(team).map(m => {
        const name = m.user_profile?.display_name || m.user_profile?.username || t('business.team.member');
        return <div key={m.id} className="team-summary-avatar" data-team-member-avatar={m.user_profile_id} title={name}>
          {m.user_profile?.profile_photo_url ? <img src={m.user_profile.profile_photo_url} alt={name} /> : teamInitials(name)}
        </div>;
      })}
      {team.length > 4 && <div className="team-summary-avatar" data-team-overflow>+{team.length - 4}</div>}
      {team.length < 4 && live.length > 0 && waitingSettled && <div className="team-summary-avatar team-summary-avatar--invite" data-team-invite-avatar title={inviteName(live[0])}>{teamInitials(inviteName(live[0]))}</div>}
    </div>
    <div className="team-summary-text">
      <p>{t('business.team.sectionOne.runs', { count: team.length, business: businessName })}</p>
      {rule && <p className="team-summary-waiting" data-team-waiting={rule.kind}>{t(`business.team.sectionOne.${rule.kind}`, { count: rule.count, name: rule.name })}</p>}
    </div>
  </div>;
}