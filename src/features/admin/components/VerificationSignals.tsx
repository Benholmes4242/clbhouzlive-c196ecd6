/**
 * BRIEF_VERIFICATION_PHASE_4 §1 — THE REVIEWER SEES SIGNALS, NOT A PROOF FIELD.
 *
 * proof_metadata is no longer printable as text. Phase 3 writes a nested
 * `signals` object; this module reads it structurally, states whether the bar is
 * met BEFORE the reviewer forms a view, and keeps everything it does not
 * recognise behind a raw disclosure so a pre-Phase-3 request still renders (§1.4).
 *
 * The bar itself is NOT redefined here — evaluateBar in the applicant's signal
 * module is the single source, so applicant and reviewer read the same verdict.
 */
import React, { useState } from 'react';
import { ChevronDown, FileText, Globe, Radar } from 'lucide-react';
import { evaluateBar, isFreeEmailDomain, type ClaimedSignals, type SignalKey } from '@/components/business/verification/signals';
import { adminTheme as t } from '../theme';
import type { VerificationRow } from '../hooks/useVerifications';

/**
 * BRIEF_REVIEWER_READS_PROVIDED §2 — three states, not two. `not_supplied` is a
 * signal the member ticked and then did not deliver; `not_claimed` was never
 * offered. They mean opposite things and must not share a look.
 */
type SignalState = 'pass' | 'not_supplied' | 'not_claimed';

export interface ResolvedSignal {
  key: SignalKey;
  label: string;
  state: SignalState;
  /** Evidence lines. `href` renders as a working link (§1.1). */
  evidence: { label: string; value: string; href?: string }[];
  /** Set when the applicant claimed the signal but the evidence does not stand. */
  caveat?: string;
  /** Storage path for the document signal, opened via a signed URL. */
  documentPath?: string;
}

const ICONS: Record<SignalKey, React.ElementType> = {
  domain: Globe,
  document: FileText,
  presence: Radar,
};

const LABELS: Record<SignalKey, string> = {
  domain: 'Domain',
  document: 'Document',
  presence: 'Presence',
};

const PRESENCE_KIND_LABEL: Record<string, string> = {
  website: 'Website',
  listing: 'Listing',
  social: 'Social account',
  phone: 'Phone',
};

/** The keys Phase 3 writes and Phase 4 renders structurally. Anything else is raw. */
const RECOGNISED_META_KEYS = new Set([
  'signals', 'claimed_signals', 'bar_met',
  'email', 'email_verified', 'otp_flow',
  'registry_type', 'registry_name', 'registration_number', 'registry_url',
  'presence_kind', 'presence_value',
]);

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function str(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  return String(v);
}

function href(value: string | null, kind?: string): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (kind === 'phone') return `tel:${value.replace(/\s+/g, '')}`;
  if (kind === 'social') return value.startsWith('@') ? undefined : `https://${value}`;
  if (kind === 'website' || kind === 'listing') return `https://${value}`;
  return undefined;
}

/**
 * Resolves the three signals from a request. Phase 3 rows read `signals`;
 * PRE-PHASE-3 ROWS fall back to the flat columns (proof_method / proof_value /
 * domain / proof_document_url) so the drawer never goes blank (§1.4, acceptance I).
 */
