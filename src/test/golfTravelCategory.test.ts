import { describe, expect, it } from 'vitest';
import { Plane } from 'lucide-react';
import { BUSINESS_CATEGORIES_WITH_ICONS, BUSINESS_CATEGORIES } from '@/constants/businessCategories';
import { CREATE_CATEGORY_GROUPS, CREATE_CATEGORY_TILES } from '@/features/business-create/createRules';
import { businessCategoryWord, businessActionLabel, NEARBY_CATEGORIES } from '@/lib/business/businessHero';
import { getFacilitiesForCategory } from '@/components/business/editor/editorTypes';
import { BOOKABLE_CATEGORIES, VENUE_CATEGORIES } from '@/components/business/home/doNext';

const t = (_key: string, fallback: string) => fallback;

describe('Golf Travel category', () => {
  it('registers the canonical category after Hotel / Accommodation with the Plane icon', () => {
    const hotel = BUSINESS_CATEGORIES_WITH_ICONS.findIndex(c => c.value === 'Hotel / Accommodation');
    expect(BUSINESS_CATEGORIES_WITH_ICONS[hotel + 1]).toEqual({ value: 'Golf Travel', label: 'Golf Travel', icon: Plane, subtitle: 'Golf trips, tours and packages' });
    expect(BUSINESS_CATEGORIES).toContain('Golf Travel');
  });
  it('places the travel tile directly after the canonical Hotel / Accommodation tile', () => {
    const hotel = CREATE_CATEGORY_TILES.findIndex(c => c.value === 'Hotel / Accommodation');
    expect(CREATE_CATEGORY_TILES[hotel + 1]).toEqual({ label: 'Golf travel', value: 'Golf Travel', icon: Plane });
    expect(CREATE_CATEGORY_GROUPS.find(g => g.key === 'around')?.tiles).toHaveLength(8);
  });
  it('uses the travel category word', () => {
    expect(businessCategoryWord('Golf Travel', t)).toBe('Golf travel');
  });
  it('labels booking Plan a trip', () => {
    expect(businessActionLabel('book', 'Golf Travel', t)).toBe('Plan a trip');
  });
  it('excludes travel from nearby venues', () => {
    expect(NEARBY_CATEGORIES.has('Golf Travel')).toBe(false);
  });
  it('returns exactly the seven travel facilities', () => {
    expect(getFacilitiesForCategory('Golf Travel')).toEqual(['Tailor-made trips', 'Group trips', 'Tee time booking', 'Accommodation', 'Airport transfers', 'Club hire', 'Flights']);
  });
  it('includes travel in bookable categories', () => {
    expect(BOOKABLE_CATEGORIES).toContain('Golf Travel');
  });
  it('excludes travel from premises nudges', () => {
    expect(VENUE_CATEGORIES).not.toContain('Golf Travel');
  });
});