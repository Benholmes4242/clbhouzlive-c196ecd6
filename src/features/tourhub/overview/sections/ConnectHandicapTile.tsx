/**
 * ConnectHandicapTile — v4 amber CTA that closes the Overview page.
 *
 * Ports the gating from the deleted HomeConnectHandicapModule verbatim:
 *   - logged out            -> render null
 *   - auth or WHS loading   -> render null (no skeleton pop at the true
 *                              bottom of the page)
 *   - no WHS connection     -> render the amber tile (CTA)
 *   - connected             -> render null (never nag a connected user)
 *
 * The live module also showed a celebration "scorecard" variant while
 * the connection was < 7 days old; that variant is intentionally NOT
 * ported into this bottom-of-page CTA slot per the H12.1 mockup, which
 * specifies the amber tile as the sole rendering. Connected users see
 * nothing here, matching the "must not be nagged" rule.
 *
 * Tap destination: /handicap (same as the ported module).
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';

import { V4 } from '../tokens';

const AMBER_RGBA_STRONG = 'rgba(247,147,30,0.12)';
const AMBER_RGBA_WEAK = 'rgba(247,147,30,0.04)';
const AMBER_BORDER = 'rgba(247,147,30,0.3)';
// No private palette: these route through the overview ramp so the tile
// follows the token rather than drifting from it.
const INK = V4.ink;
const INK_SECONDARY = V4.inkMute;
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export function ConnectHandicapTile() {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const { user, loading: authLoading } = useSupabaseSession();
  const { data: connection, isLoading: whsLoading, isFetched: whsFetched } =
    useWhsConnection(user?.id);

  if (authLoading || !user) return null;
  if (whsLoading && !whsFetched) return null;
  if (connection) return null;

  const goConnect = () => navigate('/handicap');

  return (
    <div style={{ padding: '0 16px', fontFamily: FONT }}>
      <div
        style={{
          background: `linear-gradient(100deg, ${AMBER_RGBA_STRONG}, ${AMBER_RGBA_WEAK})`,
          border: `1px solid ${AMBER_BORDER}`,
          borderRadius: 18,
          padding: '15px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            {t('overview.connectHandicap.title')}
          </div>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 500,
              color: INK_SECONDARY,
              marginTop: 3,
              lineHeight: 1.3,
            }}
          >
            {t('overview.connectHandicap.description')}
          </div>
        </div>
        <button
          type="button"
          onClick={goConnect}
          style={{
            background: INK,
            // FILLED-ACTION: INK is near-white on dark, so the label takes
            // the canvas.
            color: V4.bg,
            fontFamily: FONT,
            fontSize: 12.5,
            fontWeight: 700,
            border: 'none',
            borderRadius: 14,
            padding: '9px 16px',
            cursor: 'pointer',
            flexShrink: 0,
            letterSpacing: '-0.005em',
          }}
        >
          {t('overview.connectHandicap.cta')}
        </button>
      </div>
    </div>
  );
}

export default ConnectHandicapTile;
