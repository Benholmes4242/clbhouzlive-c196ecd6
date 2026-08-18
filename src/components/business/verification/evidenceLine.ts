/**
 * BRIEF_VERIFICATION_PHASE_5B §2 — THE EVIDENCE LINE.
 *
 * One badge, and beneath it in plain words what was actually confirmed. Derived
 * from the APPROVED request's proof_metadata.signals, which Phase 3 populates —
 * no new storage.
 *
 * §2.5 IS ABSOLUTE: a pre-Phase-3 approval has no `signals` object, and we do
 * NOT infer one from the flat legacy columns here. The reviewer drawer may
 * infer (it shows its working); a public profile must never guess. No signals
 * means no line, and the badge stands alone.
 */

export type EvidenceSignalKey = 'domain' | 'document' | 'presence';

/** What each confirmed signal is called in front of a golfer. */
const PHRASE: Record<EvidenceSignalKey, string> = {
  domain: 'domain confirmed',
  document: 'business registered',
  presence: 'listing matched',
};

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/**
 * The signals that actually STAND — the same arithmetic the reviewer saw, so
 * the profile cannot claim more than the drawer credited.
 */
export function confirmedSignals(proofMetadata: unknown): EvidenceSignalKey[] {
  const meta = asObject(proofMetadata);
  const nested = asObject(meta.signals);
  if (Object.keys(nested).length === 0) return []; // §2.5 — pre-Phase-3.

  const domain = asObject(nested.domain);
  const document = asObject(nested.document);
  const presence = asObject(nested.presence);

  const out: EvidenceSignalKey[] = [];
  const domainName = domain.domain ?? null;
  const domainConfirmed = domain.email_verified === true || meta.email_verified === true;
  if (domainName && domainConfirmed && domain.free_provider !== true) out.push('domain');
  if (document.document_path) out.push('document');
  if (presence.value) out.push('presence');
  return out;
}

/**
 * "Verified · domain confirmed, business registered", or null when there is
 * nothing honest to say.
 */
export function evidenceLine(proofMetadata: unknown, verifiedWord = 'Verified'): string | null {
  const signals = confirmedSignals(proofMetadata);
  if (signals.length === 0) return null;
  return `${verifiedWord} \u00B7 ${signals.map((k) => PHRASE[k]).join(', ')}`;
}
