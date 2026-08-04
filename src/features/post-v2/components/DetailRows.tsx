// DetailRows - tap-through rows: course, actor, schedule.

import { ChevronRight, MapPin, User2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StageCourse } from '../hooks/useStageComposer';
import type { ActiveActor } from '@/types/actor';
import { formatSchedule } from '../lib/formatSchedule';
import { CT } from '@/features/_shared/composerTokens';

interface Props {
  course: StageCourse | null;
  /** Full ordered tag list; when length > 1 the row shows "Name +N-1". */
  courses?: StageCourse[];
  onOpenCourse: () => void;
  actor: ActiveActor | null;
  onOpenActor: () => void;
  scheduledAt: Date | null;
  onOpenSchedule: () => void;
  /** Edit mode: actor is display-only; schedule row can be hidden. */
  actorLocked?: boolean;
  showSchedule?: boolean;
}

export default function DetailRows({ course, courses, onOpenCourse, actor, onOpenActor, scheduledAt, onOpenSchedule, actorLocked, showSchedule = true }: Props) {
  const { t } = useTranslation('composer');
  const list = courses ?? (course ? [course] : []);
  const courseLabel = list.length === 0
    ? null
    : list.length === 1
      ? list[0].name
      : `${list[0].name} +${list.length - 1}`;

  // The row set is variable, so the divider owner is computed from what is
  // actually rendered rather than assumed.
  const rows: Array<{ key: string; icon: React.ReactNode; label: string; value: string | null; optional: boolean; onClick: () => void; disabled?: boolean }> = [];
  rows.push({ key: 'course', icon: <MapPin size={16} />, label: 'Tag a course', value: courseLabel, optional: true, onClick: onOpenCourse });
  rows.push({ key: 'actor', icon: <User2 size={16} />, label: 'Posting as', value: actor?.name ?? null, optional: false, onClick: onOpenActor, disabled: actorLocked });
  if (showSchedule) {
    rows.push({ key: 'schedule', icon: <Clock size={16} />, label: 'Schedule for later', value: scheduledAt ? formatSchedule(scheduledAt) : null, optional: true, onClick: onOpenSchedule });
  }

  return (
    <div>
      {rows.map((r, i) => (
        <Row
          key={r.key}
          icon={r.icon}
          label={r.label}
          value={r.value}
          optional={r.optional}
          onClick={r.onClick}
          disabled={r.disabled}
          last={i === rows.length - 1}
        />
      ))}
    </div>
  );
}

function Row({ icon, label, value, optional, onClick, disabled, last }: { icon: React.ReactNode; label: string; value: string | null; optional: boolean; onClick: () => void; disabled?: boolean; last: boolean }) {
  const { t } = useTranslation('composer');
  const display = value ?? (optional ? t('detailRows.optional') : '');
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        background: 'transparent',
        border: 0,
        padding: '13px 0',
        borderBottom: last ? undefined : `1px solid ${CT.hairline}`,
        cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left',
        opacity: disabled ? 0.75 : 1,
      }}
    >
      <span style={{ display: 'flex', color: value ? CT.amber : CT.muted }}>{icon}</span>
      <span style={{ color: CT.ink, fontSize: 13.5, fontWeight: 600, flex: '0 0 auto' }}>{label}</span>
      <span style={{ color: value ? CT.secondary : CT.muted, fontSize: 12, marginLeft: 'auto', maxWidth: 140, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {display}
      </span>
      {!disabled && <ChevronRight size={15} color={CT.muted} />}
    </button>
  );
}
