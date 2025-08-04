import React from 'react';
import { Link, Trophy, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectHandicapPromptProps {
  onConnectClick?: () => void;
  onManualEntryClick?: () => void;
  className?: string;
}

const ConnectHandicapPrompt: React.FC<ConnectHandicapPromptProps> = ({
  onConnectClick,
  onManualEntryClick,
  className = ''
}) => {
  return (
    <div className={`bg-muted border border-border rounded-lg p-8 text-center ${className}`}>
      {/* Icon */}
      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <TrendingUp className="h-8 w-8 text-primary" />
      </div>
      
      {/* Heading */}
      <h3 className="text-xl font-bold text-foreground mb-2">
        Track Your Handicap Progress
      </h3>
      
      {/* Description */}
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Connect your England Golf account or manually enter rounds to track your handicap history and see detailed progress analytics.
      </p>
      
      {/* Benefits list */}
      <div className="space-y-2 mb-6 text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <span>Automatic handicap calculation</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span>Visual progress tracking</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Link className="h-4 w-4 text-primary" />
          <span>Round-by-round history</span>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button 
          onClick={onConnectClick}
        >
          <Link className="h-4 w-4 mr-2" />
          Connect England Golf
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onManualEntryClick}
        >
          Enter Rounds Manually
        </Button>
      </div>
      
      {/* Footer note */}
      <p className="text-xs text-muted-foreground mt-4">
        Your handicap data is kept private and secure
      </p>
    </div>
  );
};

export default ConnectHandicapPrompt;