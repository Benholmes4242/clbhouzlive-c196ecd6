/** Brief 31/34: server-owned displayed ten (get_top_ten_block); Manage retains the curation hook.
 * Brief 34 draws it as the Courses-page countdown rail through the shared TenRailCard, with the
 * Brief 31 band (TenBand) under the ticks; Brief 38 moved the rail body into shared TenRail. Ranks are real positions; no placeholder cards.
 * Owner invitations below three entries and share/export geometry stay unchanged. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { TopTenShareSheet } from '@/components/profile/hero/topTenShare/TopTenShareSheet';
import { numberWord } from '@/lib/text/numbers';
import { formatListRank, type ListRank } from '@/lib/courses/listRank';
import { Button } from '@/components/ui/button';
import { TenRail } from '@/components/topTen/TenRail';
import { SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';
import '@/styles/clbhouz-ten.css';
import '@/styles/top-ten.css';
import { useTenBlock } from '@/components/topTen/useTenBlocks';
const Word = (n: number) => numberWord(n);
const SLOT_DASH = 'rgba(248,250,252,0.26)';
const SLOT_NEXT = 'rgba(248,250,252,0.55)';
export const ownerScoreLabel = (ownerName: string | null | undefined): string | null => {
  const name = ownerName?.trim() ?? '';
  if (!name) return null;
  return name.length > 9 ? `${name.slice(0, 8)}…` : name;
};

const regionOf = (c: { sub_country?: string | null; region?: string | null; country?: string | null }) =>

  c.sub_country || c.region || c.country || null;

/**
 * Region + ranks as ONE line where only the region truncates (BRIEF_TOP_TEN_TILE_WIDTH).
 * The region shrinks and ellipsises; the ranks never cut while there is a region left
 * to shorten ("Northern Irel... · Global #10 · GB&I #5"), and only as a last resort
 * ellipsis themselves. Ranks come from useCourseListRanks — never the legacy rank
 * columns. Renders null when neither part exists, so callers keep their
 * "no line, no gap" behaviour. The call site owns the typography (size, weight,
 * colour, marginTop, FIGS) through style.
 */
