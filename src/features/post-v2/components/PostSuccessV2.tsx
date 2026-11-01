// PostSuccessV2 - immersive overlay confirming a post outcome.
//
// BRIEF_POST_COMPOSER_DARK §2. The posting and posted states are ONE
// composition: the post rendered AS A CARD (option A), centred in the shell,
// with the status beneath it. The posted state is that same card RESOLVING —
// the scrims clear and the accent moves from amber to green. Nothing about
// the shell changed: it still owns z-order, the accent radial, the status bar
// and tap-to-close.
//
// Variants:
//   - 'uploading' (media in flight): the card, scrimmed, with an honest
//     eyebrow (see honestEyebrow). Phase-driven: running / complete / failed.
//   - 'scheduled' (text-only or media): calendar glyph confirmation.
//   - 'published' (text-only, and the edit-save path): the card, resolved.
//   - media posts ALSO land on PostedScreen once the upload job completes
//     (phase === 'complete' below). That is the moment the pending-posts store
//     revokes the composer's blob URLs, which is why this screen owns its own
//     object URLs (see PostCard) instead of borrowing the composer's.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Clock, AlertTriangle, MapPin, Users, Image as ImageIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { SubmitResult } from '../hooks/usePostSubmit';
import { formatScheduleTime } from '../lib/formatSchedule';
import { datedSchedule, scheduleDayKey } from '../lib/postFlowRules';
import { Button } from '@/components/ui/button';
import { useClubhouseShare } from '@/components/clubhouse/hooks/useClubhouseShare';
import { buildDraftFeedPost } from './golf/PostPreview';
import '@/styles/post-flow.css';
import { extractPoster, getCachedPoster } from '../lib/videoPoster';
import { PlayGlyph } from './SlideThumb';
import { subscribeToJob, getJobSnapshot } from '../lib/postUploadController';
import type { UploadJobSnapshot } from '../lib/postUploadController';
import { ImmersiveSuccessShell } from './ImmersiveSuccessShell';
import { CT, CT_DARK } from '@/features/_shared/composerTokens';
import { COMPOSER_SHELL_SURFACE, inkWithAlpha, surfaceWithAlpha } from '@/lib/tokens/surfaces';
import { SURFACE } from '@/lib/tokens/surface';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { MentionText } from '@/components/mentions/MentionText';

/** Green remains the existing successful-state accent; neutral is opt-in so
 * review callers of ImmersiveSuccessShell retain their existing defaults. */
