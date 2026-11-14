import { useProWorldRank } from '@/features/pro-profile/useProProfile';
import { RankingResultsSwitch } from '@/features/amateur-ranking/SettingsWagrCard';
import { rankingUpdated } from '@/features/amateur-ranking/wagrSettingsRules';
export function SettingsTourResultsCard({ userId }: { userId: string }) {
  const rank = useProWorldRank(userId);
  return <section className="st2-handicap wagr-settings" data-testid="settings-tour-results-card"><h3 className="st2-name">Tour results</h3><span className="st2-status">Official World Golf Ranking{!rank.isError && rank.data?.ranking_date ? ` · ${rankingUpdated(rank.data.ranking_date)}` : ''}</span><RankingResultsSwitch userId={userId} /></section>;
}