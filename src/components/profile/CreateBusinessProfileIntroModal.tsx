import React from 'react';
import { Building2, Search, Shield, BarChart3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

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
  <div className="flex items-start gap-3 py-3">
    <div className="w-9 h-9 rounded-xl bg-[hsl(38,92%,50%)]/10 flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4 text-[hsl(38,92%,50%)]" />
    </div>
    <div>
      <p className="text-[14px] font-semibold text-foreground">{title}</p>
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
      <DialogContent className="max-w-md rounded-none sm:rounded-2xl bg-background">
        <DialogHeader className="text-center sm:text-center">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>

          {/* Title */}
          <h2 className="text-[20px] font-bold text-foreground">
            Create your business presence
          </h2>

          {/* Subtitle */}
          <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed">
            Be discovered by golfers, build credibility through reviews, and grow your brand inside the world's fastest-growing golf community.
          </p>
        </DialogHeader>

        {/* Benefit items */}
        <div className="mt-6 divide-y divide-border/30">
          <BenefitItem
            icon={Search}
            title="Be discoverable"
            body="Appear in clbhouz search and the business directory where golfers are already exploring."
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

        <DialogFooter className="mt-6 flex flex-col gap-0">
          {/* Primary CTA */}
          <button
            type="button"
            onClick={() => {
              onContinue();
              onClose();
            }}
            className="w-full bg-[hsl(38,92%,50%)] text-white min-h-[50px] rounded-2xl text-[15px] font-semibold hover:bg-[hsl(36,84%,46%)] active:scale-[0.97] transition-all"
          >
            Get Started
          </button>

          {/* Dismiss link */}
          <button
            type="button"
            onClick={onClose}
            className="w-full text-[14px] text-muted-foreground mt-3 min-h-[44px] active:text-foreground transition-colors"
          >
            Maybe later
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBusinessProfileIntroModal;
