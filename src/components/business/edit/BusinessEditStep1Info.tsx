/**
 * BusinessEditStep1Info — Step 1: Identity
 * Business name, category (read-only), description, website, social links, founded year
 */
import { MapPin, Lock } from 'lucide-react';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';

interface BusinessEditStep1Props {
  formData: {
    businessName: string;
    businessCategory: string;
    businessBio: string;
    businessWebsite: string;
    businessFoundedYear: string;
    businessInstagram: string;
    businessTwitter: string;
    businessFacebook: string;
    businessYoutube: string;
  };
  onFieldChange: (field: string, value: string) => void;
  isClubLinked: boolean;
}

const INPUT_CLASS = "w-full rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors";
const INPUT_STYLE = { background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' };

const LOCKED_CLASS = "flex items-center gap-2 rounded-xl px-4 py-3 text-[15px] text-muted-foreground";
const LOCKED_STYLE = { background: 'rgba(15,23,42,0.03)', border: '0.5px solid rgba(15,23,42,0.07)' };

const LABEL_CLASS = "text-[13px] font-medium text-muted-foreground";
const HINT_CLASS = "text-[12px] text-muted-foreground mt-1";

const SOCIAL_PLATFORMS = [
  { field: 'businessInstagram', label: 'Instagram', placeholder: '@yourhandle', icon: '📸' },
  { field: 'businessTwitter', label: 'X / Twitter', placeholder: '@yourhandle', icon: '𝕏' },
  { field: 'businessFacebook', label: 'Facebook', placeholder: 'facebook.com/…', icon: 'ƒ' },
  { field: 'businessYoutube', label: 'YouTube', placeholder: 'youtube.com/c/…', icon: '▶' },
];

export function BusinessEditStep1Info({ formData, onFieldChange, isClubLinked }: BusinessEditStep1Props) {
  return (
    <div className="space-y-4 px-4 pb-4 pt-2">
      {/* Category — always read-only */}
      <SectionCard>
        <div className="space-y-1.5">
          <label className={LABEL_CLASS}>Category</label>
          <div className={LOCKED_CLASS} style={LOCKED_STYLE}>
            {isClubLinked && <Lock className="w-4 h-4 flex-shrink-0" />}
            {formData.businessCategory || 'Not set'}
          </div>
          <p className={HINT_CLASS}>Category cannot be changed after creation.</p>
        </div>
      </SectionCard>

      {/* Business Name */}
      <SectionCard>
        <div className="space-y-1.5">
          <label className={LABEL_CLASS}>
            Business Name <span className="text-destructive">*</span>
          </label>
          {isClubLinked ? (
            <>
              <div className={LOCKED_CLASS} style={LOCKED_STYLE}>
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {formData.businessName}
              </div>
              <p className={HINT_CLASS}>Linked to a club record. Contact support to update.</p>
            </>
          ) : (
            <>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => onFieldChange('businessName', e.target.value)}
                placeholder="e.g., Royal Golf Club"
                className={`${INPUT_CLASS} focus:ring-2 focus:ring-[#F7931E]/40 focus:bg-white`}
                style={INPUT_STYLE}
              />
              <p className={HINT_CLASS}>Shown publicly on your profile and in search.</p>
            </>
          )}
        </div>
      </SectionCard>

      {/* About */}
      <SectionCard>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className={LABEL_CLASS}>About</label>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {formData.businessBio.length}/2500
            </span>
          </div>
          <textarea
            value={formData.businessBio}
            onChange={(e) => onFieldChange('businessBio', e.target.value.slice(0, 2500))}
            placeholder="Tell golfers about your business…"
            rows={5}
            className={`${INPUT_CLASS} resize-none focus:ring-2 focus:ring-[#F7931E]/40 focus:bg-white`}
            style={INPUT_STYLE}
          />
          <p className={HINT_CLASS}>
            Mention facilities, coaching style, atmosphere, events, or what makes you different.
          </p>
        </div>
      </SectionCard>

      {/* Founded Year (NEW) */}
      <SectionCard>
        <div className="space-y-1.5">
          <label className={LABEL_CLASS}>Year Established</label>
          <input
            type="number"
            value={formData.businessFoundedYear}
            onChange={(e) => onFieldChange('businessFoundedYear', e.target.value)}
            placeholder="e.g., 1985"
            min={1800}
            max={new Date().getFullYear()}
            className={`${INPUT_CLASS} focus:ring-2 focus:ring-[#F7931E]/40 focus:bg-white`}
            style={INPUT_STYLE}
          />
          <p className={HINT_CLASS}>
            Shown on your About tab. Gives golfers a sense of your heritage.
          </p>
        </div>
      </SectionCard>

      {/* Website (MOVED from Step 2) */}
      <SectionCard>
        <div className="space-y-1.5">
          <label className={LABEL_CLASS}>Website</label>
          <input
            type="url"
            value={formData.businessWebsite}
            onChange={(e) => onFieldChange('businessWebsite', e.target.value)}
            placeholder="https://yourwebsite.com"
            className={`${INPUT_CLASS} focus:ring-2 focus:ring-[#F7931E]/40 focus:bg-white`}
            style={INPUT_STYLE}
          />
          <p className={HINT_CLASS}>Links directly from your profile page.</p>
        </div>
      </SectionCard>

      {/* Social Links (NEW) */}
      <SectionCard>
        <div className="space-y-3">
          <div>
            <p className="text-[14px] font-semibold text-foreground">Social Links</p>
            <p className={`${HINT_CLASS} mt-0.5`}>
              Link your social media so golfers can follow you off the course.
            </p>
          </div>
          {SOCIAL_PLATFORMS.map(({ field, label, placeholder, icon }) => (
            <div key={field} className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 text-lg"
                style={{ background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(15,23,42,0.07)' }}
              >
                {icon}
              </div>
              <input
                type="text"
                value={(formData as Record<string, string>)[field] || ''}
                onChange={(e) => onFieldChange(field, e.target.value)}
                placeholder={placeholder}
                aria-label={label}
                className="flex-1 h-10 rounded-[10px] px-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F7931E]/40"
                style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
              />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
