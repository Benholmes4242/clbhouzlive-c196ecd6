/** The tap-a-badge card: GlanceShell's anchored placement and material; content
 * from the member's verification (memberBadgeRules). Mounted only while open. */
import type React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GlanceShell } from '@/features/chrome-v2/GlanceShell';
import { useProMembers } from '@/features/pro-verification/useProMembers';
import { ProLabel } from '@/features/pro-verification/ProLabel';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { badgeCardCopy, badgeProfileButton, type BadgeKind } from './memberBadgeRules';
import { useMemberBadgeFacts } from './useMemberBadgeFacts';
import './member-badge.css';

export function MemberBadgeCard({ userId, name, labelKind, anchorRef, onClose, hideProfileButton }: {
  userId: string; name: string; labelKind: 'pro' | 'am';
  anchorRef: React.RefObject<HTMLElement | null>; onClose: () => void; hideProfileButton?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { members } = useProMembers(labelKind === 'pro' ? [userId] : []);
  const pro = members.get(userId) ?? null;
  const kind: BadgeKind | null = labelKind === 'am' ? 'amateur' : pro ? pro.pro_kind : null;
  const facts = useMemberBadgeFacts(userId, kind);
  const copy = kind ? badgeCardCopy(kind, name, { club: pro?.pro_club, tour: pro?.pro_tour }) : null;
  const onOwnPage = hideProfileButton || location.pathname === `/profile/${userId}`;
  const shown = facts.isSuccess ? facts.data : [];
  return <GlanceShell onClose={onClose} anchorRef={anchorRef} label={copy?.title ?? (labelKind === 'am' ? 'AM' : 'PRO')} placement="anchored">
    <div className="member-badge-card" data-member-badge-card={kind ?? 'pending'}>
      <div className="mbc-kicker"><ProLabel size="large" kind={labelKind} /><span>Verified by clbhouz</span></div>
      {copy ? <>
        <div className="mbc-title">{copy.title}</div>
        <div className="mbc-who">{copy.who}</div>
        {shown.length > 0 && <div className="mbc-facts" data-mbc-facts>{shown.map(f => <div key={f.label} className="mbc-fact"><b style={f.color ? { color: f.color } : undefined}>{f.value}</b><span>{f.label}</span></div>)}</div>}
        <p className="mbc-body">{copy.body}</p>
      </> : null}
      {!onOwnPage && <button type="button" className="mbc-cta" data-mbc-profile onClick={() => {
        void analyticsEvents.track('member_badge_profile_opened', { kind, user_id: userId });
        onClose();
        navigate(`/profile/${userId}`);
      }}>{badgeProfileButton(name)} <i>›</i></button>}
    </div>
  </GlanceShell>;
}
