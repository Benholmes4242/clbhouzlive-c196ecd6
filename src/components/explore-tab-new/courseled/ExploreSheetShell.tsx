import type { ReactNode, CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from './tokens';

export interface ExploreSheetShellProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  title: string;
  subtitle: ReactNode;
  valueHeading?: ReactNode;
  columns?: ReactNode;
  footnote?: ReactNode;
  above?: ReactNode;
  bodyPadding?: string;
  children: ReactNode;
}

/** Canonical Explore see-all shell extracted from BoardSheet without changing
 * Top 100/Most improved markup or styles. Custom columns own their complete
 * row/insets; bodyPadding lets existing row renderers keep gutter ownership. */
export function ExploreSheetShell({ open, onClose, titleId, title, subtitle, valueHeading, columns, footnote, above, bodyPadding = '0 16px 32px', children }: ExploreSheetShellProps) {
  const { t } = useTranslation('courses');
  const cap: CSSProperties = { fontFamily: SANS, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' };
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      maxHeight="85dvh"
      ariaLabelledBy={titleId}
      style={{ height: '85dvh', display: 'flex', flexDirection: 'column', paddingBottom: 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 13px', /* Hairline clause: sheet controls from list. */ borderBottom: `1px solid ${A.BORDER}`, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 id={titleId} style={{ margin: 0, fontFamily: SANS, fontSize: 14.5, fontWeight: 700, color: A.INK }}>{title}</h2>
          <div style={{ ...cap, marginTop: 2, color: A.DIM }}>{subtitle}</div>
        </div>
        <button type="button" onClick={onClose} style={{ ...cap, flex: 'none', background: 'none', border: 0, padding: 0, cursor: 'pointer', color: A.INK }}>
          {t('common.done')}
        </button>
      </div>
      {above}
      {columns ?? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 6px', fontFamily: SANS, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.DIM, flexShrink: 0 }}>
        <span>{t('amateur.leaderboards.member')}</span>
        <span>{valueHeading}</span>
      </div>}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: bodyPadding }}>
        {children}
        {footnote ? (
          <div style={{ fontFamily: SANS, fontSize: 11.5, lineHeight: 1.45, color: A.DIM, padding: '14px 0 8px' }}>{footnote}</div>
        ) : null}
      </div>
    </BottomSheet>
  );
}