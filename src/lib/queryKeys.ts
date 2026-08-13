/**
 * ═══════════════════════════════════════════════════════════════════════════
 * QUERY KEY FACTORY — the only place a react-query key is named.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * THE RULE
 *   A query key states the IDENTITY OF THE ANSWER, not the shape of the
 *   request. Every input that can change the answer belongs in the key.
 *   Nothing that merely describes how this render happened to batch its
 *   fetch belongs in it.
 *
 * THE TWO TESTS
 *   1. VIEWER TEST — if two members can get different answers, the viewer id
 *      is in the key. No exceptions for `enabled: false`; a disabled read is
 *      still a cache read, and a key without an identity will happily match
 *      an entry another identity populated. This is about ACCOUNT SWITCHING
 *      and shared-key collisions, and nothing else. Read the warning below.
 *   2. REACHABILITY TEST — if the same logical answer can sit under two
 *      different key values, the key contains request shape. Remove it.
 *      A key derived from `JSON.stringify(rows)` or any row CONTENT fails this
 *      test. An id-set DIGEST does not: it is the identity of the answer for a
 *      batched read, because a different id set is a different answer. What
 *      the digest costs is a fetch when the set changes, and that is exactly
 *      what `keepPreviousData` + `useMergedBatch` absorb. Use `batchKey()`
 *      with `batchDigest(ids)`.

 *
 * ══ WHAT A KEY CAN NEVER CATCH — READ BEFORE DELETING A RENDER GUARD ══
 *
 * This factory addresses TWO defect classes: a key missing an input (viewer
 * test) and a key carrying request shape (reachability test). There is a
 * THIRD class it does NOT and CANNOT address: rendering another member's data
 * because a component read a viewer-scoped query on someone else's page.
 *
 *   `gam_user_courses` resolves `auth.uid()` server-side, so its key can only
 *   ever carry the VIEWER's id — never the profile being viewed. On another
 *   member's page it resolves to exactly the key the app-wide provider has
 *   already populated, so the read HITS. Correctly. With correct data. For
 *   the wrong page. Adding the viewer id to that key fixed account switching
 *   and nothing else.
 *
 * What prevents that leak is the RENDER GUARD, in the component:
 *   - `src/pages/ProfilePageV2.tsx`      → `if (!isSelf) return null`
 *   - `src/components/profile/courses/ProfileCoursesTab.tsx`
 *                                        → `if (!isOwnProfile) return m`
 *
 * Those two lines are LOAD-BEARING, not defence in depth. They are the only
 * thing standing between a viewer-scoped cache hit and one member's rounds
 * appearing on every profile. Do not delete them as redundant because keys
 * are now centralised here — no key builder in this file can replace them.
 * A key describes what data IS; only the component knows WHOSE PAGE it is on.
 *
 * ══ WRITERS USE THESE BUILDERS TOO ══
 *
 * `setQueryData`, `invalidateQueries` and `cancelQueries` MUST name their key
 * through the same builder as the read. A write that reconstructs the key by
 * hand drifts the moment the read's key changes — and an optimistic write to
 * a key nobody is subscribed to fails SILENTLY, which is the hardest version
 * of this bug to see. If you add a builder, both sides call it.
 *
 * ══ THE BATCH IDIOM ══
 *
 * For "one read for the whole visible page" hooks (feed enrichment, comment
 * enrichment, Top 100 enrichment), the key is:
 *
 *     batchKey(domain, scope, viewerId, batchDigest(ids))
 *
 * paired with `placeholderData: keepPreviousData` and a MERGE of the new
 * result over the previous map (see `useMergedBatch` in `./batchQuery`).
 *   - `scope`   what the list IS (feed variant, profile actor, target id)
 *   - `viewerId` the viewer test, satisfied
 *   - `digest`  `batchDigest(ids)` — the SORTED, DE-DUPLICATED id set the
 *               request will actually ask about, compressed to
 *               `<count>:<hash>` so a 20-row page does not produce a
 *               700-character key
 *
 * A COUNT IS NOT A VALID MARKER. This used to read `loadedCount`, and that is
 * the defect BRIEF_ROUND_POST_HOLLOW_CARD was written about: any refetch
 * returning the SAME NUMBER of rows with a DIFFERENT id set hits the same
 * cache entry, is served the old map, and the new rows' data is never
 * requested. Worse, a cache hit is not `isPending`, so every "settled" test
 * built on the query reports done while the map is incomplete, and the UI
 * shows neither data nor a waiting state. Membership changes without the
 * count moving on pull-to-refresh, on a new row arriving at the top, and on a
 * delete-and-replace. Key on the digest.
 *
 * Residual, and it is accepted deliberately: rows on a NEWLY loaded page have
 * no entry until the fetch resolves, so their block grows in. `keepPreviousData`
 * plus `mergeOverPrevious` keep every already-resolved row on screen while the
 * new digest fetches, so nothing that was rendered unmounts. Do NOT "fix" the
 * grow-in by reserving a min-height for un-fetched rows — that reintroduces a
 * height guess for exactly the rows whose height is unknown.
 *
 * ══ SCALARS ONLY ══
 *
 * Every builder parameter is a scalar by TYPE. An id array is therefore not
 * expressible as a key argument — it enters as `batchDigest(ids)`.
 */

