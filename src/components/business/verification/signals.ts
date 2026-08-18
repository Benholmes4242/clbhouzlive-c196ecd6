/**
 * BRIEF_VERIFICATION_PHASE_3 — THE SIGNAL MODEL.
 *
 * The published criteria (/legal/business-verification) state a two-of-three
 * signal bar. This module is the ONE place that model lives: the signals, the
 * bar, the free-provider exclusion list, and the mapping onto the five legacy
 * proof methods (which are kept so useProofConflict keeps comparing like with
 * like).
 */
import { Globe, FileText, Radar } from 'lucide-react';
import type { ElementType } from 'react';
import type { ProofMethod } from './steps/verificationTypes';

export type SignalKey = 'domain' | 'document' | 'presence';

export const SIGNALS: {
  key: SignalKey;
  label: string;
  what: string;
  /** DOMAIN and DOCUMENT are qualifying on their own; PRESENCE never is. */
  qualifying: boolean;
  icon: ElementType;
}[] = [
  {
    key: 'domain',
    label: 'Business domain',
    what: 'We email a code to an address on your own domain, and you enter it here.',
    qualifying: true,
    icon: Globe,
  },
  {
    key: 'document',
    label: 'A document',
    what: 'One document that shows your business name legibly. Image or PDF, up to 10 MB.',
    qualifying: true,
    icon: FileText,
  },
  {
    key: 'presence',
    label: 'Presence',
    what: 'A live site, a business listing, an established social account, or a published phone number that matches.',
    qualifying: false,
    icon: Radar,
  },
];

export type ClaimedSignals = Record<SignalKey, boolean>;

export const NO_SIGNALS: ClaimedSignals = { domain: false, document: false, presence: false };

/**
 * §1.2 THE BAR: two of the three, and at least one of them DOMAIN or DOCUMENT.
 * Presence alone, or presence twice, never qualifies.
 */
export function evaluateBar(claimed: ClaimedSignals): {
  count: number;
  met: boolean;
  /** Plain sentence naming what is still missing. Empty when the bar is met. */
  missing: string;
} {
  const count = (Object.keys(claimed) as SignalKey[]).filter((k) => claimed[k]).length;
  const hasQualifying = claimed.domain || claimed.document;
  const met = count >= 2 && hasQualifying;

  let missing = '';
  if (!met) {
    if (count === 0) missing = 'Mark the signals you can provide.';
    else if (!hasQualifying) missing = 'Presence on its own is not enough. You will also need a document or a business domain.';
    else if (count === 1) missing = 'One more signal is needed. Add a second, or add presence.';
  }
  return { count, met, missing };
}

/**
 * §1.4 FREE MAILBOX PROVIDERS ARE NOT A DOMAIN SIGNAL. An address here proves
 * control of a mailbox, not a connection to a business. Maintained in ONE
 * place — the flow, the copy and any future reviewer tooling read this list.
 */
export const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'outlook.com', 'outlook.co.uk', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'live.co.uk', 'msn.com',
  'yahoo.com', 'yahoo.co.uk', 'ymail.com', 'rocketmail.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'gmx.com', 'gmx.de', 'gmx.net', 'mail.com', 'zoho.com',
  'proton.me', 'protonmail.com', 'pm.me', 'tutanota.com',
  'yandex.com', 'yandex.ru', 'mail.ru',
  'btinternet.com', 'sky.com', 'talktalk.net', 'virginmedia.com', 'blueyonder.co.uk',
  'comcast.net', 'verizon.net', 'sbcglobal.net', 'cox.net', 'bellsouth.net',
  'web.de', 't-online.de', 'free.fr', 'orange.fr', 'wanadoo.fr',
  'qq.com', '163.com', '126.com', 'naver.com', 'hanmail.net',
  'bigpond.com', 'optusnet.com.au', 'rediffmail.com',
]);

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split('@')[1] ?? '';
}

/** True when the address is on a mailbox provider, not a business's own domain. */
export function isFreeEmailDomain(email: string): boolean {
  const d = emailDomain(email);
  if (!d) return false;
  return FREE_EMAIL_DOMAINS.has(d);
}

export type PresenceKind = 'website' | 'listing' | 'social' | 'phone';

export const PRESENCE_KINDS: { value: PresenceKind; label: string; placeholder: string }[] = [
  { value: 'website', label: 'Live website', placeholder: 'https://yourbusiness.com' },
  { value: 'listing', label: 'Business listing', placeholder: 'Link to your listing or map profile' },
  { value: 'social', label: 'Social account', placeholder: '@yourhandle or a profile link' },
  { value: 'phone', label: 'Published phone number', placeholder: 'Include your country code' },
];

/**
 * §1.3 THE FIVE PROOF METHODS ARE NOT THROWN AWAY — they carry the PRIMARY
 * signal so proof_method / proof_value keep their current meaning.
 *
 * CORRECTED from the brief's mapping: `creator_business` and `golf_course` are
 * not distinct signals, they are PRESENCE with a different shape — a creator's
 * contact and a course's website are both "something public that matches". So
 * presence resolves by the KIND of evidence given, not by business category:
 * a phone number is the creator shape, a URL is the website shape.
 */
export function primaryProofMethod(
  claimed: ClaimedSignals,
  presenceKind: PresenceKind,
): ProofMethod {
  if (claimed.domain) return 'business_email';
  if (claimed.document) return 'registered_business';
  return presenceKind === 'phone' ? 'creator_business' : 'official_website';
}

export function signalOfProofMethod(method: ProofMethod): SignalKey {
  switch (method) {
    case 'business_email':
      return 'domain';
    case 'registered_business':
      return 'document';
    default:
      return 'presence';
  }
}
