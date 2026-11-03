/** Shared page title forwards the actual h1 for name observation; callers own
 * island clearance and trailing commands. No header/suppression/read ownership. */
import { forwardRef, type ReactNode } from 'react';
import './page-title.css';

export interface PageTitleProps {
  title: string;
  subtitle?: string;
  trailingAction?: ReactNode;
}

export const PageTitle = forwardRef<HTMLHeadingElement, PageTitleProps>(function PageTitle({ title, subtitle, trailingAction }, ref) {
  return <div className="chrome-page-title">
    <div className="chrome-page-title-line">
      <h1 ref={ref}>{title}</h1>
      {trailingAction && <div className="chrome-page-title-action">{trailingAction}</div>}
    </div>
    {subtitle && <p className="chrome-page-title-subtitle">{subtitle}</p>}
  </div>;
});