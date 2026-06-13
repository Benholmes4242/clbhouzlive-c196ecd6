// Shared Activity notification design tokens.
// Pulled out so every tier component renders against the same palette.

export const INK = '#0F172A';
export const INK_SOFT = '#475569';
export const INK_SUBTLE = '#94A3B8';
export const BORDER = 'rgba(15,23,42,0.07)';
export const HAIRLINE = 'rgba(15,23,42,0.06)';
export const SURFACE = '#FFFFFF';
export const UNREAD_BG = 'rgba(247,147,30,0.04)';
export const UNREAD_BORDER = 'rgba(247,147,30,0.18)';

export const AMBER = '#F7931E';
export const AMBER_DEEP = '#C97A10';
export const GOLD_GRAD = 'linear-gradient(135deg,#F7C36A 0%,#E69826 60%,#B6700E 100%)';

export const REVEAL = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: '0px 0px -10% 0px' },
  transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
};

export const CARD_RADIUS = 18;
