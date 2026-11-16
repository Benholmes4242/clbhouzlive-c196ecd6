/** Course list V2 has one presentation for browse and Top 100. Leads are
 * display-only; record identity comes from the existing batched holder read.
 * shortCoursePart owns names across this card, Latest holes and the viewer. */
import React from 'react';
import { getOptimizedImageUrl, generateImageSrcSet } from '@/utils/enhancedImageOptimization';
import { TOPAR_RED } from '@/features/courses/components/holes/analytical/tokens';
import { CategoryScores } from '@/components/courses/course-detail/CategoryScores';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Button } from '@/components/ui/button';
import { shortCoursePart } from '@/lib/courseMedia/memberShotPosts';
import type { StatBrowseRow, StatLens } from './useStatBrowse';
import type { CourseRecordHolderEntry, CourseListPlayer } from './useCourseRecordHolders';
import { courseListLead } from './courseListCardRules';
import { fmtCount } from './browse/format';
import './courseListCard.css';

export const PHOTO_H = 190;
export const TOP100_PHOTO_H = 190;
export const RECORD_GOLD = 'var(--course-list-record)';
interface BrowseCourseCardProps {
  row: StatBrowseRow;
  onClick: () => void;
  variant?: 'browse' | 'top100';
  lens?: StatLens;
  rank?: number | null;
  officialRank?: number | null;
  difficultyPercentile?: number | null;
  viewerRounds?: number;
  viewerBest?: number | null;
  recordHolder?: string | null;
  players?: CourseListPlayer[];
  holder?: CourseRecordHolderEntry | null;
}
export function BrowseCourseCard({ row, onClick, variant = 'browse', lens = 'played', rank = null,
  officialRank = null, recordHolder = null, players = [], holder = null }: BrowseCourseCardProps) {
  const top100 = variant === 'top100';
  const effectiveLens = top100 ? (officialRank != null ? 'rated' : 'played') : lens;
  const lead = courseListLead(effectiveLens, row);
  const shortName = shortCoursePart(row.name);
  const location = [row.region, row.sub_country].filter(Boolean).join(', ') || row.country;
  const record = holder && row.course_record != null && holder.holderName.trim() &&
    (top100 ? Boolean(recordHolder) : holder.recordGross === row.course_record) ? holder : null;
  const noRounds = top100 && row.rounds === 0;
  const faces = players.slice(0, 3);
  // The same number never prints twice: a rounds lead pairs with members.
  const leadIsRounds = /^rounds?$/.test(lead.label);
  const sideCount = leadIsRounds ? row.members : row.rounds;
  const sideWord = leadIsRounds ? (row.members === 1 ? 'member' : 'members') : (row.rounds === 1 ? 'round' : 'rounds');
  return <Button variant="ghost" type="button" className="course-list-card" onClick={onClick}
    aria-label={`View ${row.name}`} style={{ '--course-list-under': TOPAR_RED } as React.CSSProperties}>
    <div className="course-list-photo" style={{ height: top100 ? TOP100_PHOTO_H : PHOTO_H }}>
      {row.image_url ? <img src={getOptimizedImageUrl(row.image_url, { width: 640 })}
        srcSet={generateImageSrcSet(row.image_url, [{ width: 400 }, { width: 640 }, { width: 800 }])}
        sizes="100vw" alt="" loading="lazy" decoding="async" /> : null}
      <div aria-hidden className="course-list-scrim" />
      <div className="course-list-name-block">
        {rank != null ? <div className="course-list-position">{rank}</div> : null}
        <div className="course-list-name-column"><h3 className="course-list-name">{shortName}</h3>
          <div className="course-list-area">{location}{top100 && officialRank != null ? ` · Official #${officialRank}` : ''}</div>
        </div>
      </div>
    </div>
    <div className="course-list-body">
    {noRounds ? <div className="course-list-no-rounds">No member has logged an official round yet. <span>Be the first.</span></div> : <>
      <div className="course-list-lead">
        <div className="course-list-lead-value"><div className="course-list-figure" data-tone={lead.tone}>{lead.value}</div><div className="course-list-lead-label">{lead.label}</div></div>
        {sideCount > 0 ? <div className="course-list-members" data-side={leadIsRounds ? 'members' : 'rounds'}>
          {faces.length > 0 ? <span className="course-list-faces" aria-hidden style={{ width: 20 + (faces.length - 1) * 15 }}>
            {faces.map((player, index) => <span key={player.id} className="course-list-face" style={{ left: index * 15, zIndex: 3 - index }}>
              <SquircleAvatar src={player.photoUrl} userId={player.id} size={20} alt={player.name ?? ''} surface="canvas" hairlineRing />
            </span>)}
          </span> : null}
          <span><b>{fmtCount(sideCount)}</b> {sideWord}</span>
        </div> : null}
      </div>
      {record ? <div className="course-list-record">
        <SquircleAvatar src={record.photoUrl} userId={record.holderId} size={26} alt={top100 ? recordHolder ?? record.holderName : record.holderName} surface="canvas" hairlineRing />
        <div className="course-list-holder"><div className="course-list-record-label">COURSE RECORD</div><div className="course-list-holder-name">{top100 ? recordHolder : record.holderName}</div></div>
        {effectiveLens !== 'lowest' ? <div className="course-list-record-score" style={{ flex: 'none', whiteSpace: 'nowrap' }}><div className="course-list-gross">{row.course_record}</div><div className="course-list-gross-label">GROSS</div></div> : null}
      </div> : null}
    </>}
    {[row.design_score, row.condition_score, row.clubhouse_score, row.facilities_score].some(value => value != null) ?
      <CategoryScores layout="strip" scores={{ design: row.design_score, condition: row.condition_score, clubhouse: row.clubhouse_score, facilities: row.facilities_score }} /> : null}
  </div>
  </Button>;
}
export default BrowseCourseCard;
