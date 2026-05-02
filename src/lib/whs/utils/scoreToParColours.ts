/**
 * Score-to-par colour helpers for the light-bg #F8FAFC handicap surface.
 *
 * Visual semantics intentionally mirror Tour Hub's getScoreColorSet:
 *   - scoreToPar <= -2 : Eagle+   (circle, double outline)
 *   - scoreToPar === -1 : Birdie  (circle)
 *   - scoreToPar === 0  : Par     (square, dashed border, transparent fill)
 *   - scoreToPar === 1  : Bogey   (square)
 *   - scoreToPar >= 2   : Dbl+    (square, double outline)
 */

export interface ScoreToParColours {
  text: string;
  bg: string;
  ring: string;
  doubleOutline: boolean;
  dashed: boolean;
  isCircle: boolean;
}

const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const RED = '#9F1D1D';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';

export function getScoreToParColours(scoreToPar: number): ScoreToParColours {
  if (scoreToPar <= -2) {
    return {
      text: INK,
      bg: '#FEF3C7',
      ring: AMBER_DEEP,
      doubleOutline: true,
      dashed: false,
      isCircle: true,
    };
  }
  if (scoreToPar === -1) {
    return {
      text: INK,
      bg: 'rgba(247,147,30,0.10)',
      ring: AMBER,
      doubleOutline: false,
      dashed: false,
      isCircle: true,
    };
  }
  if (scoreToPar === 0) {
    return {
      text: INK_MUTE,
      bg: 'transparent',
      ring: 'rgba(15,23,42,0.18)',
      doubleOutline: false,
      dashed: true,
      isCircle: false,
    };
  }
  if (scoreToPar === 1) {
    return {
      text: RED,
      bg: 'rgba(159,29,29,0.06)',
      ring: RED,
      doubleOutline: false,
      dashed: false,
      isCircle: false,
    };
  }
  return {
    text: RED,
    bg: 'rgba(159,29,29,0.06)',
    ring: RED,
    doubleOutline: true,
    dashed: false,
    isCircle: false,
  };
}
