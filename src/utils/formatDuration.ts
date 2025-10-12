export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (h > 0) return `${h}h${m ? ` ${m}m` : ''}`; // 1h 1m, 2h
  if (m > 0) return `${m}m${sec ? ` ${sec}s` : ' 00s'}`; // 2m 05s, 4m 00s
  return `${sec}s`; // under 60s
}

export function a11yFullDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} hour${h === 1 ? '' : 's'}`);
  if (m) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  parts.push(`${sec} second${sec === 1 ? '' : 's'}`);
  return parts.join(' ');
}
