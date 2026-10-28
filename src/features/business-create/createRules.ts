/**
 * BC5 — canonical Create-a-business flow rules (/business/create).
 * Display labels below exist for this flow only; the draft always stores the
 * canonical BUSINESS_CATEGORIES value, never the display label.
 */
import type { LucideIcon } from 'lucide-react';
import { Flag, GraduationCap, Target, Wrench, Building2, Bed, Coffee, Beer, ShoppingBag, Briefcase, Sparkles, MoreHorizontal } from 'lucide-react';
import type { BusinessCategoryValue } from '@/constants/businessCategories';
import type { SelectedClub } from '@/components/business/ClubSearchDropdown';
import type { SelectedCollege } from '@/components/business/CollegeSearchDropdown';
import type { AddressValue } from '@/components/business/AddressAutocomplete';
import type { PhoneValue } from '@/components/business/PhoneInputWithDialCode';
import { DEFAULT_OPENING_HOURS, emptyImage, type ImageState, type OpeningHours, type PrimaryActionKey, type SocialFields } from '@/components/business/editor/editorTypes';

export interface CategoryTile { label: string; value: BusinessCategoryValue; icon: LucideIcon }

export const CREATE_CATEGORY_GROUPS: { key: 'golf' | 'around'; label: string; tiles: CategoryTile[] }[] = [
  { key: 'golf', label: 'Golf', tiles: [
    { label: 'Golf Club', value: 'Golf Club', icon: Flag },
    { label: 'Golf Academy', value: 'Golf Academy', icon: GraduationCap },
    { label: 'Coach / Instructor', value: 'Coach / Instructor', icon: GraduationCap },
    { label: 'Driving Range', value: 'Driving Range', icon: Target },
    { label: 'Club Fitter', value: 'Club Fitter', icon: Wrench },
    { label: 'University / College', value: 'University / College', icon: GraduationCap },
  ] },
  { key: 'around', label: 'Around golf', tiles: [
    { label: 'Resort', value: 'Resort', icon: Building2 },
    { label: 'Hotel / Stay', value: 'Hotel / Accommodation', icon: Bed },
    { label: 'Restaurant / Café', value: 'Restaurant / Cafe', icon: Coffee },
    { label: 'Bar / Pub', value: 'Bar / Pub', icon: Beer },
    { label: 'Retailer / Pro Shop', value: 'Retailer / Pro Shop', icon: ShoppingBag },
    { label: 'Brand / Maker', value: 'Brand / Manufacturer', icon: Briefcase },
    { label: 'Creator', value: 'Creator', icon: Sparkles },
    { label: 'Something else', value: 'Other', icon: MoreHorizontal },
  ] },
];

export const CREATE_CATEGORY_TILES: CategoryTile[] = CREATE_CATEGORY_GROUPS.flatMap(g => g.tiles);

export function categoryDisplayLabel(value: string): string | null {
  return CREATE_CATEGORY_TILES.find(t => t.value === value)?.label ?? null;
}

export interface BusinessCreateDraft {
  category: BusinessCategoryValue | '';
  selectedClub: SelectedClub | null;
  selectedCollege: SelectedCollege | null;
  businessName: string;
  description: string;
  foundedYear: string;
  claimProofNote: string;
  address: AddressValue | null;
  countrySelection: string | null;
  phone: PhoneValue | null;
  email: string;
  website: string;
  bookingUrl: string;
  openingHours: OpeningHours;
  showOpeningHours: boolean;
  logo: ImageState;
  cover: ImageState;
  social: SocialFields;
  amenities: string[];
  primaryAction: PrimaryActionKey | null;
}

/** Mirrors the editor's create-mode prefill: ?category=golf_club or ?clubId= → Golf Club. */
export function initialDraft(params: URLSearchParams): BusinessCreateDraft {
  const golf = params.get('category') === 'golf_club' || !!params.get('clubId');
  return {
    category: golf ? 'Golf Club' : '',
    selectedClub: null, selectedCollege: null,
    businessName: '', description: '', foundedYear: '', claimProofNote: '',
    address: null, countrySelection: null, phone: null, email: '', website: '', bookingUrl: '',
    openingHours: { ...DEFAULT_OPENING_HOURS }, showOpeningHours: false,
    logo: emptyImage, cover: emptyImage,
    social: { instagram: '', tiktok: '', twitter: '', facebook: '', youtube: '' },
    amenities: [], primaryAction: null,
  };
}

export const CREATE_STEPS = 4;
