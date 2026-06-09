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
    labelFg: '#F87171',
    labelBg: 'rgba(159,29,29,0.18)',
    pillBorder: 'rgba(159,29,29,0.50)',
    cardBorder: 'rgba(159,29,29,0.40)',
    cardSweep: 'var(--hcp-bg-1)',
    outerGlow: null,
    Icon: Swords,
    label: 'At risk',
  },
  chase: {
    iconBg: 'rgba(255,255,255,0.08)',
    iconRing: 'rgba(255,255,255,0.30)',
    labelFg: '#FFFFFF',
    labelBg: 'rgba(255,255,255,0.10)',
    pillBorder: 'rgba(255,255,255,0.30)',
    cardBorder: 'rgba(255,255,255,0.14)',
    cardSweep: 'var(--hcp-bg-1)',
    outerGlow: null,
    Icon: Target,
    label: 'Chase',
  },
  win: {
    iconBg: 'rgba(5,150,105,0.18)',
    iconRing: 'rgba(5,150,105,0.52)',
    labelFg: '#34D399',
    labelBg: 'rgba(5,150,105,0.18)',
    pillBorder: 'rgba(5,150,105,0.50)',
    cardBorder: 'rgba(5,150,105,0.38)',
    cardSweep:
      'linear-gradient(135deg, var(--hcp-bg-1) 0%, #151B23 50%, rgba(5,150,105,0.16) 100%)',
    outerGlow: '0 0 28px -10px rgba(5,150,105,0.42)',
    Icon: Trophy,
    label: 'Claimed',
  },
};
