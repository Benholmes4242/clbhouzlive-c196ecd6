import { GREEN, RED, AMBER } from '@/pages/rivalry-page/_shared/tokens';

export interface H2HTier {
  /** Tier index 1-8 for analytics / debugging. 8 = BEAST MODE, 1 = OBLITERATED. */
  index: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  /** Top-line eyebrow in caps. May include emoji. */
  eyebrow: string;
  /** Small line of context beneath the big number. */
  subcopy: string;
  /** Accent colour for the eyebrow + border. */
  accent: string;
  /** Background gradient for the banner. */
  gradient: string;
  /** 'low' (subtle), 'mid', or 'high' (most saturated). */
  intensity: 'low' | 'mid' | 'high';
}

export function getH2HTier(
  myWins: number,
  _theirWins: number,
  _total: number,
  rivalFirstName: string,
): H2HTier {
  const w = myWins;

  if (w >= 15) {
    return {
      index: 8,
      eyebrow: '🔥 BEAST MODE',
      subcopy: 'Untouchable',
      accent: GREEN,
      gradient:
        'linear-gradient(135deg, rgba(34,197,94,0.28), rgba(34,197,94,0.04))',
      intensity: 'high',
    };
  }
  if (w >= 13) {
    return {
      index: 7,
      eyebrow: '⚡ TOTAL DOMINATION',
      subcopy: "It's not close",
      accent: GREEN,
      gradient:
        'linear-gradient(135deg, rgba(34,197,94,0.20), rgba(34,197,94,0.03))',
      intensity: 'high',
    };
  }
  if (w >= 10) {
    return {
      index: 6,
      eyebrow: 'DOMINATING',
      subcopy: "You're winning this rivalry",
      accent: GREEN,
      gradient:
        'linear-gradient(135deg, rgba(34,197,94,0.14), rgba(34,197,94,0.02))',
      intensity: 'mid',
    };
  }
  if (w >= 8) {
    return {
      index: 5,
      eyebrow: 'NECK AND NECK',
      subcopy: 'Too close to call',
      accent: AMBER,
      gradient:
        'linear-gradient(135deg, rgba(247,147,30,0.14), rgba(247,147,30,0.02))',
      intensity: 'mid',
    };
  }
  if (w >= 6) {
    return {
      index: 4,
      eyebrow: `${rivalFirstName.toUpperCase()} LEADS`,
      subcopy: "They've got the edge",
      accent: RED,
      gradient:
        'linear-gradient(135deg, rgba(239,68,68,0.10), rgba(239,68,68,0.02))',
      intensity: 'low',
    };
  }
  if (w >= 5) {
    return {
      index: 3,
      eyebrow: `${rivalFirstName.toUpperCase()} DOMINATES`,
      subcopy: "You're being outplayed",
      accent: RED,
      gradient:
        'linear-gradient(135deg, rgba(239,68,68,0.14), rgba(239,68,68,0.02))',
      intensity: 'mid',
    };
  }
  if (w >= 3) {
    return {
      index: 2,
      eyebrow: '💀 BEING DEMOLISHED',
      subcopy: "It's not close",
      accent: RED,
      gradient:
        'linear-gradient(135deg, rgba(239,68,68,0.20), rgba(239,68,68,0.03))',
      intensity: 'high',
    };
  }
  return {
    index: 1,
    eyebrow: '☠️ OBLITERATED',
    subcopy: `${rivalFirstName} owns you`,
    accent: RED,
    gradient:
      'linear-gradient(135deg, rgba(239,68,68,0.28), rgba(239,68,68,0.04))',
    intensity: 'high',
  };
}
