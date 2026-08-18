import { Globe, Mail, Building, Sparkles, MapPin } from 'lucide-react';
import type { ElementType } from 'react';

export type ProofMethod =
  | 'official_website'
  | 'business_email'
  | 'registered_business'
  | 'creator_business'
  | 'golf_course';

export type Step = 'readiness' | 'proof' | 'ownership' | 'domain';

export const PROOF_OPTIONS: { id: ProofMethod; label: string; subtitle: string; icon: ElementType }[] = [
  { id: 'official_website', label: 'Official website', subtitle: 'Your main business website.', icon: Globe },
  { id: 'business_email', label: 'Business email address', subtitle: 'An email on your business domain.', icon: Mail },
  { id: 'registered_business', label: 'Registered business (legal entity)', subtitle: 'A registration or licence showing your business name.', icon: Building },
  { id: 'creator_business', label: 'Creator / brand / influencer business', subtitle: 'For creator-led or personal brands.', icon: Sparkles },
  { id: 'golf_course', label: 'Golf course / facility', subtitle: 'For golf courses, clubs, academies, and facilities.', icon: MapPin },
];

/**
 * Jurisdiction-NEUTRAL registration types. The dropdown never did the
 * verifying: the applicant names their own registry in the free field, so a
 * Delaware filing, a Japanese registration or a UK one all describe cleanly.
 */
export const REGISTRY_OPTIONS = [
  { value: 'company_registry', label: 'Company or business registry' },
  { value: 'charity_nonprofit', label: 'Charity or non-profit register' },
  { value: 'tax_authority', label: 'Tax authority registration' },
  { value: 'trade_licence', label: 'Trade or business licence' },
  { value: 'other', label: 'Other official registration' },
];


export const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'employee', label: 'Employee' },
  { value: 'agency', label: 'Agency' },
  { value: 'other', label: 'Other' },
] as const;

export function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str.startsWith('http') ? str : `https://${str}`);
    return !!url.hostname;
  } catch {
    return false;
  }
}

export function isValidEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}
