/**
 * H4 - hole photo moderation queue.
 *
 * Reads public.course_hole_media for the admin Inbox and performs the
 * approve / reject / replace transitions. No schema or policy changes:
 * chm_admin_update already permits status changes for is_admin().
 */
import { supabase } from '@/integrations/supabase/client';

export type HolePhotoStatus = 'pending' | 'approved' | 'rejected';

export const HOLE_PHOTO_REJECT_REASONS = [
  'not_a_golf_hole',
  'wrong_hole',
  'poor_quality',
  'not_your_photo',
  'other',
] as const;

export type HolePhotoRejectReason = (typeof HOLE_PHOTO_REJECT_REASONS)[number] | 'replaced';

export const holePhotoReasonLabel = (code: string | null): string => {
  switch (code) {
    case 'not_a_golf_hole': return 'Not a golf hole';
    case 'wrong_hole': return 'Wrong hole';
    case 'poor_quality': return 'Poor quality';
    case 'not_your_photo': return 'Not your photo';
    case 'replaced': return 'Replaced by another photo';
    case 'other': return 'Other';
    default: return 'No reason recorded';
  }
};

/** Plain-language line sent to the contributor. Never the raw code. */
const memberReasonSentence = (code: string | null, note: string | null): string => {
  switch (code) {
    case 'not_a_golf_hole':
      return 'The photo did not show a golf hole.';
    case 'wrong_hole':
      return 'The photo did not appear to be the hole it was submitted for.';
    case 'poor_quality':
      return 'The photo was not clear enough to use.';
    case 'not_your_photo':
      return 'We could not confirm the photo was taken by you.';
    case 'replaced':
      return 'Another photo is now live on this hole.';
    default:
      return note?.trim() || 'The photo was not a fit for this hole.';
  }
};

export interface HolePhotoQueueRow {
  id: string;
  course_id: string;
  hole_no: number;
  user_id: string;
  media_url: string;
  width: number | null;
  height: number | null;
  status: HolePhotoStatus;
  reject_reason: string | null;
  proof_score_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  auto_verdict: string | null;
  auto_confidence: number | null;
  auto_notes: string | null;
  courseName: string | null;
  courseThumbnail: string | null;
  contributorName: string | null;
}

const COLS =
  'id, course_id, hole_no, user_id, media_url, width, height, status, reject_reason, proof_score_id, created_at, reviewed_at, auto_verdict, auto_confidence, auto_notes';

const sb: any = supabase;

async function decorate(rows: any[]): Promise<HolePhotoQueueRow[]> {
  if (!rows.length) return [];
  const courseIds = Array.from(new Set(rows.map((r) => r.course_id).filter(Boolean)));
  const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));

  const [{ data: courses }, { data: profiles }] = await Promise.all([
    sb.from('golf_courses').select('id, name, thumbnail_image').in('id', courseIds),
    sb.from('user_profiles').select('id, display_name, username').in('id', userIds),
  ]);

  const courseMap = new Map((courses ?? []).map((c: any) => [c.id, c]));
  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  return rows.map((r) => {
    const c: any = courseMap.get(r.course_id);
    const p: any = profileMap.get(r.user_id);
    return {
      ...r,
      courseName: c?.name ?? null,
      courseThumbnail: c?.thumbnail_image ?? null,
      contributorName: p?.display_name || p?.username || null,
    } as HolePhotoQueueRow;
  });
}

/** Open queue: pending submissions, oldest first. */
export async function fetchHolePhotosOpen(): Promise<HolePhotoQueueRow[]> {
  const { data, error } = await sb
    .from('course_hole_media')
    .select(COLS)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw error;
  return decorate(data ?? []);
}

