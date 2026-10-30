/** ST4 uses NotificationsPage's push guards and the unchanged shared categories.
 * Native registration and preference writes remain owned by existing flows. */
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSettingsAlertSummary } from './useSettingsAlertSummary';
import './settingsNotifications.css';

export function SettingsNotificationsCard({ userId, onAlerts }: { userId?: string; onAlerts: () => void }) {
  const push = usePushNotifications();
  const summary = useSettingsAlertSummary(userId);
  const loading = push.isLoading || push.state === 'unknown';
  const unavailable = push.state === 'unavailable' && !push.isLoading;
  const enabled = push.state === 'enabled';
  const toggle = () => {
    if (unavailable || loading) return;
    if (enabled) void push.disable();
    else void push.enable();
  };
  return <div className="ep-rows" data-testid="settings-notifications">
    <div className="ep-row">
      <span className="ep-row-label">Push</span>
      <span className={`ep-row-value${unavailable ? ' ph' : ''}`} data-testid="settings-push-value">{loading ? null : unavailable ? 'Needs the latest app' : enabled ? 'On this phone' : 'Off'}</span>
      <Button variant="ghost" className="bizc-switch st4-switch" role="switch" aria-label="Push" aria-checked={!unavailable && enabled} disabled={unavailable || loading} data-unavailable={unavailable} onClick={toggle}><i aria-hidden /></Button>
    </div>
    <Button variant="ghost" className="ep-row" onClick={onAlerts}>
      <span className="ep-row-label">Alerts</span><span className="ep-row-value" data-testid="settings-alert-value">{summary}</span><ChevronRight size={18} className="ep-row-chev" aria-hidden />
    </Button>
  </div>;
}