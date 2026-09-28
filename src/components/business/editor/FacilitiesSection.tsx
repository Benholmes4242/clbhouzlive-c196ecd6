import React from 'react';

import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { HINT_CLASS } from '@/components/manage/fieldTreatment';
import { railChipStyle, RAIL_CHIP_GAP } from '@/components/ui/RailChips';
import { getFacilitiesForCategory } from './editorTypes';

interface Props {
  category: string;
  amenities: string[];
  setAmenities: (v: string[]) => void;
}

export function FacilitiesSection({ category, amenities, setAmenities }: Props) {
  const options = getFacilitiesForCategory(category);
  if (!options.length) return null;

  const toggle = (tag: string) => {
    if (amenities.includes(tag)) setAmenities(amenities.filter((t) => t !== tag));
    else setAmenities([...amenities, tag]);
  };

  return (
    <div className="space-y-4 px-4 pb-4 pt-2">
      <SectionCard>
        <div className="space-y-3">
          <div>
            <p className="text-[14px] font-semibold text-foreground">Facilities & amenities</p>
            <p className={HINT_CLASS} style={{ marginTop: 2 }}>
              Tap what you offer. These show as tags on your profile.
            </p>
          </div>
          {/* Multi-select toggles: role="group" + aria-pressed, never a tablist.
              Canonical chip spread verbatim — no tick, no amber (amber = viewing member). */}
          <div
            role="group"
            aria-label="Facilities and amenities"
            style={{ display: 'flex', flexWrap: 'wrap', gap: RAIL_CHIP_GAP }}
          >
            {options.map((tag) => {
              const active = amenities.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(tag)}
                  style={railChipStyle(active)}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
