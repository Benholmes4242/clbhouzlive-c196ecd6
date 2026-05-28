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
    cardSweep:
      'linear-gradient(135deg, var(--hcp-bg-1) 0%, #151B23 50%, rgba(159,29,29,0.14) 100%)',
    outerGlow: '0 0 28px -10px rgba(159,29,29,0.45)',
    Icon: Swords,
    label: 'At risk',
  },
  chase: {
    iconBg: 'rgba(247,147,30,0.14)',
    iconRing: 'rgba(247,147,30,0.45)',
    labelFg: '#FCD34D',
    labelBg: 'rgba(247,147,30,0.16)',
    pillBorder: 'rgba(247,147,30,0.40)',
    cardBorder: 'rgba(247,147,30,0.32)',
    cardSweep:
      'linear-gradient(135deg, var(--hcp-bg-1) 0%, #151B23 50%, rgba(247,147,30,0.12) 100%)',
    outerGlow: '0 0 32px -10px rgba(247,147,30,0.40)',
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
