import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useTourTeeAlert } from '../../../hooks/useTourTeeAlert';
import { OVERVIEW } from '../overviewTokens';
import { toast } from '@/lib/toast';

export function TeeAlertControl({ armed, disabled, needsNotifications, onToggle }: {
  armed: boolean; disabled?: boolean; needsNotifications: boolean; onToggle: () => void;
}) {
  const { t } = useTranslation('tourhub');
  const tokens = OVERVIEW.teeAlert;
  return (
    <div style={{ marginTop: tokens.marginTop }}>
      <Button type="button" variant="ghost" aria-pressed={armed} disabled={disabled} onClick={onToggle}
        style={{ width: '100%', height: 'auto', whiteSpace: 'normal', border: `1px solid ${tokens.border}`, borderRadius: tokens.radius,
          padding: tokens.padding, color: OVERVIEW.amber, fontSize: tokens.size, fontWeight: tokens.weight,
          letterSpacing: tokens.tracking, textTransform: 'uppercase', background: armed ? tokens.armedGround : 'transparent' }}>
        {t(armed ? 'teeAlert.armed' : 'teeAlert.unarmed')}
      </Button>
      {armed && needsNotifications ? (
        <Link to="/manage/notifications" style={{ display: 'block', textAlign: 'center', color: OVERVIEW.amber,
          fontSize: tokens.size, fontWeight: tokens.weight, marginTop: 4 }}>
          {t('teeAlert.turnOnNotifications')}
        </Link>
      ) : null}
    </div>
  );
}

export function TeeAlertButton({ tournamentId, round }: { tournamentId: string; round: number }) {
  const { t } = useTranslation('tourhub');
  const alert = useTourTeeAlert(tournamentId, round);
  const push = usePushNotifications();
  // This existing hook treats a missing device row as enabled; it cannot prove
  // registration. Unknown/enabled keep the plain label, never invent a check.
  const needsNotifications = alert.muted || push.state === 'disabled' || push.state === 'unavailable';
  return <TeeAlertControl armed={alert.armed} disabled={alert.disabled || alert.pending}
    needsNotifications={needsNotifications} onToggle={() => {
      void alert.toggle().catch(() => toast.error(t('teeAlert.writeFailed')));
    }} />;
}