const GREEN_ON_DARK = CT.successOnDark;
const NEUTRAL = 'rgba(255,255,255,0.5)';
interface Props { result: SubmitResult; onDone: () => void; onViewPost?: () => void; onOpenScheduled?: () => void }
export default function PostSuccessV2(props: Props) {
  const hasCard = !!(props.result.mediaPreviews?.length || props.result.caption?.trim() || props.result.actorName);
  useEffect(() => {
    if (props.result.kind !== 'published' || hasCard) return;
    const id = window.setTimeout(props.onDone, 2200);
    return () => window.clearTimeout(id);
  }, [props.result.kind, hasCard, props.onDone]);
  if (props.result.kind === 'uploading') return <UploadingState {...props} />;
  if (props.result.kind === 'scheduled') return <ScheduledScreen {...props} />;
  return <PostedScreen {...props} />;
}
function PostedScreen({result,onDone,onViewPost}:Props) {
  const {t}=useTranslation(['composer','common']);
  const {handleShare}=useClubhouseShare(undefined);
  const hasCard=!!(result.mediaPreviews?.length || result.caption?.trim() || result.actorName);
  if(!hasCard) return <ImmersiveSuccessShell accent={GREEN_ON_DARK} onTapClose={onDone} showTapHint><Column><Label>{t('composer:success.posted')}</Label><Copy>{t('composer:success.postedBody')}</Copy></Column></ImmersiveSuccessShell>;
  const names=(result.playedWithNames??[]).map(n=>n.trim().split(/\s+/)[0]).filter(Boolean);
  const people=names.length===1?names[0]:names.length===2?t('composer:postFlow.twoNames',{first:names[0],second:names[1]}):names.length>2?t('composer:postFlow.otherNames',{first:names[0],count:names.length-1}):null;
  const tags=result.holeTags??[];
  const share=()=>{const post=buildDraftFeedPost({caption:result.caption??'',media:[],course:null,actor:{id:result.actorId??'',type:'personal',name:result.actorName??'',avatarUrl:result.actorAvatarUrl??null,username:null},userId:''});handleShare({...post,id:result.postId});};
  const grouped=[...new Set(tags.map(tag=>tag.courseId))].map(id=>tags.filter(tag=>tag.courseId===id));
  return <ImmersiveSuccessShell accent={GREEN_ON_DARK} onTapClose={onDone}>
    <div className="pf pf-success"><PostCard result={result} completedFiles={result.mediaPreviews?.length??0} resolved/>
      <div className="pf-kicker pf-live"><i className="pf-dot"/>{t('composer:postFlow.live')}</div><h2 className="pf-headline">{t('composer:success.posted')}</h2>
      <div className="pf-facts">
        {result.courseName&&<Fact icon={<MapPin size={13}/>}>{t('composer:postFlow.taggedAt')} <b>{result.courseName}</b></Fact>}
        {people&&<Fact icon={<Users size={13}/>}><b>{people}</b> {t('composer:postFlow.notified')}</Fact>}
        {tags.length===1?<Fact icon={<ImageIcon size={13}/>}><b>{t('composer:postFlow.holeShots',{count:1})}</b> {t('composer:postFlow.addedHole',{hole:tags[0].hole})}</Fact>:grouped.map(group=>group[0]?<Fact key={group[0].courseId} icon={<ImageIcon size={13}/>}><b>{t('composer:postFlow.holeShots',{count:group.length})}</b> {t('composer:postFlow.addedCourse',{course:group[0].courseName})}</Fact>:null)}
      </div>
      <div className="pf-actions"><Button variant="ghost" className="pf-pill pf-outline" onClick={e=>{e.stopPropagation();share();}}>{t('composer:postFlow.shareLink')}</Button><Button variant="ghost" className="pf-pill" onClick={e=>{e.stopPropagation();onViewPost?.();}}>{t('composer:postFlow.viewPost')}</Button></div>
      <div className="pf-hint">{t('composer:postFlow.tapElsewhere')}</div>
    </div>
  </ImmersiveSuccessShell>;
}
function Fact({icon,children}:{icon:React.ReactNode;children:React.ReactNode}){return <div className="pf-fact"><span className="pf-fact-icon">{icon}</span><span>{children}</span></div>;}
function ScheduledScreen({result,onDone,onOpenScheduled}:Props){
  const {t}=useTranslation('composer');const target=result.scheduledAt?new Date(result.scheduledAt):null;
  const dayKey=target?scheduleDayKey(target,new Date()):null;
  const day=target?(dayKey?t(`postFlow.${dayKey}`):datedSchedule(target)):'';
  const isBest=target&&result.bestHour!=null&&target.getHours()===result.bestHour;
  return <ImmersiveSuccessShell neutralAccent onTapClose={onDone}><div className="pf pf-success">
    <PostCard result={result} completedFiles={result.mediaPreviews?.length??0} resolved mediaHeight={220}/>
    <div className="pf-kicker"><Clock size={13}/>{t('postFlow.scheduled')}</div>
    <h2 className="pf-headline">{target?t('postFlow.scheduledHeadline',{day,time:formatScheduleTime(target)}):t('success.scheduled')}</h2>
    <div className="pf-copy">{isBest&&<>{t('postFlow.bestChosen')} </>}{t('postFlow.scheduledBody')}</div>
    <div className="pf-actions"><Button variant="ghost" className="pf-pill pf-outline" onClick={e=>{e.stopPropagation();onOpenScheduled?.();}}>{t('postFlow.viewScheduled')}</Button><Button variant="ghost" className="pf-pill" onClick={e=>{e.stopPropagation();onDone();}}>{t('postFlow.done')}</Button></div>
  </div></ImmersiveSuccessShell>;
}
function UploadingState(props:Props){
  const {result,onDone}=props;const {t}=useTranslation(['composer','common']);
  const jobId=result.jobId??null;const [snapshot,setSnapshot]=useState<UploadJobSnapshot|null>(()=>jobId?getJobSnapshot(jobId):null);
  useEffect(()=>{if(!jobId)return;return subscribeToJob(jobId,s=>setSnapshot({...s,savedHoleTags:s.savedHoleTags?[...s.savedHoleTags]:undefined}));},[jobId]);
  if(snapshot?.phase==='complete'){
    const confirmed={...result,holeTags:(snapshot.savedHoleTags??[]).flatMap(tag=>{const fact=result.holeTags?.find(f=>f.courseId===tag.courseId&&f.hole===tag.hole);return fact?[fact]:[];})};
    return result.isScheduled?<ScheduledScreen {...props} result={confirmed}/>:<PostedScreen {...props} result={confirmed}/>;
  }
  if(snapshot?.phase==='failed') return <ImmersiveSuccessShell onTapClose={onDone}><Column><GlyphTile accent={NEUTRAL} noGlow><AlertTriangle size={40} color="rgba(255,255,255,0.85)" strokeWidth={2.25}/></GlyphTile><Label>{t('composer:success.uploadFailed')}</Label><Copy>{snapshot.error||t('composer:success.uploadFailedFallback')}</Copy><DonePill onClick={onDone}/></Column></ImmersiveSuccessShell>;
  const items=result.mediaPreviews??[];
  const item=items.find(m=>m.id===snapshot?.currentItemId)??items[snapshot?.completedFiles??0];
  const photos=items.filter(m=>m.type==='image');const photoIndex=item?Math.max(1,photos.findIndex(m=>m.id===item.id)+1):1;
  const stage=snapshot?.stage??'preparing';const pct=Math.max(0,Math.min(100,snapshot?.overallProgress??0));
  const stageText=stage==='preparing'?t('composer:postFlow.preparing'):stage==='publishing'?t('composer:postFlow.processing'):item?.type==='video'?<>{t('composer:postFlow.uploadVideo')} · <b>{t('composer:postFlow.videoBytes',{done:Math.round((snapshot?.bytesUploaded??0)/1000000),total:Math.round((snapshot?.bytesTotal??0)/1000000)})}</b></>:t('composer:postFlow.uploadPhoto',{index:photoIndex,count:photos.length});
  return <ImmersiveSuccessShell neutralAccent onTapClose={onDone}><div className="pf pf-success">
    <PostCard result={result} completedFiles={snapshot?.completedFiles??0}/>
    <div className="pf-kicker"><i className="pf-dot"/>{t('composer:postFlow.posting')}</div>
    <div className="pf-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}><div className="pf-progress-fill" style={{width:`${pct}%`}}/></div>
    <div className="pf-stage pf-num"><span>{stageText}</span><span>{Math.round(pct)}%</span></div>
    <div className="pf-copy">{t('composer:postFlow.background')}</div>
    <div className="pf-actions pf-actions-single"><Button variant="ghost" className="pf-pill pf-outline" onClick={e=>{e.stopPropagation();onDone();}}>{t('composer:postFlow.keepUsing')}</Button></div>
  </div></ImmersiveSuccessShell>;
}

