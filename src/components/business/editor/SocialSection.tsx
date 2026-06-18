import React from 'react';

import { SectionEyebrow } from '@/components/ui/SectionEyebrow';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { BIZ } from '@/components/business/businessTokens';

import { HINT_CLASS } from './editorStyles';
import { SOCIAL_PLATFORMS, SocialFields } from './editorTypes';

export interface SocialSectionProps {
  social: SocialFields;
  setSocial: (v: SocialFields) => void;
}

export function SocialSection({ social, setSocial }: SocialSectionProps) {
  return (
    <>
      <div className="px-4 mt-2 mb-2">
        <SectionEyebrow label="SOCIAL" />
      </div>
      <div className="space-y-4 px-4 pb-4">
        <SectionCard>
          <div className="space-y-3">
            <p className={HINT_CLASS} style={{ marginTop: 0 }}>
              Link your social media so golfers can follow you off the course.
            </p>
            {SOCIAL_PLATFORMS.map(({ field, label, placeholder, icon }) => (
              <div key={field} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ background: 'rgba(15,23,42,0.04)', border: `1px solid ${BIZ.hair}` }}
                >
                  {icon}
                </div>
                <input
                  type="text"
                  value={social[field as keyof SocialFields]}
                  onChange={(e) => setSocial({ ...social, [field]: e.target.value })}
                  placeholder={placeholder}
                  aria-label={label}
                  className="flex-1 h-10 rounded-[10px] px-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F7931E]/40"
                  style={{ background: '#ffffff', border: `1px solid ${BIZ.hair}` }}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
