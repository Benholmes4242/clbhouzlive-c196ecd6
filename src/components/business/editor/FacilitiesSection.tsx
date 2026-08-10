import React from 'react';
import { Check } from 'lucide-react';

import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { BIZ } from '@/components/business/businessTokens';
import { HINT_CLASS } from '@/components/manage/fieldTreatment';
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
          <div className="flex flex-wrap gap-2">
            {options.map((tag) => {
              const active = amenities.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  className="inline-flex items-center gap-1.5 rounded-full text-[13px] font-medium transition-colors"
                  style={{
                    padding: '7px 12px',
                    background: active ? 'rgba(247,147,30,0.10)' : '#fff',
                    border: active
                      ? `1px solid ${BIZ.amber}`
                      : '1px solid rgba(15,23,42,0.10)',
                    color: active ? BIZ.amber : '#0F172A',
                  }}
                >
                  {active && <Check size={13} strokeWidth={2.5} />}
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
