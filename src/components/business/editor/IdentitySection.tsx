import React from 'react';
import { AlertCircle, Lock, MapPin } from 'lucide-react';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { BIZ } from '@/components/business/businessTokens';
import { BUSINESS_CATEGORIES_WITH_ICONS } from '@/constants/businessCategories';
import { ClubSearchDropdown, SelectedClub } from '@/components/business/ClubSearchDropdown';
import { CollegeSearchDropdown, SelectedCollege } from '@/components/business/CollegeSearchDropdown';

import {
  INPUT_CLASS,
  INPUT_STYLE,
  LOCKED_CLASS,
  LOCKED_STYLE,
  LABEL_CLASS,
  HINT_CLASS,
} from './editorStyles';

export interface IdentitySectionProps {
  mode: 'create' | 'edit';
  category: string;
  setCategory: (v: string) => void;
  isGolfClub: boolean;
  isUniversity: boolean;
  selectedClub: SelectedClub | null;
  setSelectedClub: (c: SelectedClub | null) => void;
  selectedCollege: SelectedCollege | null;
  setSelectedCollege: (c: SelectedCollege | null) => void;
  businessName: string;
  setBusinessName: (v: string) => void;
  isClubLinked: boolean;
  existingBusinessForClub: { id: string; name: string } | null;
  onRequestAccess: () => void;
  onRequestClub: () => void;
  description: string;
  setDescription: (v: string) => void;
  foundedYear: string;
  setFoundedYear: (v: string) => void;
}

export function IdentitySection({
  mode,
  category,
  setCategory,
  isGolfClub,
  isUniversity,
  selectedClub,
  setSelectedClub,
  selectedCollege,
  setSelectedCollege,
  businessName,
  setBusinessName,
  isClubLinked,
  existingBusinessForClub,
  onRequestAccess,
  onRequestClub,
  description,
  setDescription,
  foundedYear,
  setFoundedYear,
}: IdentitySectionProps) {
  return (
    <>
      <div className="px-4 mb-2">
        <SectionHeader tier="standard" kicker="IDENTITY" tone="amber" />
      </div>
      <div className="space-y-4 px-4 pb-4">
        {/* Category */}
        <SectionCard>
          <div className="space-y-1.5">
            <label className={LABEL_CLASS}>
              Category {mode === 'create' && <span className="text-destructive">*</span>}
            </label>
            {mode === 'edit' ? (
              <>
                <div className={LOCKED_CLASS} style={LOCKED_STYLE}>
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  {category || 'Not set'}
                </div>
                <p className={HINT_CLASS}>Category cannot be changed after creation.</p>
              </>
            ) : (
              <>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setBusinessName('');
                    setSelectedClub(null);
                    setSelectedCollege(null);
                  }}
                  className={`${INPUT_CLASS} appearance-none cursor-pointer`}
                  style={{
                    ...INPUT_STYLE,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                  }}
                >
                  <option value="">Select a category</option>
                  {BUSINESS_CATEGORIES_WITH_ICONS.map(({ value, label, subtitle }) => (
                    <option key={value} value={value}>
                      {label}
                      {subtitle ? ` — ${subtitle}` : ''}
                    </option>
                  ))}
                </select>
                <p className={HINT_CLASS}>Category cannot be changed after creation.</p>
              </>
            )}
          </div>
        </SectionCard>

        {/* Already-claimed warning */}
        {mode === 'create' && existingBusinessForClub && (
          <SectionCard className="border-destructive/30 bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-foreground">
                  This club already has a business profile
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  "{existingBusinessForClub.name}" is managed by someone else.
                </p>
                <button
                  type="button"
                  onClick={onRequestAccess}
                  className="text-[13px] font-semibold mt-2"
                  style={{ color: BIZ.amber }}
                >
                  Request access to manage this profile
                </button>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Name / search */}
        <SectionCard>
          <div className="space-y-1.5">
            <label className={LABEL_CLASS}>
              Business Name <span className="text-destructive">*</span>
            </label>
            {isGolfClub && (mode === 'create' || !isClubLinked) ? (
              <>
                <ClubSearchDropdown
                  value={selectedClub}
                  onChange={setSelectedClub}
                  placeholder="Search for your golf club..."
                  disabled={!category}
                />
                <button
                  type="button"
                  onClick={onRequestClub}
                  className="text-[12px] font-medium mt-1"
                  style={{ color: BIZ.amber }}
                >
                  Can't find your course? Request we add it
                </button>
              </>
            ) : isClubLinked ? (
              <>
                <div className={LOCKED_CLASS} style={LOCKED_STYLE}>
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {businessName}
                </div>
                <p className={HINT_CLASS}>
                  Linked to a club record. Contact support to update.
                </p>
              </>
            ) : isUniversity ? (
              <CollegeSearchDropdown
                value={selectedCollege}
                onChange={setSelectedCollege}
                placeholder="Search for your college or university..."
                disabled={!category}
              />
            ) : (
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={
                  mode === 'create' && !category
                    ? 'Select a category first'
                    : 'e.g., Royal Golf Club'
                }
                disabled={mode === 'create' && !category}
                className={`${INPUT_CLASS} disabled:opacity-50`}
                style={INPUT_STYLE}
              />
            )}
            <p className={HINT_CLASS}>Shown publicly on your profile and in search.</p>
          </div>
        </SectionCard>

        {/* About */}
        <SectionCard>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={LABEL_CLASS}>About</label>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {description.length}/2500
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 2500))}
              placeholder="Tell golfers about your business…"
              rows={5}
              className={`${INPUT_CLASS} resize-none`}
              style={INPUT_STYLE}
            />
            <p className={HINT_CLASS}>
              Mention facilities, coaching style, atmosphere, events, or what makes you different.
            </p>
          </div>
        </SectionCard>

        {/* Founded year */}
        <SectionCard>
          <div className="space-y-1.5">
            <label className={LABEL_CLASS}>Year Established</label>
            <input
              type="number"
              value={foundedYear}
              onChange={(e) => setFoundedYear(e.target.value)}
              placeholder="e.g., 1985"
              min={1800}
              max={new Date().getFullYear()}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
            <p className={HINT_CLASS}>Shown on your About tab.</p>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
