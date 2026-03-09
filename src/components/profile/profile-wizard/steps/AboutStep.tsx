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
    </div>
  );
}
