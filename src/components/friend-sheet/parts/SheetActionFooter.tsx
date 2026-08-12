import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { BG_0, BG_2, T100, LINE_2, FONT } from './_shared/tokens';

export type FooterAction = {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'icon';
  icon?: LucideIcon;
};

interface Props {
  actions: FooterAction[];
  layout: 'horizontal' | 'stacked';
}

export const SheetActionFooter: React.FC<Props> = ({ actions, layout }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: layout === 'stacked' ? 'column' : 'row',
      gap: layout === 'stacked' ? 8 : 10,
      alignItems: layout === 'stacked' ? 'stretch' : 'center',
      fontFamily: FONT,
    }}
  >
    {actions.map((action, i) => (
      <ActionButton key={i} {...action} />
    ))}
  </div>
);

const ActionButton: React.FC<FooterAction> = ({
  label,
  onClick,
  variant,
  icon: Icon,
}) => {
  if (variant === 'icon' && Icon) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          border: `1px solid ${LINE_2}`,
          background: BG_2,
          color: T100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <Icon size={18} strokeWidth={2} />
      </button>
    );
  }
  const isPrimary = variant === 'primary';
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        width: '100%',
        minHeight: 44,
        height: 44,
        borderRadius: 12,
        border: isPrimary ? 'none' : `1px solid ${LINE_2}`,
        background: isPrimary ? T100 : BG_2,
        color: isPrimary ? BG_0 : T100,
        fontSize: 15,
        fontWeight: isPrimary ? 700 : 700,
        cursor: 'pointer',
        fontFamily: FONT,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '0 16px',
        lineHeight: 1,
      }}
    >
      {Icon && <Icon size={16} strokeWidth={2.2} />}
      {label}
    </button>
  );
};
