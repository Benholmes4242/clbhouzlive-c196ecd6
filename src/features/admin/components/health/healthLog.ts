/** Admin log wording (BRIEF_HEALTH, Jobs rule 7). */
import type { HealthLogRow } from '../../hooks/useHealthLenses';
import { plainJobName } from './jobNames';

const GDPR = new Set(['SELF_DELETE_ACCOUNT_GDPR', 'ADMIN_DELETE_ACCOUNT_GDPR']);

export function logTitle(r: Pick<HealthLogRow, 'action' | 'details'>): string {
  const d = r.details ?? {};
  switch (r.action) {
    case 'delete_course': return 'Course deleted';
    case 'SELF_DELETE_ACCOUNT_GDPR': return 'Account deleted by its owner';
    case 'ADMIN_DELETE_ACCOUNT_GDPR':
    case 'admin_delete':
    case 'delete_user': return 'Account deleted by an admin';
    case 'change_username': return 'Username changed';
    case 'unsuspend': return 'Member unsuspended';
    case 'run_cron_job': return `Job run by hand${d.ok === false ? ' - failed' : ''}`;
    case 'pause_cron_job': return 'Job paused';
    case 'resume_cron_job': return 'Job resumed';
    default: {
      const s = r.action.replace(/_/g, ' ').trim().toLowerCase();
      return s ? s[0].toUpperCase() + s.slice(1) : r.action;
    }
  }
}

export function logMeta(r: Pick<HealthLogRow, 'action' | 'details' | 'target_email' | 'admin'>): string {
  const d = (r.details ?? {}) as Record<string, unknown>;
  if (GDPR.has(r.action)) return `${r.target_email ?? '-'} · GDPR request`;
  let detail: string | null = null;
  if (r.action === 'change_username') detail = `@${d.oldUsername ?? '-'} to @${d.newUsername ?? '-'}`;
  else if (r.action === 'delete_course') detail = null;
  else if (typeof d.reason === 'string' && d.reason) detail = d.reason;
  else if (typeof d.job === 'string' && d.job) detail = plainJobName(d.job);
  else detail = r.target_email;
  const by = r.admin ? `by ${r.admin}` : null;
  return [detail, by].filter(Boolean).join(' · ');
}

export function logLetter(kind: string | null): { letter: string; bg: string } {
  switch (kind) {
    case 'courses': return { letter: 'C', bg: '#FFA83A' };
    case 'accounts': return { letter: 'A', bg: '#7B8697' };
    case 'content': return { letter: 'S', bg: '#E9EDF3' };
    case 'jobs': return { letter: 'J', bg: '#5FE3A8' };
    default: return { letter: (kind?.[0] ?? '·').toUpperCase(), bg: '#B3BCC9' };
  }
}

export const hasDetails = (r: Pick<HealthLogRow, 'details'>) => !!r.details && Object.keys(r.details).length > 0;
