import React from 'react';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { HINT_CLASS } from '@/components/manage/fieldTreatment';
import { PRIMARY_ACTION_OPTIONS, PrimaryActionKey } from './editorTypes';

interface Props {
  value: PrimaryActionKey | null;
  onChange: (v: PrimaryActionKey | null) => void;
}

export function PrimaryActionSection({ value, onChange }: Props) {
  return (
    <div className="space-y-4 px-4 pb-4 pt-2">
      <SectionCard>
        <div className="space-y-3">
          <div>
            <p className="text-[14px] font-semibold text-foreground">Primary button</p>
            <p className={HINT_CLASS} style={{ marginTop: 2 }}>
              Choose the main action golfers see on your profile.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRIMARY_ACTION_OPTIONS.map(({ key, label }) => {
              const active = value === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange(active ? null : key)}
                  className="rounded-full text-[13px] font-semibold transition-colors"
                  style={{
                    padding: '8px 14px',
                    background: active ? '#0F172A' : '#fff',
                    color: active ? '#fff' : '#0F172A',
                    border: active
                      ? '1px solid #0F172A'
                      : '1px solid rgba(15,23,42,0.10)',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
