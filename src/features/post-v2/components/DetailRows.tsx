// DetailRows - three tap-through rows: course, actor, schedule.

import { ChevronRight, MapPin, User2, Clock } from 'lucide-react';
import type { StageCourse } from '../hooks/useStageComposer';
import type { ActiveActor } from '@/types/actor';
import { formatSchedule } from '../lib/formatSchedule';

interface Props {
  courses: StageCourse[];
  onOpenCourse: () => void;
  actor: ActiveActor | null;
  onOpenActor: () => void;
  scheduledAt: Date | null;
  onOpenSchedule: () => void;
  /** Edit mode: actor is display-only; schedule row can be hidden. */
  actorLocked?: boolean;
  showSchedule?: boolean;
}

export default function DetailRows({ courses, onOpenCourse, actor, onOpenActor, scheduledAt, onOpenSchedule, actorLocked, showSchedule = true }: Props) {
  const courseValue = courses.length === 0
    ? null
    : courses.length === 1
      ? courses[0].name
      : `${courses[0].name} +${courses.length - 1}`;
  return (
    <div style={{ background: '#F8FAFC' }}>
      <Row icon={<MapPin size={16} color="#F7931E" />} label="Tag a course" value={courseValue} onClick={onOpenCourse} />
      <Row icon={<User2 size={16} color="#F7931E" />} label="Posting as" value={actor?.name ?? null} onClick={onOpenActor} disabled={actorLocked} />
      {showSchedule && (
        <Row icon={<Clock size={16} color="#F7931E" />} label="Schedule for later" value={scheduledAt ? formatSchedule(scheduledAt) : null} onClick={onOpenSchedule} />
      )}
    </div>
  );
}

function Row({ icon, label, value, onClick, disabled }: { icon: React.ReactNode; label: string; value: string | null; onClick: () => void; disabled?: boolean }) {
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
        padding: '12px 16px',
        borderTop: '1px solid rgba(0,0,0,0.07)',
        cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left',
        opacity: disabled ? 0.75 : 1,
      }}
    >
      <span style={{ color: '#8A9099' }}>{icon}</span>
      <span style={{ color: '#1F2428', fontSize: 14, flex: '0 0 auto' }}>{label}</span>
      <span style={{ color: value ? '#1F2428' : '#AEB4BC', fontWeight: value ? 600 : 400, fontSize: 13, marginLeft: 'auto', maxWidth: '55%', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {value ?? 'Not set'}
      </span>
      {!disabled && <ChevronRight size={16} color="#AEB4BC" />}
    </button>
  );
}