/** The only value types allowed in a key segment. */
export type KeySegment = string | number | boolean | null;

/**
 * Viewer identity for a key. `'anon'` is a legitimate identity — a signed-out
 * viewer's answer is a real answer and gets its own cache entry. What is NOT
 * allowed is `undefined` silently collapsing every member onto one key.
 */
export type ViewerId = string;

/** Normalise a possibly-absent session id into a viewer identity segment. */
export function viewerId(id: string | null | undefined): ViewerId {
  return id ?? 'anon';
}

/**
 * Compress an id SET into one short key segment: `<count>:<hash>`.
 *
 * The ids must already be the exact set the request will ask about; callers
 * sort and de-duplicate before this (order-independence matters — the same set
 * in a different order is the same answer). FNV-1a, non-cryptographic, no
 * dependency. The count is kept in front of the hash so a key is readable in
 * devtools and so two different sets of different sizes can never collide.
 */
export function batchDigest(ids: readonly string[]): string {
  if (ids.length === 0) return 'none';
  let h = 0x811c9dc5;
  const joined = ids.join(',');
  for (let i = 0; i < joined.length; i++) {
    h ^= joined.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `${ids.length}:${(h >>> 0).toString(36)}`;
}

/**
 * The batch idiom key. See THE BATCH IDIOM above.
 *
 * @param domain stable domain name, e.g. 'post-rounds'
 * @param scope  what the list is — NEVER derived from row contents
 * @param viewer viewer identity (`viewerId(user?.id)`)
 * @param digest `batchDigest(ids)` for the id set being requested
 */
export function batchKey(
  domain: string,
  scope: string,
  viewer: ViewerId,
  digest: string,
): readonly KeySegment[] {
  return [domain, scope, viewer, digest] as const;
}

/* ───────────────────────── Clubhouse feed batches ───────────────────────── */

export const feedKeys = {
  /** post_id -> whs_score_id for the loaded page. */
  postScoreIds: (scope: string, viewer: ViewerId, digest: string) =>
    batchKey('post-score-ids', scope, viewer, digest),

  /** whs_score_id -> round stats + hole shape for the loaded page. */
  postRounds: (scope: string, viewer: ViewerId, digest: string) =>
    batchKey('post-rounds', scope, viewer, digest),

  /**
   * course_id -> community + viewer course context for the loaded page.
   * Viewer-scoped: `your_rounds` / `your_best` come back per identity.
   */
  postCourseContext: (scope: string, viewer: ViewerId, digest: string) =>
    batchKey('post-course-context', scope, viewer, digest),
} as const;


/* ─────────────────────────────── Comments v2 ─────────────────────────────── */

/**
 * Comments scope: the target being commented on. Everything a comment thread
 * loads is identified by this plus the viewer's active actor.
 */
export function commentsScope(
  targetType: string,
  targetId: string,
  targetSecondaryId: string | null,
): string {
  return `${targetType}:${targetId}:${targetSecondaryId ?? '-'}`;
}

export const commentsKeys = {
  /** Root prefix — safe for `invalidateQueries` / `cancelQueries`. */
  root: (scope: string) => ['comments-v2', scope] as const,

  /** Paginated top-level comments. */
  pages: (scope: string) => ['comments-v2', scope, 'pages'] as const,

  /** Total top-level count for the header. */
  count: (scope: string) => ['comments-v2', scope, 'count'] as const,

  /**
   * Replies for the loaded parents. Batch idiom: keyed on how many parents
   * are loaded, never on which ones.
   */
  replies: (scope: string, viewer: ViewerId, loadedParents: number) =>
    ['comments-v2', scope, 'replies', viewer, loadedParents] as const,

  /**
   * Actor + like enrichment for parents + replies. Batch idiom, and the key
   * BOTH the read and the optimistic like write name — see WRITERS above.
   */
  enrichment: (
    scope: string,
    actorType: string,
    actorId: string,
    loadedRows: number,
  ) => ['comments-v2', scope, 'enrichment', actorType, actorId, loadedRows] as const,

  /** The viewer's hidden comment ids. */
  hidden: (viewer: ViewerId) => ['comments-v2-hidden', viewer] as const,
} as const;

/* ───────────────────────── Top 100 enrichment ──────────────────────────── */

export const top100Keys = {
  /** Batched Top 100 card enrichment for the loaded page set. */
  enrichment: (scope: string, viewer: ViewerId, digest: string) =>
    batchKey('top100-enrichment', scope, viewer, digest),

} as const;

/* ─────────────────────────────── Discover ─────────────────────────────── */

export const discoverKeys = {
  /**
   * Personal Bests (BRIEF_PERSONAL_BESTS_SECTION §5.1). Viewer-scoped: the RPC
   * is SECURITY INVOKER and resolves the viewer's friends server-side, so two
   * members get different answers from identical parameters. Three scalars, no
   * array-derived material.
   */
  personalBests: (
    viewer: ViewerId,
    days: number,
    limit: number,
    perMember: number,
  ) => ['discover', 'personal-bests', viewer, days, limit, perMember] as const,
} as const;
