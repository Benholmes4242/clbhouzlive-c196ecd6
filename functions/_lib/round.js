/**
 * Round share card - the meta document for a shared round.
 *
 * ONE BUILDER, TWO ENTRY POINTS: /round/:whsScoreId and /post/:postId when the
 * post is a round post. Nothing is duplicated.
 *
 * THE READ IS AN RPC, NOT TABLE READS. gam_round_stats has no anon policy (its
 * SELECT policies are granted to `authenticated` only), so a crawler reading it
 * with the anon key gets nothing. public.round_share_card(uuid) is a narrow
 * security-definer read gated on the SAME whs_score_publicly_visible()
 * predicate the app's own RLS uses: a private round, a friends-only handicap or
 * a deleted account returns NO ROW, and the caller falls through to the generic
 * clbhouz card. It fails closed - including before the RPC is deployed, when
 * every call returns nothing.
 */

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  metaDocument,
  genericDocument,
  canonicalUrl,
  isUuid,
} from './og.js';

/** True minus for a score under par (U+2212), mirroring toParLabel in the app. */
const MINUS = '\u2212';

/** 'E' at level, '+3' over, a true minus under. Null when there is no par. */
export function toParLabel(gross, par) {
  if (!Number.isFinite(gross) || !Number.isFinite(par)) return null;
  const toPar = gross - par;
  if (toPar === 0) return 'E';
  if (toPar < 0) return `${MINUS}${Math.abs(toPar)}`;
  return `+${toPar}`;
}

function formatDate(value) {
  if (!value) return '';
  try {
    // The play_date is a plain date; parse it as UTC so it cannot drift a day.
    return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return '';
  }
}

/**
 * The tags for a card, from the RPC row. Pure - the tests drive this directly.
 * Returns null whenever the row cannot honestly title a round, so the caller
 * serves the generic card rather than a half-empty one.
 */
export function roundMeta(card) {
  if (!card) return null;
  const gross = Number(card.gross_score);
  if (!Number.isFinite(gross)) return null;

  const player = (card.player_name || '').trim();
  const course = (card.course_name || '').trim();
  if (!player || !course) return null;

  const par = Number(card.course_par);
  const label = toParLabel(gross, par);
  const score = label ? `${gross} (${label})` : `${gross}`;

  const date = formatDate(card.play_date);

  return {
    title: `${player} \u00B7 ${score} at ${course}`,
    description: date ? `${date} on clbhouz` : 'on clbhouz',
    image: card.course_image || undefined,
  };
}

/** The anon RPC read. Returns the row, or null on any failure. */
export async function fetchRoundShareCard(scoreId) {
  if (!isUuid(scoreId)) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/round_share_card`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ p_score_id: scoreId }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const row = Array.isArray(json) ? json[0] : json;
    return row && typeof row === 'object' ? row : null;
  } catch {
    return null;
  }
}

/**
 * The round document for a score id, or the generic card when the round is not
 * publicly viewable / does not exist. Same caching, same fallback and same
 * image handling as the other preview Functions (metaDocument owns all three).
 *
 * opts.image, when given, leads the image chain - that is the generated round
 * share-card PNG the /post route already looks for.
 */
export async function roundDocument(request, scoreId, opts = {}) {
  const card = await fetchRoundShareCard(scoreId);
  const meta = roundMeta(card);
  if (!meta) return genericDocument(request);

  return metaDocument({
    title: meta.title,
    description: meta.description,
    image: opts.image || meta.image,
    type: 'article',
    url: canonicalUrl(request),
  });
}
