import { firstName as canonicalFirstName } from '@/lib/whs/utils/initials';
import {
  formatDay2MonthYearShortGB,
  formatMonthDay2ShortGB,
  formatMonthYearShortGB,
} from '@/i18n/format';

export const firstName = (n: string | null | undefined): string => {
  const trimmed = (n ?? '').trim();
  if (!trimmed) return 'Player';
  return canonicalFirstName(trimmed) || 'Player';
};

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return formatDay2MonthYearShortGB(d);
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return formatMonthDay2ShortGB(d);
}

export function formatMonthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return formatMonthYearShortGB(d);
}

export function shortCourseName(name: string): string {
  const cleaned = name
    .replace(' Golf Club', '')
    .replace(' Course', '')
    .replace('Sundridge Park-', 'Sundridge ')
    .replace(/^Royal\s+/, '');
  return cleaned.length > 18 ? cleaned.slice(0, 18) : cleaned;
}
