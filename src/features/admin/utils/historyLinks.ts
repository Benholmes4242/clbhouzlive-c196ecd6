export function buildHistoryUrl(opts: {
  tag?: string; 
  q?: string;
  fromISO?: string; 
  toISO?: string;
  dayISO?: string; // overrides range for a single day
}) {
  const params = new URLSearchParams();
  if (opts.tag) params.set('tag', opts.tag);
  if (opts.q) params.set('q', opts.q);

  if (opts.dayISO) {
    params.set('from', opts.dayISO);
    params.set('to', opts.dayISO);
  } else {
    if (opts.fromISO) params.set('from', opts.fromISO);
    if (opts.toISO) params.set('to', opts.toISO);
  }

  const qs = params.toString();
  return `/hub/echo/history${qs ? `?${qs}` : ''}`;
}
