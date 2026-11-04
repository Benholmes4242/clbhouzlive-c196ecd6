import { cloneElement, isValidElement, type ReactNode, type CSSProperties, type ReactElement } from 'react';
import { useProMembers } from './useProMembers';
import './pro-label.css';

export function ProLabel({ size = 'small' }: { size?: 'large' | 'small' }) {
  return <span className="pro-label" data-size={size}>PRO</span>;
}

/** The caller supplies its ORIGINAL name element, unchanged: tag, style,
 * className, handlers and test ids remain on the element holding the text.
 * This component adds only a flex row and its verified-only sibling label.
 * Plain text callers may supply style/className for the fallback name span. */
export function ProMemberName({ userId, children, style, className }: { userId?: string | null; children: ReactNode; style?: CSSProperties; className?: string }) {
  const { members } = useProMembers([userId]);
  const name = isValidElement(children)
    ? style || className ? cloneElement(children as ReactElement<{ style?: CSSProperties; className?: string }>, {
      ...(style ? { style } : {}), ...(className ? { className } : {}),
    }) : children
    : <span style={style} className={className}>{children}</span>;
  const Row = isValidElement(children) && (children.type === 'div' || children.type === 'p') ? 'div' : 'span';
  return <Row className="pro-member-name">{name}{userId && members.has(userId) ? <ProLabel /> : null}</Row>;
}