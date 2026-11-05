import { SettingsHandicapCard } from '@/components/settings/SettingsHandicapCard';
import type { ProKind } from './proRules';
import '@/features/edit-profile/edit-profile.css';
export function ProHandicapNote({ kind }: { kind: ProKind | null }) {
  return <div className="pro-handicap-page"><div className="pro-handicap-note"><SettingsHandicapCard pro={{kind:kind ?? 'tour_pro'}} hideSwitch connection={null} connectionReady={false} profileError={false} checked={false} updating={false} onToggle={() => {}} onManage={() => {}} /></div></div>;
}