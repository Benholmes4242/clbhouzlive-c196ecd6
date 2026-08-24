import React from 'react';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { HINT_CLASS } from '@/components/manage/fieldTreatment';
import { PRIMARY_ACTION_OPTIONS, PrimaryActionKey } from './editorTypes';
import { PillFilterRow, type PillFilterOption } from '@/components/explore-tab-new/courseled/PillFilterRow';

const PILL_OPTIONS: ReadonlyArray<PillFilterOption<PrimaryActionKey>> =
  PRIMARY_ACTION_OPTIONS.map(({ key, label }) => ({ value: key, label }));

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
          {/*
            THE PILL IS SHARED. This is a single-select one-of-N row, i.e. the
            same control as the Discover scope pills, so it consumes
            PillFilterRow rather than restating its colours. surface="panel"
            because the row sits inside a SectionCard (A.PANEL), where an
            unselected A.PANEL pill would vanish into its own container.
            Geometry becomes the primitive's (SCOPE_PILL_RADIUS, 8/14, 12.5/700):
            this deliberately overturns the previous brief's radius/weight fence.
          */}
          <PillFilterRow
            value={value}
            options={PILL_OPTIONS}
            onChange={onChange}
            ariaLabel="Primary button"
            surface="panel"
            deselectable
            style={{ flexWrap: 'wrap', overflowX: 'visible' }}
          />
        </div>
      </SectionCard>
    </div>
  );
}
