import { AlertCircle } from 'lucide-react';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { ClubSearchDropdown, SelectedClub } from '../ClubSearchDropdown';
import { CollegeSearchDropdown, SelectedCollege } from '../CollegeSearchDropdown';
import { BUSINESS_CATEGORIES_WITH_ICONS } from '@/constants/businessCategories';

interface BusinessInfoSectionProps {
  category: string;
  setCategory: (category: string) => void;
  businessName: string;
  setBusinessName: (name: string) => void;
  selectedClub: SelectedClub | null;
  setSelectedClub: (club: SelectedClub | null) => void;
  selectedCollege: SelectedCollege | null;
  setSelectedCollege: (college: SelectedCollege | null) => void;
  description: string;
  setDescription: (desc: string) => void;
  existingBusinessForClub?: { id: string; name: string } | null;
  onRequestAccess?: () => void;
}

export function BusinessInfoSection({
  category,
  setCategory,
  businessName,
  setBusinessName,
  selectedClub,
  setSelectedClub,
  selectedCollege,
  setSelectedCollege,
  description,
  setDescription,
  existingBusinessForClub,
  onRequestAccess,
}: BusinessInfoSectionProps) {
  const isGolfClub = category === 'Golf Club';
  const isUniversity = category === 'University / College';

  return (
    <div className="space-y-4 px-4 pb-4 pt-2">
      {/* Card 1: Business Type */}
      <SectionCard>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-muted-foreground">
              Category <span className="text-destructive">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setBusinessName('');
                setSelectedClub(null);
                setSelectedCollege(null);
              }}
              className="w-full rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F7931E]/40 transition-colors appearance-none cursor-pointer"
              style={{
                background: '#ffffff',
                border: '1px solid rgba(15,23,42,0.07)',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
              }}
            >
              <option value="">Select a category</option>
              {BUSINESS_CATEGORIES_WITH_ICONS.map(({ value, label, subtitle }) => (
                <option key={value} value={value}>
                  {label}{subtitle ? ` — ${subtitle}` : ''}
                </option>
              ))}
            </select>
            <p className="text-[12px] text-muted-foreground">
              This helps golfers find the right type of business.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Warning block — only shown when existingBusinessForClub is set */}
      {existingBusinessForClub && (
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
              {onRequestAccess && (
                <button
                  type="button"
                  onClick={onRequestAccess}
                  className="text-[13px] font-semibold mt-2"
                  style={{ color: '#F7931E' }}
                >
                  Request access to manage this profile
                </button>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {/* Card 2: Business Name */}
      <SectionCard>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-muted-foreground">
              Business Name <span className="text-destructive">*</span>
            </label>

            {isGolfClub ? (
              <>
                <ClubSearchDropdown
                  value={selectedClub}
                  onChange={setSelectedClub}
                  placeholder="Search for your golf club..."
                  disabled={!category}
                />
                {selectedClub && !existingBusinessForClub && (
                  <p className="text-[12px] text-muted-foreground">
                    Your business will be linked to this club's courses.
                  </p>
                )}
              </>
            ) : isUniversity ? (
              <>
                <CollegeSearchDropdown
                  value={selectedCollege}
                  onChange={setSelectedCollege}
                  placeholder="Search for your college or university..."
                  disabled={!category}
                />
                {selectedCollege && (
                  <p className="text-[12px] text-muted-foreground">
                    Your business profile will be linked to this institution.
                  </p>
                )}
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={category ? 'Enter your business name' : 'Select a category first'}
                  disabled={!category}
                  className="w-full rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F7931E]/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
                />
                <p className="text-[12px] text-muted-foreground">
                  This is shown publicly on your profile and in search.
                </p>
              </>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Card 3: About */}
      <SectionCard>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-muted-foreground">
                About
              </label>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {description.length}/2500
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 2500))}
              placeholder="Tell golfers about your business..."
              rows={4}
              className="w-full rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F7931E]/40 transition-colors resize-none"
              style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
            />
            <p className="text-[12px] text-muted-foreground">
              Tip: Mention what makes you different — facilities, coaching style, atmosphere, or events.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
