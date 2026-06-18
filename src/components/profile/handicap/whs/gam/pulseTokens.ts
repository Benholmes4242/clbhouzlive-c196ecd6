import {
  Swords,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

export type PulseKind = 'threat' | 'chase' | 'win';

export interface PulseRarity {
  iconBg: string;
  iconRing: string;
  labelFg: string;
  labelBg: string;
  pillBorder: string;
  cardBorder: string;
  cardSweep: string;
  outerGlow: string | null;
  Icon: LucideIcon;
  label: string;
}

export const PULSE_DARK: Record<PulseKind, PulseRarity> = {
  threat: {
    iconBg: 'rgba(159,29,29,0.18)',
    iconRing: 'rgba(159,29,29,0.55)',
    labelFg: 'var(--hcp-bad, #DC2626)',
    labelBg: 'rgba(159,29,29,0.18)',
    pillBorder: 'rgba(159,29,29,0.50)',
    cardBorder: 'rgba(159,29,29,0.40)',
    cardSweep: 'var(--hcp-bg-1)',
    outerGlow: null,
    Icon: Swords,
    label: 'At risk',
  },
  chase: {
    iconBg: 'var(--hcp-bg-3)',
    iconRing: 'var(--hcp-line-2)',
    labelFg: 'var(--hcp-t-60)',
    labelBg: 'var(--hcp-bg-2)',
    pillBorder: 'var(--hcp-line-2)',
    cardBorder: 'var(--hcp-line)',
    cardSweep: 'var(--hcp-bg-1)',
    outerGlow: null,
    Icon: Target,
    label: 'Chase',
  },
  win: {
    iconBg: 'rgba(5,150,105,0.18)',
    iconRing: 'rgba(5,150,105,0.52)',
    labelFg: 'var(--hcp-good, #15803D)',
    labelBg: 'rgba(5,150,105,0.18)',
    pillBorder: 'rgba(5,150,105,0.50)',
    cardBorder: 'rgba(5,150,105,0.38)',
    cardSweep: 'var(--hcp-bg-1)',
    outerGlow: null,
    Icon: Trophy,
    label: 'Claimed',
  },
};
