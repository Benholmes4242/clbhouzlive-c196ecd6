import { firstName as canonicalFirstName } from '@/lib/whs/utils/initials';

export const firstName = (n: string | null | undefined): string => {
  const trimmed = (n ?? '').trim();
  if (!trimmed) return 'Player';
  return canonicalFirstName(trimmed) || 'Player';
};

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { month: 'short', day: '2-digit' });
}

export function formatMonthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export function shortCourseName(name: string): string {
  const cleaned = name
    .replace(' Golf Club', '')
    .replace(' Course', '')
    .replace('Sundridge Park-', 'Sundridge ')
    .replace(/^Royal\s+/, '');
  return cleaned.length > 18 ? cleaned.slice(0, 18) : cleaned;
}
