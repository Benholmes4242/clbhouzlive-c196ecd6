import { 
  Flag, 
  GraduationCap, 
  ShoppingBag, 
  Briefcase, 
  Building2,
  Sparkles,
  LucideIcon
} from 'lucide-react';

/**
 * Business category definition with icon
 */
export interface BusinessCategoryOption {
  value: string;
  label: string;
  icon: LucideIcon;
  subtitle?: string;
}

/**
 * Single source of truth for business categories.
 * Used in both BusinessCreatePage and BusinessInfoForm (edit).
 * 
 * IMPORTANT: When adding new categories, add them here so they
 * appear consistently in create and edit flows.
 * 
 * NOTE: 'Creator' category enables creator features (Insights, Analytics)
 * for team/brand accounts that produce content.
 */
export const BUSINESS_CATEGORIES_WITH_ICONS: BusinessCategoryOption[] = [
  { value: 'Golf Club', label: 'Golf Club', icon: Flag },
  { value: 'Golf Academy', label: 'Golf Academy', icon: GraduationCap },
  { value: 'Coach / Instructor', label: 'Coach / Instructor', icon: GraduationCap },
  { value: 'University / College', label: 'University / College', icon: GraduationCap, subtitle: 'Institution, team, or athletics program' },
  { value: 'Creator', label: 'Creator', icon: Sparkles, subtitle: 'Content creator, influencer, or media brand' },
  { value: 'Retailer / Pro Shop', label: 'Retailer / Pro Shop', icon: ShoppingBag },
  { value: 'Club Fitter', label: 'Club Fitter', icon: Briefcase },
  { value: 'Resort', label: 'Resort', icon: Building2 },
  { value: 'Brand / Manufacturer', label: 'Brand / Manufacturer', icon: Briefcase },
  { value: 'Other', label: 'Other', icon: Building2 },
];

/**
 * Simple string array of business category values.
 * Useful for validation or simple dropdowns.
 */
export const BUSINESS_CATEGORIES = BUSINESS_CATEGORIES_WITH_ICONS.map(c => c.value);

/**
 * Get the icon component for a given category value.
 * Falls back to Building2 if not found.
 */
export function getBusinessCategoryIcon(categoryValue: string): LucideIcon {
  const category = BUSINESS_CATEGORIES_WITH_ICONS.find(c => c.value === categoryValue);
  return category?.icon ?? Building2;
}
