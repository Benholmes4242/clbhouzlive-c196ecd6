import { Building2, AlertCircle } from 'lucide-react';
import { BusinessSectionHeader } from '../BusinessSectionHeader';
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
    <div>
      <BusinessSectionHeader
        icon={Building2}
        title="Business Information"
        description="Tell golfers who you are and what you offer"
      />
      
      {/* Category Select */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[#1e293b] mb-1.5">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setBusinessName('');
            setSelectedClub(null);
            setSelectedCollege(null);
          }}
          className="w-full h-12 px-4 bg-white border border-[#e2e8f0] rounded-xl text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#e2e8f0] focus:border-[#e2e8f0] appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
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
        <p className="text-xs text-[#64748b] mt-1.5">
          This helps golfers find the right type of business.
        </p>
      </div>
      
      {/* Business Name - Conditional based on category */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[#1e293b] mb-1.5">
          Business Name <span className="text-red-500">*</span>
        </label>
        
        {isGolfClub ? (
          <>
            <ClubSearchDropdown
              value={selectedClub}
              onChange={setSelectedClub}
              placeholder="Search for your golf club..."
              disabled={!category}
            />
            {/* Existing business warning */}
            {existingBusinessForClub && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-800 font-medium">
                      This club already has a business profile
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      "{existingBusinessForClub.name}" is managed by someone else.
                    </p>
                    {onRequestAccess && (
                      <button
                        type="button"
                        onClick={onRequestAccess}
                        className="text-xs font-medium text-amber-700 underline hover:text-amber-900 mt-2"
                      >
                        Request access to manage this profile
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {selectedClub && !existingBusinessForClub && (
              <p className="text-xs text-[#64748b] mt-1.5">
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
              <p className="text-xs text-[#64748b] mt-1.5">
                Your business profile will be linked to this institution.
              </p>
            )}
          </>
        ) : (
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder={category ? "Enter your business name" : "Select a category first"}
            disabled={!category}
            className="w-full h-12 px-4 bg-white border border-[#e2e8f0] rounded-xl text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#e2e8f0] focus:border-[#e2e8f0] disabled:bg-[#f8fafc] disabled:cursor-not-allowed"
          />
        )}
        {!isGolfClub && !isUniversity && (
          <p className="text-xs text-[#64748b] mt-1.5">
            This is shown publicly on your profile and in search.
          </p>
        )}
      </div>
      
      {/* About */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-[#1e293b]">
            About your business
          </label>
          <span className="text-xs text-[#94a3b8]">
            {description.length}/500
          </span>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 500))}
          placeholder="Tell golfers about your business..."
          rows={4}
          className="w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#e2e8f0] focus:border-[#e2e8f0] resize-none"
        />
        <p className="text-xs text-[#64748b] mt-1.5">
          Tip: Mention what makes you different - facilities, coaching style, atmosphere, or events.
        </p>
      </div>
    </div>
  );
}
