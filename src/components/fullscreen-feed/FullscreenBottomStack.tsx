/** FullscreenBottomStack — the one bottom stack of every full-screen viewer
 * (FULL-SCREEN VIEWER signed-off fullscreenViewer_390): dots · tagged pill +
 * 36px glass mute · member line (32px squircle, name, "· time", REVIEW chip on
 * reviews) · stat row. Shared by ImmersiveFullscreenChrome and
 * CourseGalleryChrome so the two cannot drift. Callers keep every row's
 * presence constant across one post's slides (the pill row always reserves its
 * height; the stat row is decided per post), so swiping never moves the dots,
 * pill or member line. Scrubber and button row stay owned by fullscreenCanon. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MuteButton } from '@/audio/MuteButton';
import { PlayedWithViewerChip, type PlayedWithPerson } from '@/components/feed/PostGolfTags';
import { CHIP_GLASS } from '@/lib/tokens/glass';
import { STAT_LABELS, type StatCell } from '@/lib/fullscreen/statRow';
import './fullscreen-stack.css';

export interface FullscreenBottomStackProps {
  dots?: { count: number; active: number } | null;
  people?: ReadonlyArray<PlayedWithPerson> | null;
  onOpenTagged?: (id: string, kind?: 'user' | 'business') => void;
  mute?: { muted: boolean; onToggle: () => void } | null;
  member: { name: string; nameNode?: React.ReactNode; avatarUrl: string | null; userId?: string | null; time?: string | null; onOpen?: () => void; mark?: React.ReactNode; follow?: { following: boolean; onFollow: () => void } | null };
  onOpenReview?: (() => void) | null;
  /** null = this post has no stat row on any slide. */
  cells: StatCell[] | null;
  /** Extra row (e.g. the attached round pill) between member line and stat row. */
  extra?: React.ReactNode;
  peopleKey?: string;
  /** The course viewer keeps its run-progress identity (data-gallery-progress). */
  dotsKind?: 'post' | 'gallery';
}

export function FullscreenStatRow({ cells }: { cells: StatCell[] }) {
  const { t } = useTranslation('common');
  return (
    <div className="fs-stats" data-fullscreen-stats>
      {cells.map((c) => (
        <div key={c.key} data-stat={c.key}>
          <b>{c.value}</b>
          <span>{t(`fullscreen.stats.${c.key}`, { defaultValue: STAT_LABELS[c.key] })}</span>
        </div>
      ))}
    </div>
  );
}

export function FullscreenBottomStack({ dots, people, onOpenTagged, mute, member, onOpenReview, cells, extra, peopleKey, dotsKind = 'post' }: FullscreenBottomStackProps) {
  const { t } = useTranslation('common');
  return (
    <div className="fs-stack" data-fullscreen-bottom-stack>
      {dots && dots.count >= 2 && (
        dotsKind === 'gallery'
          ? <div className="fs-stack-dots" data-gallery-progress aria-hidden>
              {Array.from({ length: dots.count }, (_, i) => <i key={i} data-on={i === dots.active ? '' : undefined} data-current={i === dots.active} />)}
            </div>
          : <div className="fs-stack-dots" data-fullscreen-dots aria-hidden>
              {Array.from({ length: dots.count }, (_, i) => <span key={i} data-on={i === dots.active ? '' : undefined} data-dot-active={i === dots.active ? '' : undefined} />)}
            </div>
      )}
      <div className="fs-stack-row" data-fullscreen-pill-row>
        {people && people.length > 0
          ? <PlayedWithViewerChip key={peopleKey} people={people} onOpenProfile={(id, kind) => onOpenTagged?.(id, kind)} style={{ marginTop: 0, maxWidth: 'calc(100% - 50px)' }} />
          : <span />}
        {mute && (
          <span data-fullscreen-mute style={{ pointerEvents: 'auto', flex: 'none' }} onClick={(e) => e.stopPropagation()}>
            <MuteButton size="chip" muted={mute.muted} onToggle={mute.onToggle} />
          </span>
        )}
      </div>
      <div className="fs-stack-member" data-fullscreen-member>
        <span data-fs-avatar className="fs-avatar" style={{ cursor: member.onOpen ? 'pointer' : undefined }} onClick={(e) => { e.stopPropagation(); member.onOpen?.(); }}>
          <SquircleAvatar size={32} src={member.avatarUrl} alt={member.name} userId={member.userId ?? undefined} hairlineRing />
        </span>
        <button type="button" className="fs-name" aria-label={member.onOpen ? `View ${member.name}'s profile` : undefined} onClick={(e) => { e.stopPropagation(); member.onOpen?.(); }}>{member.nameNode ?? member.name}</button>
        {member.mark}
        {member.time && <span className="fs-time">· {member.time}</span>}
        {member.follow && (member.follow.following
          ? <span className="fs-following" data-fullscreen-following>· {t('fullscreen.following', { defaultValue: 'FOLLOWING' })}</span>
          : <button type="button" className="fs-follow" data-fullscreen-follow onClick={(e) => { e.stopPropagation(); member.follow?.onFollow(); }}>
              <span className="fs-follow-sep" aria-hidden>· </span>{t('fullscreen.follow', { defaultValue: 'Follow' })}
            </button>)}
        {onOpenReview && (
          <button type="button" className="fs-review-chip" data-fullscreen-review-chip aria-label={t('fullscreen.openReview', { defaultValue: 'Open the full review' })}
            style={CHIP_GLASS} onClick={(e) => { e.stopPropagation(); onOpenReview(); }}>
            {t('fullscreen.review', { defaultValue: 'REVIEW' })}
            <ChevronRight size={14} strokeWidth={2.4} aria-hidden />
          </button>
        )}
      </div>
      {extra}
      {cells && <FullscreenStatRow cells={cells} />}
    </div>
  );
}
