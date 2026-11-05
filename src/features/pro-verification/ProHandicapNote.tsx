import { SettingsHandicapCard } from '@/components/settings/SettingsHandicapCard';
import type { ProKind } from './proRules';
import '@/features/edit-profile/edit-profile.css';
export function ProHandicapNote({ kind, pending = false }: { kind: ProKind | null; pending?: boolean }) {
  return <div className="pro-handicap-page"><div className="pro-handicap-note"><SettingsHandicapCard pro={{kind:kind ?? 'tour_pro', pending}} hideSwitch connection={null} connectionReady={false} profileError={false} checked={false} updating={false} onToggle={() => {}} onManage={() => {}} /></div></div>;
}