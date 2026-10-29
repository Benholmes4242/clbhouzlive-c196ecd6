/** EP3 presentation rules; handicap authority stays in resolveDisplayHandicap. */
import { parseHcpFormString } from '@/lib/formatHcp';

export function validOwnHandicap(value: string) {
  if (!value.trim()) return true;
  if (!/^\+?\d+(?:\.\d+)?$/.test(value.trim())) return false;
  const n = parseHcpFormString(value);
  return n != null && n >= -10 && n <= 54;
}

export function syncLabel(at: string | null, now = new Date()) {
  if (!at) return '';
  const date = new Date(at);
  if (!Number.isFinite(date.getTime())) return '';
  const today = date.toDateString() === now.toDateString();
  return `synced ${today ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
}