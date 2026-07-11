export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  const trim = (v: number, suffix: string) => {
    const s = v.toFixed(1);
    return (s.endsWith('.0') ? s.slice(0, -2) : s) + suffix;
  };
  if (n < 1_000_000) {
    const v = n / 1000;
    if (v.toFixed(1) === '1000.0') return '1m';
    return trim(v, 'k');
  }
  return trim(n / 1_000_000, 'm');
}
