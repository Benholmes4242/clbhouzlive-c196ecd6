/**
 * SectionErrorState - Reusable error fallback for Tour Overview sections (FIX 08)
 * Matches section visual style with retry capability
 */

import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SectionErrorStateProps {
  sectionName: string;
  onRetry?: () => void;
  isOffline?: boolean;
}

export function SectionErrorState({ sectionName, onRetry, isOffline }: SectionErrorStateProps) {
  const Icon = isOffline ? WifiOff : AlertCircle;
  const { t } = useTranslation(['common', 'tourhub']);

  return (
    <div className="mx-4 rounded-2xl bg-card border border-border/[0.05] p-6 text-center">
      <Icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">
        {t('common:errors.sectionLoadFailed', { section: sectionName })}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-foreground active:scale-95 transition-transform"
          aria-label={t('tourhub:section.retryAria', { section: sectionName })}
        >
          <RefreshCw className="w-3 h-3" />
          {t('common:action.tapToRetry')}
        </button>
      )}
    </div>
  );
}
