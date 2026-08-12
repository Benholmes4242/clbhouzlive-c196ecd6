import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Cover guidance line. Mounted BESIDE the avatar (flex row, bottom-aligned)
 * so it never sits between the cover edge and the avatar. Shared by the
 * personal and business editors - do not inline a copy.
 */
export const CoverGuidance: React.FC = () => {
  const { t } = useTranslation('profile');
  return (
    <p
      style={{
        margin: 0,
        flex: 1,
        minWidth: 0,
        paddingBottom: 2,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: 11.5,
        fontWeight: 500,
        lineHeight: 1.35,
        color: 'hsl(var(--muted-foreground))',
      }}
    >
      {t('hero.coverGuidance')}
    </p>
  );
};
