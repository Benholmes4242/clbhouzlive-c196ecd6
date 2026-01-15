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
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] border border-[#FDBA74]/30 flex items-center justify-center flex-shrink-0">
      <Icon className="h-5 w-5 text-[#F79E1B]" />
    </div>
    <div>
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
          {/* Gradient icon */}
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-[#64748b]" />
          </div>
          
          {/* Title */}
          <h2 className="text-xl font-semibold text-foreground">
            Create your business presence
          </h2>
          
          {/* Subtitle */}
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Be discovered by golfers, build credibility through reviews, and grow your brand inside the world's fastest-growing golf community.
          </p>
        </DialogHeader>

        {/* Outcome-led benefits - no cards, just spacing */}
        <div className="mt-6 space-y-4">
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
