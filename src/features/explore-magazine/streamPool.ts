/**
 * THE RANKER'S POOL — the p_view argument get_explore_stream is asked for, and
 * the composition the client fallback builds. NOT the tab strip (ExploreView).
 *
 * The two vocabularies used to be one type. They are split because 'reviews'
 * has no tab but IS a live pool: it feeds the Most helpful reviews rail on All.
 * 'watch' is listed because the page passes its view straight through; on Watch
 * both stream reads are disabled, so no request is ever issued for it.
 * 'watch' is accepted so the call site can pass its view unchanged; it is never requested.
 */
export type StreamPool = 'all' | 'scores' | 'watch' | 'reviews';
