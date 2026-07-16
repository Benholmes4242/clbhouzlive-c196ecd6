import { cn } from '@/lib/utils';
import { FileText, Clock, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TourHubEmptyStateProps {
  variant: 'leaderboard' | 'schedule' | 'players';
  className?: string;
}

const iconByVariant = {
  leaderboard: BarChart3,
  schedule: Clock,
  players: FileText,
} as const;

export function TourHubEmptyState({ variant, className }: TourHubEmptyStateProps) {
  const { t } = useTranslation('common');
  const Icon = iconByVariant[variant] ?? FileText;
  const title = t(`empty.${variant}.title`);
  const message = t(`empty.${variant}.body`);

  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <div className="text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
          <Icon className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-medium text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
