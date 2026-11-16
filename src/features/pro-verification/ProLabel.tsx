import { cloneElement, isValidElement, useRef, useState, type ReactNode, type CSSProperties, type ReactElement } from 'react';
import { useProMembers } from './useProMembers';
import { useAmateurMembers } from '@/features/amateur-ranking/useAmateurMembers';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { MemberBadgeCard } from '@/features/member-badge/MemberBadgeCard';
import { textOfNode } from '@/features/member-badge/memberBadgeRules';
import { cachedProMember } from './proMembersCache';
import './pro-label.css';
import '@/features/member-badge/member-badge.css';

/** A badge with a member id is tappable (BRIEF_MEMBER_BADGES_V2): a span with
 * role=button (it often sits inside a tile that is already a button or link),
 * stopping the event so the parent never opens. No id — the account island,
 * settings and admin — keeps the static badge. */
export function ProLabel({ size = 'small', kind = 'pro', userId, name, surface = 'unknown', hideProfileButton }: {
  size?: 'large' | 'small'; kind?: 'pro' | 'am';
  userId?: string | null; name?: string; surface?: string; hideProfileButton?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const word = kind === 'am' ? 'AM' : 'PRO';
  const inner = <span className="pro-label-text">{word}</span>;
  if (!userId) return <span className="pro-label" data-size={size} data-kind={kind}>{inner}</span>;
  const show = (event: { preventDefault(): void; stopPropagation(): void }) => {
    event.preventDefault();
    event.stopPropagation();
    if (open) return;
    const pro = kind === 'pro' ? cachedProMember(userId) : null;
    void analyticsEvents.track('member_badge_opened', { kind: kind === 'am' ? 'amateur' : pro?.pro_kind ?? 'tour_pro', surface });
    setOpen(true);
  };
  return <>
    <span ref={ref} className="pro-label" data-size={size} data-kind={kind} data-tappable="" data-open={open ? '' : undefined}
      role="button" tabIndex={0} aria-label={`${word}, what this means`} aria-haspopup="dialog" aria-expanded={open}
      onClick={show}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') show(event); }}>
      {inner}
    </span>
    {open && <MemberBadgeCard userId={userId} name={name ?? ''} labelKind={kind} anchorRef={ref} onClose={() => setOpen(false)} hideProfileButton={hideProfileButton} />}
  </>;
}

/** The caller supplies its ORIGINAL name element, unchanged: tag, style,
 * className, handlers and test ids remain on the element holding the text.
 * This component adds only a flex row and its verified-only sibling label.
 * Plain text callers may supply style/className for the fallback name span. */
export function ProMemberName({ userId, children, style, className }: { userId?: string | null; children: ReactNode; style?: CSSProperties; className?: string }) {
  const { members } = useProMembers([userId]);
  const { members: amateurs } = useAmateurMembers([userId]);
  const name = isValidElement(children)
    ? style || className ? cloneElement(children as ReactElement<{ style?: CSSProperties; className?: string }>, {
      ...(style ? { style } : {}), ...(className ? { className } : {}),
    }) : children
    : <span style={style} className={className}>{children}</span>;
  const Row = isValidElement(children) && (children.type === 'div' || children.type === 'p') ? 'div' : 'span';
  const text = textOfNode(children);
  return <Row className="pro-member-name">{name}{userId && members.has(userId) ? <ProLabel userId={userId} name={text} surface="name" /> : userId && amateurs.has(userId) ? <ProLabel kind="am" userId={userId} name={text} surface="name" /> : null}</Row>;
}
