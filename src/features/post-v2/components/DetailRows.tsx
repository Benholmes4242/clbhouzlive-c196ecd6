// DetailRows - three tap-through rows: course, actor, schedule.

import { ChevronRight, MapPin, User2, Clock, Flag } from 'lucide-react';
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
  /** C2: shown only when the primary course has logged rounds for the viewer. */
  showAttachRound?: boolean;
  attachRoundLabel?: string | null;
  onOpenAttachRound?: () => void;
}

export default function DetailRows({ course, courses, onOpenCourse, actor, onOpenActor, scheduledAt, onOpenSchedule, actorLocked, showSchedule = true, showAttachRound, attachRoundLabel, onOpenAttachRound }: Props) {
  const { t } = useTranslation('composer');
  const list = courses ?? (course ? [course] : []);
  const courseLabel = list.length === 0
    ? null
    : list.length === 1
      ? list[0].name
      : `${list[0].name} +${list.length - 1}`;
  return (
    <div style={{ background: CT.canvas }}>
      <Row icon={<MapPin size={16} color={CT.amber} />} label="Tag a course" value={courseLabel} onClick={onOpenCourse} />
      {showAttachRound && onOpenAttachRound && (
        <Row icon={<Flag size={16} color={CT.amber} />} label={t('attachRound.row')} value={attachRoundLabel ?? null} onClick={onOpenAttachRound} />
      )}
      <Row icon={<User2 size={16} color={CT.amber} />} label="Posting as" value={actor?.name ?? null} onClick={onOpenActor} disabled={actorLocked} />
      {showSchedule && (
        <Row icon={<Clock size={16} color={CT.amber} />} label="Schedule for later" value={scheduledAt ? formatSchedule(scheduledAt) : null} onClick={onOpenSchedule} />
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
      <span style={{ color: CT.secondary }}>{icon}</span>
      <span style={{ color: CT.ink, fontSize: 14, flex: '0 0 auto' }}>{label}</span>
      <span style={{ color: value ? CT.ink : CT.muted, fontWeight: value ? 600 : 400, fontSize: 13, marginLeft: 'auto', maxWidth: '55%', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {value ?? 'Not set'}
      </span>
      {!disabled && <ChevronRight size={16} color={CT.muted} />}
    </button>
  );
}
