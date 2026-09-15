/**
 * isRoundPost — THE ONE CLIENT DEFINITION OF "THIS IS A ROUND POST".
 *
 * Rounds are still created (create_round_posts keeps running, because likes and
 * comments hang off those rows), but they have no home in the Clubhouse feed.
 * Every surface that counts or lists member posts therefore has to be able to
 * say "not this one" the SAME way. Inline `post_type === 'round'` checks are how
 * one surface drifts from another, so there is exactly one predicate and one
 * constant, and both live here.
 *
 * MEANING: post_type = 'round', the same meaning as the deployed SQL function
 * public.post_is_round(). NOTE the deployed function actually tests
 * `whs_score_id IS NOT NULL`; for every row create_round_posts writes the two
 * are equivalent (it sets post_type = 'round' AND whs_score_id together), but a
 * hand-written post that carried a score id without the type would disagree.
 * post_type is the column the brief names, so post_type is what this reads.
 */

export const ROUND_POST_TYPE = 'round';

/** Anything carrying a post_type, in either snake or camel form. */
export interface MaybeRoundPost {
  post_type?: string | null;
  postType?: string | null;
}

export function isRoundPost(post: MaybeRoundPost | null | undefined): boolean {
  if (!post) return false;
  const type = post.post_type ?? post.postType ?? null;
  return type === ROUND_POST_TYPE;
}
