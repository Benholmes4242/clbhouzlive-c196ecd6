/** CB108: club profile section 6, "From the club". Last on a club page.
 * The club's posts render through the existing PostsTabContent in the
 * mediaFirst FeedCard layout, full bleed, with no filter chip. The count
 * reads useBusinessPostsCount and is hidden at 0 or unknown. Empty states:
 * a team member who can post (hero + gate) sees the Post pill; everyone else
 * sees the follow invitation.
 */
import PostsTabContent from '@/components/posts-tab/PostsTabContent';
import { courseActivityClubName } from '@/features/courses/_shared/courseLabel';

const INK = '#F8FAFC';

export function ClubFromTheClub({ businessId, businessName, postsCount, isOwner, onPost }: {
  businessId: string; businessName: string; postsCount?: number | null; isOwner: boolean; onPost?: () => void;
}) {
  const empty = (
    <div data-club-feed-empty style={{ background: '#17171B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 16, margin: '0 16px 14px' }}>
      <div style={{ fontSize: 14, lineHeight: 1.45, color: 'rgba(248,250,252,0.62)' }}>
        {onPost
          ? "Your first post shows here and in your followers' Clubhouse feeds."
          : `${courseActivityClubName(businessName)} hasn't posted yet. Follow to see the first one in your Clubhouse feed.`}
      </div>
      {onPost && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="button" data-club-feed-post onClick={onPost}
            style={{ display: 'inline-flex', alignItems: 'center', height: 34, padding: '0 14px', borderRadius: 999, fontSize: 13.5, fontWeight: 600,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: INK, whiteSpace: 'nowrap', cursor: 'pointer' }}>
            Post
          </button>
        </div>
      )}
    </div>
  );
  return (
    <section data-club-feed aria-label="From the club">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '26px 18px 12px' }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.62)' }}>From the club</span>
        {!!postsCount && postsCount > 0 && (
          <span data-club-feed-count style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.42)' }}>
            {postsCount === 1 ? '1 post' : `${postsCount} posts`}
          </span>
        )}
      </div>
      <PostsTabContent actorType="business" actorId={businessId} isOwnProfile={isOwner} businessName={businessName}
        layout="mediaFirst" hideFilter emptyOverride={empty} />
    </section>
  );
}
