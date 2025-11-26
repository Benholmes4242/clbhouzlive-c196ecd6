import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface SocialListPageShellProps {
  title: string;
  subtitle?: string;
  count?: number;
  children: React.ReactNode;
  backPath: string;
}

export const SocialListPageShell: React.FC<SocialListPageShellProps> = ({
  title,
  subtitle,
  count,
  children,
  backPath
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(backPath)}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-heading-md font-semibold">
              {title}
              {count !== undefined && <span className="text-muted-foreground ml-1">({count})</span>}
            </h1>
            {subtitle && (
              <p className="text-body-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl">
        {children}
      </div>
    </div>
  );
};
