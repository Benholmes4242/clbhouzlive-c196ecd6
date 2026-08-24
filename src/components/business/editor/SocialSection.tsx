import React from 'react';

import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { BIZ } from '@/components/business/businessTokens';

import { HINT_CLASS, LABEL_CLASS, FIELD_INPUT_CLASS, FIELD_INPUT_STYLE, FIELD_PLACEHOLDER_CLASS } from '@/components/manage/fieldTreatment';
import { SocialFields } from './editorTypes';
import { Instagram, Music2, Youtube, Facebook, type LucideProps } from 'lucide-react';

interface Row {
  field: keyof SocialFields;
  label: string;
  placeholder: string;
  kind: 'handle' | 'url';
  Icon: React.ComponentType<LucideProps>;
}

// Match personal SocialLinksSection ordering + iconography, plus Facebook.
const ROWS: Row[] = [
  { field: 'instagram', label: 'Instagram', placeholder: '@yourhandle',  kind: 'handle', Icon: Instagram },
  { field: 'tiktok',    label: 'TikTok',    placeholder: '@yourhandle',  kind: 'handle', Icon: Music2 },
  { field: 'twitter',   label: 'X / Twitter', placeholder: '@yourhandle', kind: 'handle', Icon: XIcon },
  { field: 'youtube',   label: 'YouTube',   placeholder: 'youtube.com/c/...', kind: 'url', Icon: Youtube },
  { field: 'facebook',  label: 'Facebook',  placeholder: 'facebook.com/...', kind: 'url', Icon: Facebook },
];

function XIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.828l-4.77-6.24L4.8 22H2.04l6.98-7.97L2 2h6.914l4.32 5.71L18.244 2Zm-1.2 18h1.87L7.03 4H5.06l11.984 16Z" />
    </svg>
  );
}

export interface SocialSectionProps {
  social: SocialFields;
  setSocial: (v: SocialFields) => void;
}

export function SocialSection({ social, setSocial }: SocialSectionProps) {
  const setField = (field: keyof SocialFields, raw: string, kind: 'handle' | 'url') => {
    let v = raw;
    if (kind === 'handle') v = v.replace(/^@+/, '');
    setSocial({ ...social, [field]: v });
  };

  return (
    <div className="space-y-4 px-4 pb-4 pt-2">
      <SectionCard>
        <div className="space-y-3">
          <div>
            <p className="text-[14px] font-semibold text-foreground">Social links</p>
            <p className={HINT_CLASS} style={{ marginTop: 2 }}>
              Link your socials so golfers can follow you off the course.
            </p>
          </div>
          {ROWS.map(({ field, label, placeholder, kind, Icon }) => (
            <div key={field} className="space-y-1.5">
              <label className={LABEL_CLASS}>{label}</label>
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-11 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  // GEOMETRY, not drift: radius 10 to sit inside the paired
                  // platform/handle row. Do not "correct" to the canon's 14.
                  style={{ ...FIELD_INPUT_STYLE, padding: 0, borderRadius: 10 }}
                >
                  <Icon size={16} strokeWidth={2} />
                </div>
                <input
                  type="text"
                  value={social[field] || ''}
                  onChange={(e) => setField(field, e.target.value, kind)}
                  placeholder={placeholder}
                  aria-label={label}
                  className={`${FIELD_INPUT_CLASS} ${FIELD_PLACEHOLDER_CLASS} flex-1 h-11 rounded-[10px] px-3.5 text-[15px]`}
                  // GEOMETRY: radius 10 matches its paired select above.
                  style={{ ...FIELD_INPUT_STYLE, padding: 0, paddingLeft: 14, paddingRight: 14, fontSize: 15, borderRadius: 10 }}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
