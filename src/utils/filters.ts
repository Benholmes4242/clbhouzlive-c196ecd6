export function cssForFilter(f?: {name: 'normal' | 'fade' | 'warm' | 'cool'; intensity: number}) {
  if (!f || f.name === 'normal') return '';
  const t = (f.intensity ?? 50) / 100; // 0..1
  switch (f.name) {
    case 'fade': 
      return `contrast(${100 - 10*t}%) brightness(${100 + 8*t}%) saturate(${100 - 25*t}%)`;
    case 'warm': 
      return `saturate(${100 + 20*t}%) sepia(${15*t}%) hue-rotate(${10*t}deg)`;
    case 'cool': 
      return `saturate(${100 - 10*t}%) hue-rotate(${-12*t}deg)`;
    default: 
      return '';
  }
}
