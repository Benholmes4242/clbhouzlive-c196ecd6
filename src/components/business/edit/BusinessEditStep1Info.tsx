/**
 * BusinessEditStep1Info — Step 1 of business edit wizard
 * Business name, category (read-only), description
 */
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { MapPin } from 'lucide-react';

interface BusinessEditStep1Props {
  formData: {
    businessName: string;
    businessCategory: string;
    businessBio: string;
  };
  onFieldChange: (field: string, value: string) => void;
  isClubLinked: boolean;
}

export function BusinessEditStep1Info({
  formData,
  onFieldChange,
  isClubLinked,
}: BusinessEditStep1Props) {
  return (
    <div className="space-y-4 px-4 pb-4 pt-2">
      {/* Card 1: Business Type — read-only in edit */}
      <SectionCard>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-muted-foreground">
              Category
            </label>
            <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3 text-[15px] text-muted-foreground">
              {isClubLinked && <MapPin className="w-4 h-4 flex-shrink-0" />}
              <span>{formData.businessCategory || 'Not set'}</span>
            </div>
            <p className="text-[12px] text-muted-foreground">
              Category cannot be changed after creation.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Card 2: Business Name */}
      <SectionCard>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-muted-foreground">
              Business Name <span className="text-destructive">*</span>
            </label>
            {isClubLinked ? (
              <>
                <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3 text-[15px] text-muted-foreground">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{formData.businessName}</span>
                </div>
                <p className="text-[12px] text-muted-foreground">
                  Linked to a club record. Contact support to update.
                </p>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => onFieldChange('businessName', e.target.value)}
                  placeholder="e.g., Royal Golf Club"
                  className="w-full bg-muted border-0 rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/40 focus:bg-background transition-colors"
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
                {formData.businessBio.length}/2500
              </span>
            </div>
            <textarea
              value={formData.businessBio}
              onChange={(e) => onFieldChange('businessBio', e.target.value.slice(0, 2500))}
              placeholder="Tell golfers about your business..."
              rows={4}
              className="w-full bg-muted border-0 rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors resize-none"
            />
            <p className="text-[12px] text-muted-foreground">
              Mention what makes you different — facilities, coaching style, atmosphere, or events.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