export function resolveSignals(row: VerificationRow): {
  signals: ResolvedSignal[];
  claimed: ClaimedSignals;
  legacy: boolean;
} {
  const meta = asObject(row.proofMetadata);
  const nested = asObject(meta.signals);
  const legacy = Object.keys(nested).length === 0;

  const domainMeta = asObject(nested.domain);
  const documentMeta = asObject(nested.document);
  const presenceMeta = asObject(nested.presence);

  /* ── DOMAIN ── */
  const domainEmail = str(domainMeta.email) ?? str(meta.email) ?? (legacy && row.proofMethod === 'business_email' ? str(row.proofValue) : null);
  const domainName = str(domainMeta.domain) ?? str(row.domain) ?? (domainEmail ? domainEmail.split('@')[1] ?? null : null);
  const otpConfirmed = domainMeta.email_verified === true || meta.email_verified === true || row.domainConfirmed === true;
  const freeProvider = domainMeta.free_provider === true || (!!domainEmail && isFreeEmailDomain(domainEmail));
  const domainClaimed = legacy ? !!domainEmail : Object.keys(domainMeta).length > 0;
  const domainPass = domainClaimed && !!domainName && otpConfirmed && !freeProvider;

  const domainEvidence: ResolvedSignal['evidence'] = [];
  if (domainEmail) domainEvidence.push({ label: 'Address', value: domainEmail, href: `mailto:${domainEmail}` });
  if (domainName) domainEvidence.push({ label: 'Domain', value: domainName });
  domainEvidence.push({ label: 'Code confirmed', value: otpConfirmed ? 'Yes' : 'No' });


  /* ── DOCUMENT ── */
  const docPath = str(documentMeta.document_path) ?? str(row.proofDocumentUrl);
  const documentClaimed = legacy ? !!docPath : Object.keys(documentMeta).length > 0;
  const documentPass = documentClaimed && !!docPath;
  const documentEvidence: ResolvedSignal['evidence'] = [];
  const docName = str(documentMeta.document_filename);
  if (docName) documentEvidence.push({ label: 'File', value: docName });
  const registryName = str(documentMeta.registry_name) ?? str(meta.registry_name);
  const registryType = str(documentMeta.registry_type) ?? str(meta.registry_type);
  if (registryName) documentEvidence.push({ label: 'Registry', value: registryName });
  if (registryType) documentEvidence.push({ label: 'Kind', value: registryType });
  const regNumber = str(documentMeta.registration_number) ?? str(meta.registration_number);
  if (regNumber) documentEvidence.push({ label: 'Number', value: regNumber });
  const registryUrl = str(documentMeta.registry_url) ?? str(meta.registry_url);
  if (registryUrl) documentEvidence.push({ label: 'Registry link', value: registryUrl, href: href(registryUrl) });

  /* ── PRESENCE ── */
  const presenceKind = str(presenceMeta.kind) ?? str(meta.presence_kind);
  const presenceValue = str(presenceMeta.value) ?? str(meta.presence_value) ??
    (legacy && (row.proofMethod === 'official_website' || row.proofMethod === 'golf_course' || row.proofMethod === 'creator_business')
      ? str(row.proofValue)
      : null);
  const presenceClaimed = legacy ? !!presenceValue : Object.keys(presenceMeta).length > 0;
  const presencePass = presenceClaimed && !!presenceValue;
  const presenceEvidence: ResolvedSignal['evidence'] = [];
  if (presenceKind) presenceEvidence.push({ label: 'Kind', value: PRESENCE_KIND_LABEL[presenceKind] ?? presenceKind });
  if (presenceValue) presenceEvidence.push({ label: 'Evidence', value: presenceValue, href: href(presenceValue, presenceKind ?? undefined) });

  const signals: ResolvedSignal[] = [
    {
      key: 'domain',
      label: LABELS.domain,
      state: domainPass ? 'pass' : 'not_claimed',
      evidence: domainClaimed ? domainEvidence : [],
      caveat: !domainPass && domainClaimed
        ? freeProvider
          ? 'Claimed, but the address is on a free mailbox provider — not a domain signal.'
          : !otpConfirmed
            ? 'Claimed, but the emailed code was never confirmed.'
            : 'Claimed, but incomplete.'
        : undefined,
    },
    {
      key: 'document',
      label: LABELS.document,
      state: documentPass ? 'pass' : 'not_claimed',
      evidence: documentClaimed ? documentEvidence : [],
      documentPath: docPath ?? undefined,
      caveat: !documentPass && documentClaimed ? 'Claimed, but no file was uploaded.' : undefined,
    },
    {
      key: 'presence',
      label: LABELS.presence,
      state: presencePass ? 'pass' : 'not_claimed',
      evidence: presenceClaimed ? presenceEvidence : [],
      caveat: !presencePass && presenceClaimed ? 'Claimed, but no evidence was given.' : undefined,
    },
  ];

  return {
    signals,
    claimed: { domain: domainPass, document: documentPass, presence: presencePass },
    legacy,
  };
}

