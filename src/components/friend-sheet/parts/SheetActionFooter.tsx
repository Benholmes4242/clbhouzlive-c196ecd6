import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { T100, LINE_2, AMBER, FONT } from './_shared/tokens';

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
      <ActionButton key={i} {...action} layout={layout} />
    ))}
  </div>
);

const ActionButton: React.FC<FooterAction & { layout: 'horizontal' | 'stacked' }> = ({
  label,
  onClick,
  variant,
  icon: Icon,
  layout,
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
          background: 'transparent',
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
  // Stacked layouts host a single full-width primary CTA below a hero card; it
  // needs more visual weight than the 44px row-aligned buttons in horizontal layouts.
  const isTallPrimary = isPrimary && layout === 'stacked';
  const buttonHeight = isTallPrimary ? 52 : 44;
  const buttonFontSize = isTallPrimary ? 15 : 14;
  const iconSize = isTallPrimary ? 16 : 14;
  const buttonGap = isTallPrimary ? 8 : 6;
  const borderRadius = isTallPrimary ? 14 : 12;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        height: buttonHeight,
        borderRadius,
        border: isPrimary ? 'none' : `1px solid ${LINE_2}`,
        background: isPrimary ? AMBER : 'transparent',
        color: isPrimary ? '#0A0E14' : T100,
        fontSize: buttonFontSize,
        fontWeight: isPrimary ? 800 : 700,
        cursor: 'pointer',
        fontFamily: FONT,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: buttonGap,
      }}
    >
      {Icon && <Icon size={iconSize} strokeWidth={2.2} />}
      {label}
    </button>
  );
};
