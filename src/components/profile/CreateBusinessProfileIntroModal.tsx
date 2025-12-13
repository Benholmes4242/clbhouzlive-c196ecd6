import React from 'react';
import { Building2, Search, Shield, BarChart3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CreateBusinessProfileIntroModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
}

interface BenefitItemProps {
  icon: React.ElementType;
  title: string;
  body: string;
}

const BenefitItem = ({ icon: Icon, title, body }: BenefitItemProps) => (
  <div className="flex flex-col items-center gap-2">
    <div className="flex-shrink-0">
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <div className="text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-[13px] text-muted-foreground leading-relaxed">{body}</p>
    </div>
  </div>
);

/**
 * Screen 1: Entry screen for business profile creation
 * Outcome-led value proposition with stronger CTA wording
 */
export const CreateBusinessProfileIntroModal: React.FC<CreateBusinessProfileIntroModalProps> = ({
  open,
  onClose,
  onContinue,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-none sm:rounded-sq-lg bg-background">
        <DialogHeader className="text-center sm:text-center">
          {/* Subtle slate icon */}
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          
          {/* Title */}
          <h2 className="text-xl font-semibold text-foreground text-center">
            Create Your Business Presence
          </h2>
          
          {/* Subtitle */}
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Be discovered by golfers, build credibility through reviews, and grow your brand inside the world's fastest-growing golf community.
          </p>
        </DialogHeader>

        {/* Outcome-led benefits - no cards, just spacing */}
        <div className="mt-6 space-y-4 text-center">
          <BenefitItem
            icon={Search}
            title="Be discoverable"
            body="Appear in search and the business directory where golfers are already exploring."
          />
          <BenefitItem
            icon={Shield}
            title="Build trust"
            body="Collect reviews and show real social proof from the golfing community."
          />
          <BenefitItem
            icon={BarChart3}
            title="Understand your reach"
            body="Track profile views, clicks, and engagement with Business Insights."
          />
        </div>

        <DialogFooter className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
          {/* Secondary: text button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Not now
          </button>
          
          {/* Primary: slate button */}
          <Button
            variant="secondary"
            onClick={() => {
              onContinue();
              onClose();
            }}
            className="w-full sm:w-auto"
          >
            Set up my business profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBusinessProfileIntroModal;
