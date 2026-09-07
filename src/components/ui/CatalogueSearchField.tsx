/**
 * CatalogueSearchField — the ONE in-content search field.
 *
 * Extracted from the Discover Scores tab's "Search any course for analytics"
 * field (HowTheyPlayedSection) when the college Yearbook became the second
 * surface to need it. Height 44, radius r.sm, A.PANEL ground, 1px A.BORDER,
 * placeholder/value 14/600. It scrolls with the content; it never sticks, and
 * it NEVER rides in the fixed header control row — that row carries a fixed
 * set of chrome controls only.
 */

import { Search, X } from 'lucide-react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { r } from '@/lib/radius';

export const CATALOGUE_FIELD_H = 44;

export interface CatalogueSearchFieldProps {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  ariaLabel?: string;
  /** Shown when set and the field has content; falls back to clearing the value. */
  onClear?: () => void;
  clearAriaLabel?: string;
  showClear?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function CatalogueSearchField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  onClear,
  clearAriaLabel,
  showClear,
  inputRef,
  onFocus,
  onBlur,
}: CatalogueSearchFieldProps) {
  const clearVisible = showClear ?? value.length > 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: CATALOGUE_FIELD_H,
        padding: '0 12px',
        boxSizing: 'border-box',
        background: A.PANEL,
        border: `1px solid ${A.BORDER}`,
        borderRadius: r.sm,
      }}
    >
      <Search size={15} color={A.MUTE} strokeWidth={2.2} aria-hidden />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: A.INK,
          fontSize: 14,
          fontWeight: 600,
        }}
      />
      {clearVisible && (
        <button
          type="button"
          onClick={() => (onClear ? onClear() : onChange(''))}
          aria-label={clearAriaLabel ?? 'Clear'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            padding: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          <X size={15} color={A.MUTE} strokeWidth={2.2} aria-hidden />
        </button>
      )}
    </div>
  );
}

export default CatalogueSearchField;
