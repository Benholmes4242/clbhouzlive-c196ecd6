import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHead } from '@/components/courses/browse/SectionHead';
import { ExploreSheetShell } from '@/components/explore-tab-new/courseled/ExploreSheetShell';
import { RailChips } from '@/components/ui/RailChips';
import { Top100ListProgressSheet } from '@/components/top100/sheets/Top100ListProgressSheet';
import { useTop100ListProgress } from '@/hooks/gam/useTop100ListProgress';
import { useTop100Race, type CareerRow } from '@/hooks/top100/useTop100Race';
import { hundredSlab, raceRows } from '@/hooks/top100/hundredRaceRules';
import { RANK_SCOPE_LABEL, type RankListSlug } from '@/features/explore-magazine/useTop100RankIndex';
import { HundredRaceRow, HundredRail, HundredYou } from './HundredRaceParts';
import { YourHundredShell } from './top100Shells';
import { useSectionReady } from '../browse/PageLoadGate';

/** T100 race consumes the chip's raw slug, never the previous course-page
 * placeholder slug. See-all owns independent chips, as on the old Rounds page. */
export function Top100RaceSection({ viewerId, list, total, onOpenCourse }: { viewerId: string; list: RankListSlug; total: number; onOpenCourse: (id: string) => void }) {
  const board = useTop100Race(viewerId, list);
  const progress = useTop100ListProgress(list, viewerId, viewerId);
  const { t } = useTranslation('courses');
  const [all, setAll] = useState(false), [member, setMember] = useState<{ row: CareerRow; list: RankListSlug } | null>(null);
  const rows = board.isPlaceholderData ? [] : board.data ?? [];
  const tiles = useMemo(() => [...(progress.data ?? [])].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity)), [progress.data]);
  const { top, pinned } = raceRows(rows, viewerId);
  const loading = board.isPending || board.isPlaceholderData;
  useSectionReady('race', !loading && !progress.isPending);
  return <>
    {loading ? <YourHundredShell /> : board.isError ? <section className="t100-race"><div className="t100-head"><SectionHead tone="quiet" kicker="Your hundred" title="The race" /></div><div className="t100-retry">Could not load the race. <Button variant="ghost" onClick={() => board.refetch()}>Retry</Button></div></section> : rows.length > 0 ? <section className="t100-race" data-top100-race>
      <div className="t100-head"><SectionHead tone="quiet" kicker="Your hundred" title="The race" /></div>
      <HundredYou rows={rows} slab={hundredSlab(rows, viewerId)} list={RANK_SCOPE_LABEL[list]} listLength={total} leaderValue={Number(rows[0]?.value ?? 0)} />
      {progress.isPending ? <div className="t100-rail-pending" aria-hidden /> : tiles.length > 0 ? <HundredRail key={list} tiles={tiles} onOpenCourse={onOpenCourse} /> : null}
      <div className="t100-rows">{top.map((r, i) => <HundredRaceRow key={r.user_id} row={r} viewerId={viewerId} total={total} previousViewer={i > 0 && Boolean(top[i - 1].is_viewer || top[i - 1].user_id === viewerId)} onPress={() => setMember({ row: r, list })} />)}
        {pinned ? <><div className="t100-break" aria-hidden>···</div><HundredRaceRow row={pinned} viewerId={viewerId} total={total} onPress={() => setMember({ row: pinned, list })} /></> : null}
      </div>
      {rows.length > 3 ? <button type="button" className="t100-see" onClick={() => setAll(true)}>{t('amateur.leaderboards.seeAllMembers')}<ChevronRight size={12} /></button> : null}
    </section> : null}
    {all ? <Top100RaceSeeAll viewerId={viewerId} initialList={list} initialTotal={total} onClose={() => setAll(false)} onMember={(row, scope) => { setAll(false); setMember({ row, list: scope }); }} /> : null}
    {member ? <Top100ListProgressSheet open onClose={() => setMember(null)} listSlug={member.list} ownerUserId={member.row.user_id} ownerName={member.row.display_name || t('discover.aMember')} ownerPhotoUrl={member.row.photo_url} standing={{ place: member.row.pos, fieldSize: Number(member.row.total_members) }} /> : null}
  </>;
}
function Top100RaceSeeAll({ viewerId, initialList, initialTotal, onClose, onMember }: { viewerId: string; initialList: RankListSlug; initialTotal: number; onClose: () => void; onMember: (row: CareerRow, list: RankListSlug) => void }) {
  const [list, setList] = useState(initialList);
  const board = useTop100Race(viewerId, list);
  const progress = useTop100ListProgress(list, viewerId, viewerId);
  const { t } = useTranslation('courses');
  const rows = board.data ?? [], total = list === initialList ? initialTotal : progress.data?.length ?? 0;
  return <ExploreSheetShell open onClose={onClose} titleId="top100-see-all-title" title={t('amateur.leaderboards.top100')} subtitle={rows.length > 0 ? `${RANK_SCOPE_LABEL[list]} · ${t('amateur.leaderboards.nMembers', { count: Number(rows[0].total_members) })}` : RANK_SCOPE_LABEL[list]} valueHeading={total > 0 ? t('amateur.leaderboards.coursesOfList', { n: total }) : t('amateur.leaderboards.coursesPlayed')} above={<div className="t100-sheet-chips"><RailChips align="center-when-fit" ground="filled-selection" options={(['gb-i', 'global', 'europe', 'usa'] as RankListSlug[]).map(id => ({ id, label: RANK_SCOPE_LABEL[id] }))} value={list} onChange={next => setList(next as RankListSlug)} ariaLabel={t('amateur.leaderboards.top100List')} /></div>}>
    <div className="t100-rows">{rows.map((r, i) => <HundredRaceRow key={r.user_id} row={r} viewerId={viewerId} total={total} previousViewer={i > 0 && Boolean(rows[i - 1].is_viewer || rows[i - 1].user_id === viewerId)} onPress={() => onMember(r, list)} />)}</div>
  </ExploreSheetShell>;
}