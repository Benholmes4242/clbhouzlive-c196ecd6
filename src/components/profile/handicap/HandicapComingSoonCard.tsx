import React from 'react';
import { Zap } from 'lucide-react';

const HandicapComingSoonCard: React.FC = () => {
  return (
    <div className="flex min-h-[420px] items-center justify-center px-4 pb-12">
      <div className="max-w-[440px] w-full bg-muted border border-border rounded-sq-lg px-6 py-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-accent/10 rounded-sq-md mb-4">
          <Zap className="h-6 w-6 text-primary-accent" />
        </div>
        
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Coming soon
        </p>
        
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Handicap sync with England Golf
        </h2>
        
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          We're working on an official integration with England Golf so your 
          handicap updates automatically after every qualifying round – no 
          manual score entry needed.
        </p>
        
        <ul className="mb-6 space-y-2 text-sm text-muted-foreground text-left">
          <li className="flex items-start gap-2">
            <span className="text-primary-accent">•</span>
            <span>Live handicap index straight from England Golf</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-accent">•</span>
            <span>Automatic updates after every round</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-accent">•</span>
            <span>Friend comparisons and monthly leaderboards</span>
          </li>
        </ul>
        
        <p className="text-xs text-muted-foreground/70">
          Future view · Powered by England Golf (pending partnership)
        </p>
      </div>
    </div>
  );
};

export default HandicapComingSoonCard;
