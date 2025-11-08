// haptics.ts
export const hapticTap = () => (navigator.vibrate?.(10), void 0);
export const hapticSoft = () => (navigator.vibrate?.([2,12]), void 0);