// ---------- the card ----------

const CARD_MAX = 344;
const CELL_GAP = 2;

/**
 * A preview of the post the member just published — NOT a render of the feed
 * card. What is guaranteed: the same caption (parsed through MentionText, so
 * tagged members read as names exactly as in the feed), the same actor, the
 * same course, and the member's own picked files in order. What is not: the
 * media shown is the LOCAL file, not the uploaded/transcoded asset the feed
 * serves, and the layout is this overlay's mosaic, not the feed's carousel.
 *
 * Media ownership: this card creates its own object URLs from the picked
 * Files and revokes them in the memo's cleanup. It never displays a URL owned
 * elsewhere. Items without a File (edit path) have no local preview and are
 * omitted; if none remain the card renders with NO media block.
 *
 * `completedFiles` scrims the cells still in flight; `resolved` clears every
 * scrim regardless.
 */
export function PostCard({ result, completedFiles, resolved, mediaHeight }: { result: SubmitResult; completedFiles: number; resolved?: boolean; mediaHeight?: number }) {
  const owned = useOwnedPreviews(result.mediaPreviews);
  const [failed, setFailed] = useState<ReadonlySet<number>>(() => new Set());
  const previews = owned
    .map((p, i) => ({ ...p, key: i }))
    .filter((p) => !failed.has(p.key));
  const onCellError = (key: number) =>
    setFailed((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  const caption = (result.caption ?? '').trim();
  return (
    <div
      style={{
        width: '100%',
        maxWidth: CARD_MAX,
        background: CT_DARK.elev,
        border: `1px solid ${CT_DARK.line}`,
        borderRadius: 18,
        overflow: 'hidden',
        textAlign: 'left',
      }}
    >
      {previews.length > 0 && (
        <MediaMosaic previews={previews} completedFiles={completedFiles} resolved={resolved} mediaHeight={mediaHeight} onCellError={onCellError} />
      )}

      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {result.actorName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <SquircleAvatar
              src={result.actorAvatarUrl ?? null}
              alt={result.actorName}
              userId={result.actorId ?? null}
              size={26}
              fallback={result.actorName[0]}
              hairlineRing
              ringColor={DARK_HAIRLINE}
            />
            <div style={{ fontSize: 13, fontWeight: 700, color: CT_DARK.ink, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {result.actorName}
            </div>
          </div>
        )}

        {caption.length > 0 && (
          <div
            style={{
              fontSize: 13.5,
              lineHeight: 1.45,
              color: CT_DARK.ink,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            <MentionText text={caption} disableNavigation />
          </div>
        )}

        {result.courseName && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start', border: `1px solid ${CT_DARK.line}`, background: inkWithAlpha(SURFACE.dark.ink, 0.06), borderRadius: 999, padding: '5px 10px' }}>
            <MapPin size={11} color={CT_DARK.mute} strokeWidth={2.5} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: CT_DARK.ink }}>{result.courseName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * §2.2 — THE MOSAIC (option 3). MAX_MEDIA is 10, at most three cells render.
 *   1        one full-width image, no grid, no badge, no +N
 *   2        two cells
 *   3        one large leading cell, two stacked beside it
 *   4+       the same three cells, +N over the last
 * The +N is NOT a progress indicator: it never animates and never counts down.
 */
type OwnedPreviewBase = { id: string; url: string; type: 'image' | 'video'; posterTimestamp?: number | null };
type OwnedPreview = OwnedPreviewBase & { key: number };

/**
 * One owner, one lifetime: object URLs are minted in an effect (not in render,
 * so StrictMode's dev double-render cannot leak an unrevoked set) and revoked
 * in that same effect's cleanup. Keys are the ordinal among File-bearing items,
 * which is exactly the list the upload controller counts `completedFiles`
 * against: create hands it `input.media` (every item has a File) and the edit
 * path hands it only `!existingId && file` items and never renders this card.
 * LAYOUT effect, deliberately (the second time this file pair has needed it):
 * a passive effect paints a first frame with no previews, so the ~430px mosaic
 * appears from nothing and shoves the status block. Do not make it useEffect.
 * The minted url is only the SOURCE; `id` (the stable slide id) is the poster key.
 */
function useOwnedPreviews(list: SubmitResult['mediaPreviews']): OwnedPreviewBase[] {
  const [urls, setUrls] = useState<OwnedPreviewBase[]>([]);
  useLayoutEffect(() => {
    const minted = (list ?? [])
      .filter((m): m is NonNullable<SubmitResult['mediaPreviews']>[number] & { file: File } => Boolean(m.file))
      .map((m) => ({ id: m.id, url: URL.createObjectURL(m.file), type: m.type, posterTimestamp: m.posterTimestamp }));
    setUrls(minted);
    return () => {
      for (const u of minted) {
        try { URL.revokeObjectURL(u.url); } catch { /* ignore */ }
      }
    };
  }, [list]);
  return urls;
}

function MediaMosaic({
  previews,
  completedFiles,
  resolved,
  onCellError,
  mediaHeight,
}: {
  previews: OwnedPreview[];
  completedFiles: number;
  resolved?: boolean;
  onCellError: (key: number) => void;
  mediaHeight?: number;
}) {
  const n = previews.length;
  const visible = previews.slice(0, 3);
  const overflow = n > 3 ? n - 3 : 0;
  const pending = (i: number) => !resolved && previews[i].key >= completedFiles;
  const err = (i: number) => () => onCellError(previews[i].key);

  if (n === 1) {
    return (
      <div style={{ position: 'relative', width: '100%', aspectRatio: mediaHeight ? undefined : '4 / 5', height: mediaHeight, background: '#000' }}>
        <Cell item={visible[0]} live pending={pending(0)} onError={err(0)} />
      </div>
    );
  }

  if (n === 2) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: CELL_GAP, width: '100%', aspectRatio: mediaHeight ? undefined : '4 / 5', height: mediaHeight, background: '#000' }}>
        {visible.map((m, i) => (
          <div key={m.key} style={{ position: 'relative', overflow: 'hidden' }}>
            <Cell item={m} pending={pending(i)} onError={err(i)} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr', gap: CELL_GAP, width: '100%', aspectRatio: mediaHeight ? undefined : '4 / 5', height: mediaHeight, background: '#000' }}>
      <div style={{ gridRow: '1 / span 2', position: 'relative', overflow: 'hidden' }}>
        <Cell item={visible[0]} pending={pending(0)} onError={err(0)} />
      </div>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <Cell item={visible[1]} pending={pending(1)} onError={err(1)} />
      </div>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <Cell item={visible[2]} pending={pending(2)} onError={err(2)} />
        {overflow > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: surfaceWithAlpha(COMPOSER_SHELL_SURFACE, 0.58),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 700,
              color: '#FFFFFF',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * One mosaic cell: the local preview, plus the pending scrim that clears.
 * `live` (the one-cell case only) mounts a playsInline muted loop autoPlay
 * <video>, matching MediaStageV2. Two or more cells use the cached poster
 * frame (videoPoster, as SlideThumb does) — no live <video> per tile. Every
 * video carries the extracted poster so a refused autoplay (iOS Low Power
 * Mode fires no error) still shows a frame. If a poster cannot be extracted
 * the cell shows the neutral tint placeholder, never the black element.
 */
function Cell({ item, pending, onError, live = false }: { item: OwnedPreviewBase; pending: boolean; onError: () => void; live?: boolean }) {
  const reduce = useReducedMotion();
  const isVideo = item.type === 'video';
  const [poster, setPoster] = useState<string | null>(() => (isVideo ? getCachedPoster(item.id) : null));
  useEffect(() => {
    if (!isVideo || poster) return;
    let cancelled = false;
    void extractPoster(item.id, item.url, item.posterTimestamp ?? 0.1).then((u) => { if (!cancelled && u) setPoster(u); });
    return () => { cancelled = true; };
  }, [isVideo, item.id, item.url, item.posterTimestamp, poster]);
  const fill = { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', objectFit: 'cover' as const };
  return (
    <>
      {isVideo ? (
        <>
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: inkWithAlpha(SURFACE.dark.ink, 0.06) }} />
          {live ? (
            <video src={item.url} poster={poster ?? undefined} playsInline muted loop autoPlay onError={onError} style={{ ...fill, background: 'transparent' }} />
          ) : (
            poster && <img src={poster} alt="" style={fill} />
          )}
          {!live && <PlayGlyph size={22} />}
        </>
      ) : (
        <img src={item.url} alt="" onError={onError} style={fill} />
      )}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: pending ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ position: 'absolute', inset: 0, background: surfaceWithAlpha(COMPOSER_SHELL_SURFACE, 0.55), pointerEvents: 'none' }}
      />
    </>
  );
}

// ---------- pieces ----------

function Column({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 20, maxWidth: CARD_MAX, width: '100%', textAlign: 'center',
    }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 21, fontWeight: 700, letterSpacing: '-0.01em',
      color: 'rgba(255,255,255,0.96)', lineHeight: 1.15,
    }}>{children}</div>
  );
}

function Copy({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 13.5, color: 'rgba(255,255,255,0.62)',
      lineHeight: 1.5, maxWidth: 300,
    }}>{children}</div>
  );
}

function DonePill({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation('common');
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        marginTop: 8,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.96)',
        borderRadius: 999,
        padding: '10px 24px',
        fontSize: 13.5,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {t('action.done')}
    </button>
  );
}

function GlyphTile({ accent, noGlow, children }: { accent: string; noGlow?: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      width: 104, height: 104,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: CT.cardRadius,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      filter: noGlow ? undefined : `drop-shadow(0 0 24px ${accent}55) drop-shadow(0 0 8px ${accent}66)`,
    }}>
      {children}
    </div>
  );
}