/** §1.2 — the verdict, before the decision. Same arithmetic the applicant saw. */
export function BarVerdict({ claimed }: { claimed: ClaimedSignals }) {
  const { met } = evaluateBar(claimed);
  const passing = (Object.keys(claimed) as SignalKey[]).filter((k) => claimed[k]);
  const names = passing.map((k) => LABELS[k].toLowerCase());
  const summary = names.length ? names.join(' + ') : 'no signals';

  return (
    <div
      role="status"
      style={{
        background: met ? t.okSoft : t.warnSoft,
        border: `1px solid ${met ? t.ok : t.warn}`,
        borderRadius: t.radius.md,
        padding: '10px 12px',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: met ? t.okText : t.warnText, lineHeight: 1.35 }}>
        {met ? 'Meets the bar' : 'Below the bar'} — {summary}
      </div>
      {!met && (
        <div style={{ fontSize: 12, color: t.warnText, opacity: 0.9, marginTop: 3, lineHeight: 1.4 }}>
          Two signals are required, one of them domain or document. This is not an
          automatic refusal — it is yours to judge.
        </div>
      )}
    </div>
  );
}

/** §1.1 — three signals, each PASS or NOT CLAIMED, evidence beneath. */
export function SignalsPanel({
  signals,
  renderDocument,
}: {
  signals: ResolvedSignal[];
  /** The document opens through the existing signed-URL link, not a raw path. */
  renderDocument?: (path: string) => React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {signals.map((s) => {
        const Icon = ICONS[s.key];
        const pass = s.state === 'pass';
        return (
          <div
            key={s.key}
            style={{
              background: t.surface,
              border: `1px solid ${pass ? t.ok : t.line}`,
              borderRadius: t.radius.md,
              padding: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon size={14} color={pass ? t.okText : t.inkFaint} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.inkMuted }}>
                {s.label}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: pass ? t.okText : t.inkFaint,
                }}
              >
                {pass ? 'Pass' : 'Not claimed'}
              </span>
            </div>

            {s.evidence.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {s.evidence.map((e) => (
                  <div key={e.label} style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: 1.4 }}>
                    <span style={{ color: t.inkFaint, minWidth: 96 }}>{e.label}</span>
                    {e.href ? (
                      <a href={e.href} target="_blank" rel="noreferrer" style={{ color: t.brandText, wordBreak: 'break-all' }}>
                        {e.value}
                      </a>
                    ) : (
                      <span style={{ color: t.ink, wordBreak: 'break-all' }}>{e.value}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {s.documentPath && renderDocument && (
              <div style={{ marginTop: 8 }}>{renderDocument(s.documentPath)}</div>
            )}

            {s.caveat && (
              <div style={{ marginTop: 8, fontSize: 12, color: t.warnText, lineHeight: 1.4 }}>{s.caveat}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** §1.4 — anything unrecognised stays readable, behind a disclosure. */
export function RawMetadataDisclosure({ row }: { row: VerificationRow }) {
  const [open, setOpen] = useState(false);
  const meta = asObject(row.proofMetadata);
  const unrecognised = Object.entries(meta).filter(
    ([k, v]) => !RECOGNISED_META_KEYS.has(k) && v !== null && v !== undefined && v !== '',
  );
  const hasAny = Object.keys(meta).length > 0 || !!row.proofMethod || !!row.proofValue;
  if (!hasAny) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: 'transparent', border: 'none', padding: 0,
          fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
          textTransform: 'uppercase', color: t.inkFaint, cursor: 'pointer',
        }}
        aria-expanded={open}
      >
        <ChevronDown size={12} style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 120ms' }} />
        Raw submission{unrecognised.length ? ` (${unrecognised.length} extra)` : ''}
      </button>
      {open && (
        <pre
          style={{
            marginTop: 6, padding: 10,
            background: t.canvas, border: `1px solid ${t.line}`,
            borderRadius: t.radius.md,
            fontSize: 11, lineHeight: 1.45, color: t.inkMuted,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'auto',
          }}
        >
{JSON.stringify(
  { proof_method: row.proofMethod ?? null, proof_value: row.proofValue ?? null, proof_metadata: row.proofMetadata ?? null },
  null,
  2,
)}
        </pre>
      )}
    </div>
  );
}
