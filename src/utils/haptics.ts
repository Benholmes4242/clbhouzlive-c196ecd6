export function haptic(kind: 'light' | 'medium' | 'heavy' = 'light') {
  if (!('vibrate' in navigator)) return;
  
  const pattern = kind === 'heavy' ? [0, 20]
                : kind === 'medium' ? [0, 12]
                : [0, 6];
                
  try { 
    navigator.vibrate(pattern); 
  } catch {
    // Silently fail if vibration is not supported
  }
}