export const RegionRankLine: React.FC<{
  course: { sub_country?: string | null; region?: string | null; country?: string | null };
  rank: ListRank | undefined;
  style?: React.CSSProperties;
}> = ({ course, rank, style }) => {
  const region = regionOf(course);
  const ranks = formatListRank(rank ?? null);
  if (!region && !ranks) return null;
  return (
    <span style={{ display: 'flex', alignItems: 'baseline', minWidth: 0, whiteSpace: 'nowrap', ...style }}>
      {region && (
        <span style={{ flex: '0 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{region}</span>
      )}
      {ranks && (
        <span style={{ flexShrink: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{region ? ` · ${ranks}` : ranks}</span>
      )}
    </span>
  );
};

export interface TopTenShareIdentity {
  displayName: string;
  avatarUrl?: string | null;
  handicapIndex?: number | null;
  rounds?: number | null;
  rated?: number | null;
}

interface Props {
  userId: string;
  isOwnProfile: boolean;
  onManage?: () => void;
  /** Every add affordance opens the same sheet Manage opens, on its Add tab. */
  onAddCourse?: () => void;
  initialCourseId?: string | null;
  initialCommentId?: string | null;
  initialParentCommentId?: string | null;
  /** Raw user_profiles.top_ten_visibility from the profile row already in memory
   *  (ProfilePageV2 holds it). Never fetched here — BRIEF_..._ROUNDTRIP §1/§4. */
  topTenVisibility?: string | null;
  /** Owner-only share card identity, from figures the profile page already holds. */
  shareIdentity?: TopTenShareIdentity;
  /** Profile owner's first name (falling back to display name) for the visitor sentence. */
  ownerName?: string | null;
}


export const ProfileTopTenRail: React.FC<Props> = ({ userId, isOwnProfile, onManage, onAddCourse, initialCourseId = null, initialCommentId = null, shareIdentity, ownerName }) => {
  const { t } = useTranslation('profile');
  const { user } = useSupabaseSession();
  const query = useTenBlock(userId);
  const [shareOpen, setShareOpen] = React.useState(false);
  const block = query.data;
  const hidden = query.isLoading || query.isError || !block || (!isOwnProfile && block.count < 3);
  const topTen = React.useMemo(() => block ? [...block.courses].sort((a,b) => a.position - b.position) : [], [block]);
  const n = block?.count ?? 0;
  const showRail = !hidden && n >= 3;
  if (hidden || !block) return null;
  const firstName = block.owner.first_name || ownerName || 'Their';
  const title = isOwnProfile ? 'Your top ten courses' : `${firstName}'s top ten courses`;
  const header = <div className="ten-profile-head" style={{ padding: '0 16px' }}>
    <div className="ten-profile-header"><span className="ten-profile-kicker" style={{ ...SECTION_EYEBROW, color: A.INK }}>{t('topTen.kicker', 'Top 10')}</span>{isOwnProfile && onManage && n > 0 && <Button variant="ghost" className="ten-manage" style={SECTION_EYEBROW} onClick={onManage}>{t('topTen.manage', 'Manage')}</Button>}</div>
    <h2 className="ten-profile-title" style={{ ...SECTION_TITLE, marginTop: SECTION_TITLE_GAP }}>{title}</h2>
  </div>;
  const renderInvitation = () => {
    const next = n + 1;
    return (
      <>
        <div style={{ marginTop: 16, fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: A.INK, lineHeight: 1.2, whiteSpace: 'pre-line' }}>
          {n === 0 ? t('topTen.empty.lede', 'Ten courses.\nIn order. Your call.') : t('topTen.progress.lede', { count: n, word: Word(n), left: Word(10 - n), defaultValue: '{{word}} down. {{left}} to go.' })}
        </div>
        <div style={{ marginTop: 7, fontSize: 12.5, fontWeight: 600, color: A.BODY, lineHeight: 1.5 }}>
          {n === 0
            ? t('topTen.empty.body', "It fills itself from the courses you rate, and you don't need a single round on clbhouz to start. Pick the best you have ever played, anywhere, any time.")
            : t('topTen.progress.body', { name: topTen[0].name, defaultValue: '{{name}} is your number one. Add another and they sort themselves by what you score them.' })}
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 5 }}>
          {Array.from({ length: 10 }, (_, i) => {
            const c = topTen[i];
            if (c) {
              return <CourseImageFallback key={i} courseId={c.course_id} courseName={c.name} imageUrl={c.thumbnail_image} style={{ flex: 1, height: 38, borderRadius: 7 }} />;
            }
            const isNext = i === n;
            return (
              <div key={i} style={{ flex: 1, height: 38, borderRadius: 7, border: `1px dashed ${isNext ? SLOT_NEXT : SLOT_DASH}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: isNext ? A.INK : A.DIM, ...FIGS }}>
                {i + 1}
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => onAddCourse?.()}
          style={{ marginTop: 16, width: '100%', borderRadius: 14, padding: '13px 0', background: A.INK, color: A.CANVAS, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          {n === 0 ? t('topTen.empty.cta', 'Start with your number one') : t('topTen.progress.cta', { next, defaultValue: 'Add your number {{next}}' })}
        </button>
      </>
    );
  };

  const shareCourses = topTen.map(c => ({ id: c.course_id, course_id: c.course_id, name: c.name, position: c.position, country: c.country, region: c.region, sub_country: c.sub_country, thumbnail_image: c.thumbnail_image, is_pinned: c.is_pinned, rating: c.member_score }));
  if (!showRail) return <section className="ten-profile-invite-section" style={{ marginTop:16, marginBottom:8, paddingBottom:4 }}>
    {header}
    <div className="ten-profile-invite">{renderInvitation()}</div>
  </section>;
  return <section className="clb-ten ten-profile-rail" data-profile-ten-rail>
    {header}
    <TenRail block={block} signedIn={!!user} openBandOnCourseId={initialCourseId} initialCommentId={initialCommentId}
      hintText={`Swipe for 2 to ${topTen.length}`} pills={!isOwnProfile}
      hintAction={isOwnProfile ? <Button variant="ghost" className="clb-ten-share" onClick={() => setShareOpen(true)}>Share your ten ›</Button> : undefined} />
    {shareOpen && <TopTenShareSheet open={shareOpen} onClose={() => setShareOpen(false)} courses={shareCourses} identity={{ ...(shareIdentity ?? { displayName:block.owner.display_name }), firstName: block.owner.first_name }} />}
  </section>;
};
export default ProfileTopTenRail;
