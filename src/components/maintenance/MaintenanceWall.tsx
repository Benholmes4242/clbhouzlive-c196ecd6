/**
 * MaintenanceWall — the full-screen "we'll be back" surface.
 *
 * Light analytical treatment: #F4F6F9 canvas, centred column, one quiet
 * Action (no filled amber). Safe-area padded top and bottom so nothing sits
 * under the notch or the home indicator in the WebView.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

const INK = '#0E1216';
const DIM = '#68707B';
const CANVAS = '#F4F6F9';

const FALLBACK_MESSAGE =
  "We've listened to your early feedback and we're making changes to bring better data and analytics into clbhouz. We'll be back online in a few days - bear with us.";


interface Props {
  message?: string | null;
}

export function MaintenanceWall({ message }: Props) {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  const handleCheckAgain = () => {
    queryClient.invalidateQueries({ queryKey: ['app-config', 'maintenance'] });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        background: CANVAS,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
        paddingLeft: 20,
        paddingRight: 20,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 340,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <img
          src="/assets/logomark-orange.png"
          alt=""
          aria-hidden
          width={44}
          height={44}
          style={{ width: 44, height: 44, objectFit: 'contain', marginBottom: 18 }}
        />

        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#0E1216',
          }}
        >
          {t('maintenance.kicker', { defaultValue: 'MAINTENANCE' })}
        </div>

        <h1
          style={{
            margin: '8px 0 0',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: INK,
          }}
        >
          {t('maintenance.headline', { defaultValue: "We're undergoing some maintenance" })}
        </h1>


        <p
          style={{
            margin: '10px 0 0',
            fontSize: 14,
            lineHeight: 1.55,
            fontWeight: 500,
            color: DIM,
          }}
        >
          {message?.trim() ? message : FALLBACK_MESSAGE}
        </p>

        <button
          type="button"
          onClick={handleCheckAgain}
          style={{
            marginTop: 24,
            background: 'transparent',
            border: 0,
            padding: '6px 2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#0E1216',
            cursor: 'pointer',
          }}
        >
          {t('maintenance.checkAgain', { defaultValue: 'Check again' })}
          <span aria-hidden style={{ fontSize: 13, lineHeight: 1 }}>
            {'\u203A'}
          </span>
        </button>
      </div>
    </div>
  );
}

export default MaintenanceWall;
