import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ProfileFormData } from '../types';
import { BioWebsitesSection } from '@/components/profile/edit-v2/BioWebsitesSection';
import { SocialLinksSection } from '@/components/profile/edit-v2/SocialLinksSection';
import { LocationSection } from '@/components/profile/edit-v2/LocationSection';
import { PrivacySection } from '@/components/profile/edit-v2/PrivacySection';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';

interface Props {
  form: ProfileFormData;
  errors: Partial<Record<keyof ProfileFormData, string>>;
  onFieldChange: <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => void;
  onAddWebsite: () => void;
  onRemoveWebsite: (id: string) => void;
  onUpdateWebsite: (id: string, url: string) => void;
}

export function AboutStep({
  form, errors, onFieldChange,
  onAddWebsite, onRemoveWebsite, onUpdateWebsite,
}: Props) {
  const [showExtra, setShowExtra] = useState(false);

  return (
    <div className="space-y-4 px-4 pb-4">
      <SectionCard>
        <BioWebsitesSection
          bio={form.bio}
          websites={form.websites}
          bioError={errors.bio}
          websitesError={errors.websites}
          onBioChange={(v) => onFieldChange('bio', v)}
          onAddWebsite={onAddWebsite}
          onRemoveWebsite={onRemoveWebsite}
          onUpdateWebsite={onUpdateWebsite}
        />
      </SectionCard>

      <button
        onClick={() => setShowExtra(v => !v)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-muted-foreground/40 bg-transparent border-0 cursor-pointer"
      >
        {showExtra ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showExtra ? 'Less details' : 'Add social links & location'}
      </button>

      {showExtra && (
        <>
          <SectionCard>
            <SocialLinksSection
              instagram={form.instagramHandle}
              twitter={form.twitterHandle}
              tiktok={form.tiktokHandle}
              youtube={form.youtubeHandle}
              onInstagramChange={(v) => onFieldChange('instagramHandle', v)}
              onTwitterChange={(v) => onFieldChange('twitterHandle', v)}
              onTiktokChange={(v) => onFieldChange('tiktokHandle', v)}
              onYoutubeChange={(v) => onFieldChange('youtubeHandle', v)}
            />
          </SectionCard>

          <SectionCard>
            <LocationSection
              country={form.country}
              city={form.city}
              onCountryChange={(v) => onFieldChange('country', v)}
              onCityChange={(v) => onFieldChange('city', v)}
            />
          </SectionCard>

          <SectionCard>
            <PrivacySection
              isPublic={form.isPublic}
              onChange={(v) => onFieldChange('isPublic', v)}
            />
          </SectionCard>
        </>
      )}
    </div>
  );
}