import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title,
  message,
  onRetry,
  className
}: ErrorStateProps) {
  const { t } = useTranslation('common');
  const resolvedTitle = title ?? t('state.somethingWentWrong');
  const resolvedMessage = message ?? t('errors.genericBody');
  return (
    <div className={cn(
      "bg-surface-card border border-border-subtle rounded-sq-lg p-8 text-center",
      className
    )}>
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-destructive" />
      </div>
      
      <h3 className="text-body-lg font-semibold text-text-primary mb-2">
        {resolvedTitle}
      </h3>
      
      <p className="text-body-sm text-text-secondary max-w-sm mx-auto mb-4">
        {resolvedMessage}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sq-sm bg-surface-alt border border-border-subtle text-text-primary text-body-sm font-medium hover:bg-surface-input-hover transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t('action.tryAgain')}
        </button>
      )}
    </div>
  );
}
