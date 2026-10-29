/** EP3 owns only Edit profile golf presentation. Canonical handicap
 * resolution, home-club picker, coach sheets and AddCourseModal remain shared.
 * Golf saves are isolated: membership uses user_home_clubs, not an invented
 * additional_clubs profile column. Visibility is never part of these patches. */
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, MapPin, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BizcSheet } from '@/features/business-create/BusinessCreateStep3';
import { openHomeClubPicker } from '@/features/home-club/homeClubPickerStore';
import { useHomeClubStatus } from '@/features/home-club/useHomeClubStatus';
import { YourCoachRow, type CoachRowActions } from '@/features/coach/CoachSheets';
import { AddCourseModal } from '@/components/profile/courses/AddCourseModal';
import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';
import { supabase } from '@/integrations/supabase/client';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import { formatHcp, formHcpFromDb } from '@/lib/formatHcp';
import { bodyNameForProvider } from '@/lib/whs/whsCountries';
import type { WhsConnection } from '@/lib/whs/types';
import type { ProfileFormData } from '@/components/profile/profile-wizard/types';
import { syncLabel, validOwnHandicap } from './golfRules';

export type GolfFields = 'handicap' | 'homeClub' | 'additionalClubs';
export type GolfPatch = Partial<Pick<ProfileFormData, 'handicapIndex' | 'homeClubName' | 'primaryClubId' | 'additionalClubs'>>;
interface Props {
  userId: string;
  form: ProfileFormData;
  egHandicapIndex: number | null;
  manualHandicapIndex: number | null;
  connection: WhsConnection | null | undefined;
  onSave: (fields: GolfFields, patch: GolfPatch) => Promise<boolean>;
}

export interface GolfActions { open: (sheet: 'homeClub' | 'handicap' | 'topTen' | 'coach') => void }
export const EditProfileGolf = forwardRef<GolfActions, Props>(function EditProfileGolf(p, ref) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const home = useHomeClubStatus(p.userId);
  const { topTen } = useUserTopTenCourses(p.userId);
  const [sheet, setSheet] = useState<GolfFields | 'topTen' | null>(null);
  const coachRow = useRef<CoachRowActions>(null);
  useImperativeHandle(ref, () => ({ open: key => { if (key === 'coach') coachRow.current?.open(); else if (key === 'homeClub') pick(false); else setSheet(key); } }));
  const [busy, setBusy] = useState(false);
  const close = () => { if (!busy) setSheet(null); };
  const resolved = resolveDisplayHandicap({ egHandicapIndex: p.egHandicapIndex, manualHandicapIndex: p.manualHandicapIndex, hasWhsConnection: !!p.connection });
  const body = bodyNameForProvider(p.connection?.provider);
  const clubs = p.form.additionalClubs;
  const pending = !p.form.primaryClubId && home.state === 'pending' ? home.pendingName : null;
  const save = async (fields: GolfFields, patch: GolfPatch) => {
    if (busy) return false;
    setBusy(true);
    try { return await p.onSave(fields, patch); } finally { setBusy(false); }
  };
  const pick = (additional: boolean) => openHomeClubPicker({ keyboardSearch: true, pendingName: additional ? null : pending, onSelected: club => {
    if (additional) {
      if (club.id === p.form.primaryClubId || clubs.some(c => c.clubId === club.id || c.name === club.name)) return;
      void save('additionalClubs', { additionalClubs: [...clubs, { id: club.id, clubId: club.id, name: club.name }] });
    } else void save('homeClub', { homeClubName: club.name, primaryClubId: club.id });
  } });
  const row = (key: string, label: string, value: React.ReactNode, prompt: boolean, onClick: () => void, tail?: string) => (
    <Button variant="ghost" className="ep-row" data-row={key} onClick={onClick}>
      <span className="ep-row-label">{label}</span><span className={`ep-row-value${prompt ? ' ph' : ''}`} data-testid={`ep-golf-${key}`}>{value}</span>
      {tail && <span className="ep-golf-source">{tail}</span>}<ChevronRight size={18} className="ep-row-chev" aria-hidden="true" />
    </Button>
  );
  return <>
    <div className="ep-group">Your golf</div>
    <div className="ep-rows" data-testid="ep-golf">
      {row('handicap', 'Handicap', resolved.value != null ? <>{formatHcp(resolved.value)}{resolved.source === 'whs' ? ` · ${body}` : <span className="ep-golf-mute"> Your own</span>}</> : 'Connect your handicap', resolved.value == null, () => setSheet('handicap'), resolved.source === 'whs' && resolved.value != null ? 'Synced' : undefined)}
      {row('homeClub', 'Home club', pending ? <>{pending} · <span className="ep-golf-mute">pending</span></> : p.form.homeClubName || 'Add your home club', !pending && !p.form.homeClubName, () => pick(false))}
      {row('additionalClubs', 'Other clubs', clubs.length ? <>{clubs[0]?.name}{clubs.length > 1 && <span className="ep-golf-mute"> +{clubs.length - 1}</span>}</> : 'Add a club', !clubs.length, () => setSheet('additionalClubs'))}
      <YourCoachRow ref={coachRow} viewerId={p.userId} appearance="editProfile" />
      {row('topTen', 'Top 10', topTen.length ? `${topTen.length} of 10 chosen` : 'Pick your ten courses', !topTen.length, () => setSheet('topTen'))}
    </div>
    {sheet === 'handicap' && <HandicapSheet connected={!!p.connection} value={resolved.value} own={p.form.handicapIndex || formHcpFromDb(p.manualHandicapIndex)} body={body} syncedAt={p.connection?.last_synced_at ?? null} busy={busy} onClose={close} onNavigate={path => { close(); navigate(path); }} onSave={async handicapIndex => { if (await save('handicap', { handicapIndex })) setSheet(null); }} />}
    {sheet === 'additionalClubs' && <BizcSheet title="Other clubs" testId="ep-sheet-additionalClubs" onDone={close} actionDisabled={busy}>
      <div className="ep-rows ep-golf-list">{clubs.map(c => <ClubRow key={c.id} id={c.clubId} name={c.name}><Button variant="ghost" size="icon" className="ep-golf-remove" aria-label={`Remove ${c.name}`} disabled={busy} onClick={() => void save('additionalClubs', { additionalClubs: clubs.filter(other => other.id !== c.id) })}><X size={16} /></Button></ClubRow>)}
        <Button variant="ghost" className="ep-golf-add" disabled={busy} onClick={() => pick(true)}><span aria-hidden="true"><Plus size={16} /></span>Add a club</Button>
      </div>
    </BizcSheet>}
    {sheet === 'topTen' && <AddCourseModal userId={p.userId} existingCourseIds={[]} initialTab="manage" onClose={() => { close(); void qc.invalidateQueries({ queryKey: ['user-top-ten-courses', p.userId] }); }} />}
  </>;
});