/** Closed queue: recently reviewed rows, newest first, capped at 20. */
export async function fetchHolePhotosDone(): Promise<HolePhotoQueueRow[]> {
  const { data, error } = await sb
    .from('course_hole_media')
    .select(COLS)
    .in('status', ['approved', 'rejected'])
    .not('reviewed_at', 'is', null)
    .order('reviewed_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return decorate(data ?? []);
}

/** The photo currently live on a hole, if any. */
export async function fetchLiveHolePhoto(
  courseId: string,
  holeNo: number,
): Promise<HolePhotoQueueRow | null> {
  const { data, error } = await sb
    .from('course_hole_media')
    .select(COLS)
    .eq('course_id', courseId)
    .eq('hole_no', holeNo)
    .eq('status', 'approved')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [row] = await decorate([data]);
  return row ?? null;
}

export interface ProofRound {
  found: boolean;
  playDate: string | null;
  par: number | null;
}

/**
 * The logged round backing the submission, plus the par the member played on
 * that hole. Absent proof is shown as absent - never invented.
 */
export async function fetchProofRound(
  proofScoreId: string | null,
  holeNo?: number,
): Promise<ProofRound> {
  if (!proofScoreId) return { found: false, playDate: null, par: null };
  const { data, error } = await sb
    .from('whs_scores')
    .select('id, play_date')
    .eq('id', proofScoreId)
    .maybeSingle();
  if (error || !data) return { found: false, playDate: null, par: null };

  let par: number | null = null;
  if (typeof holeNo === 'number') {
    const { data: hole } = await sb
      .from('whs_score_holes')
      .select('par')
      .eq('score_id', proofScoreId)
      .eq('hole_no', holeNo)
      .maybeSingle();
    par = (hole as any)?.par ?? null;
  }
  return { found: true, playDate: (data as any).play_date ?? null, par };
}


async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

/**
 * Contributor notification - same channel appeals and admin approvals use:
 * a direct row in public.notifications with type 'moderation'.
 */
async function notifyContributor(
  userId: string,
  title: string,
  message: string,
  row: Pick<HolePhotoQueueRow, 'id' | 'course_id' | 'hole_no'>,
) {
  try {
    const adminId = await currentUserId();
    await sb.from('notifications').insert({
      user_id: userId,
      recipient_actor_type: 'user',
      recipient_actor_id: userId,
      actor_id: adminId,
      type: 'moderation',
      title,
      message,
      entity_type: 'course_hole_media',
      entity_id: row.id,
      data: {
        course_id: row.course_id,
        hole_no: row.hole_no,
        link: `/course/${row.course_id}?tab=course&hole=${row.hole_no}`,
      },
    });
  } catch (e) {
    console.warn('[hole-photos] notify failed', e);
  }
}

/** Approve. Multiple approved photos per hole are permitted. */
export async function approveHolePhoto(row: HolePhotoQueueRow): Promise<void> {
  const adminId = await currentUserId();
  const { error } = await sb
    .from('course_hole_media')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      reject_reason: null,
    })
    .eq('id', row.id);

  if (error) throw error;


  await notifyContributor(
    row.user_id,
    'Your hole photo is live',
    `Your photo of hole ${row.hole_no} at ${row.courseName ?? 'the course'} is now on the hole.`,
    row,
  );
}

/** Reject with a coded reason. 'other' carries the moderator's note. */
export async function rejectHolePhoto(
  row: HolePhotoQueueRow,
  reason: HolePhotoRejectReason,
  note?: string,
): Promise<void> {
  const adminId = await currentUserId();
  const { error } = await sb
    .from('course_hole_media')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      reject_reason: reason,
    })
    .eq('id', row.id);
  if (error) throw error;

  const where = `hole ${row.hole_no} at ${row.courseName ?? 'the course'}`;
  await notifyContributor(
    row.user_id,
    reason === 'replaced' ? 'Your hole photo was replaced' : 'Your hole photo was not used',
    `${memberReasonSentence(reason, note ?? null)} (${where})`,
    row,
  );
}

/** Unseat the live photo on a hole so another can take its place. */
export async function removeLiveHolePhoto(row: HolePhotoQueueRow): Promise<void> {
  await rejectHolePhoto(row, 'replaced');
}
