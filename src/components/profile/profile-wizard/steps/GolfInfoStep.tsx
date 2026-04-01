import { ProfileFormData, ClubEntry } from '../types';
import { HomeClubCard } from '@/components/profile/edit-v2/HomeClubCard';
import { AdditionalClubsList } from '@/components/profile/edit-v2/AdditionalClubsList';
import { CollegeSelector } from '@/components/profile/edit-v2/CollegeSelector';
import { HandicapInput } from '@/components/profile/edit-v2/HandicapInput';
import HandicapSyncInlineNotice from '@/components/profile/edit-v2/HandicapSyncInlineNotice';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';

interface Props {
  form: ProfileFormData;
  userId?: string;
  hasRegisteredInterest?: boolean;
  onFieldChange: <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => void;
  onAddClub: (club: Omit<ClubEntry, 'id'>) => void;
  onRemoveClub: (id: string) => void;
}

export function GolfInfoStep({ form, userId, hasRegisteredInterest, onFieldChange, onAddClub, onRemoveClub }: Props) {
  return (
    <div className="space-y-4 px-4 pb-4">
      <SectionCard>
        <HomeClubCard
          clubName={form.homeClubName}
          clubId={form.primaryClubId}
          visibility={form.homeClubVisibility}
          onClubSelect={(name, id) => {
            onFieldChange('homeClubName', name);
            onFieldChange('primaryClubId', id);
          }}
          onVisibilityChange={(v) => onFieldChange('homeClubVisibility', v)}
        />
        {!form.homeClubName && (
          <p className="text-[12px] text-[hsl(38,92%,50%)] mt-1.5 ml-1">
            ⛳ Your home club appears on your profile and leaderboards
          </p>
        )}
      </SectionCard>

      <SectionCard>
        <AdditionalClubsList
          clubs={form.additionalClubs}
          visibility={form.additionalClubsVisibility}
          onAdd={onAddClub}
          onRemove={onRemoveClub}
          onVisibilityChange={(v) => onFieldChange('additionalClubsVisibility', v)}
        />
      </SectionCard>

      <SectionCard>
        <HandicapInput
          value={form.handicapIndex}
          onChange={(v) => onFieldChange('handicapIndex', v)}
        />
        <div className="mt-3">
          {userId && <HandicapSyncInlineNotice userId={userId} hasRegisteredInterest={hasRegisteredInterest ?? false} />}
        </div>
      </SectionCard>

      <SectionCard>
        <CollegeSelector
          collegeName={form.collegeNormalized}
          collegeId={form.collegeId}
          onSelect={(name, id) => {
            onFieldChange('collegeNormalized', name);
            onFieldChange('collegeId', id);
          }}
        />
      </SectionCard>
    </div>
  );
}

export default GolfInfoStep;