function HandicapSheet(p: { connected: boolean; value: number | null; own: string; body: string; syncedAt: string | null; busy: boolean; onClose: () => void; onNavigate: (path: string) => void; onSave: (value: string) => Promise<void> }) {
  const [value, setValue] = useState(p.own);
  return <BizcSheet title="Handicap" testId="ep-sheet-handicap" onDone={p.onClose} actionDisabled={p.busy || (!p.connected && !validOwnHandicap(value))} onAction={p.connected ? p.onClose : () => void p.onSave(value)}>
    {p.connected ? <>
      <div className="ep-golf-index"><b className="tabular-nums">{p.value == null ? '—' : formatHcp(p.value)}</b><span>{p.body}{syncLabel(p.syncedAt) && ` · ${syncLabel(p.syncedAt)}`}</span></div>
      <div className="ep-rows ep-golf-list">{[['View full stats', '/handicap'], ['Manage connection', '/manage/handicap']].map(([label, path]) => <Button key={path} variant="ghost" className="ep-row ep-golf-action" onClick={() => p.onNavigate(path)}><span>{label}</span><ChevronRight size={18} className="ep-row-chev" /></Button>)}</div>
    </> : <>
      <div className="ep-golf-connect"><b>Connect your official handicap</b><p>Appear on leaderboards, feature in course Champions, and unlock your full stats.</p><Button variant="ghost" className="ep-golf-connect-button" onClick={() => p.onNavigate('/manage/handicap')}>Connect</Button></div>
      <div className="ep-golf-or">Or</div>
      <label className="bizc-field"><span className="bizc-field-label">Your own handicap</span><input className="bizc-field-input" aria-label="Your own handicap" inputMode="decimal" value={value} placeholder="e.g. 14.2" onChange={e => setValue(e.target.value.replace(/[^0-9.+]/g, ''))} /></label>
      <p className="ep-golf-hint">Shows on your profile as your own figure. Leaderboards and Champions need an official handicap.</p>
    </>}
  </BizcSheet>;
}

function ClubRow({ id, name, children }: { id?: string; name: string; children: React.ReactNode }) {
  const { data } = useQuery({ queryKey: ['ep-club-details', id], enabled: !!id, queryFn: async () => {
    if (!id) return null;
    const [club, course] = await Promise.all([
      supabase.from('golf_clubs').select('region, sub_country').eq('id', id).maybeSingle(),
      supabase.from('golf_courses').select('thumbnail_image').eq('club_id', id).not('thumbnail_image', 'is', null).order('id').limit(1),
    ]);
    return { place: [club.data?.region, club.data?.sub_country].filter(Boolean).join(', '), image: course.data?.[0]?.thumbnail_image };
  } });
  return <div className="ep-golf-club"><span className="ep-golf-thumb" aria-hidden="true">{data?.image ? <img src={data.image} alt="" /> : <MapPin size={18} />}</span><span className="ep-golf-club-text"><b>{name}</b>{data?.place && <small>{data.place}</small>}</span>{children}</div>;
}