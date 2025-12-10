import React from 'react';
import { Building2, Globe, BarChart3, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CreateBusinessProfileIntroModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const BenefitRow = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 mt-0.5">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <span className="text-sm text-muted-foreground">{text}</span>
  </div>
);

/**
 * Intro modal shown when a personal user clicks "Create Business Profile"
 * Explains the benefits before opening the Edit Profile modal in business mode
 */
export const CreateBusinessProfileIntroModal: React.FC<CreateBusinessProfileIntroModalProps> = ({
  open,
  onClose,
  onContinue,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-sq-lg sm:rounded-sq-lg">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Create a Business Profile</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Turn your golfer account into a business profile so golfers can discover your club, academy, shop or brand on Clbhouz.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <BenefitRow 
            icon={Globe} 
            text="Show up in the Business Directory" 
          />
          <BenefitRow 
            icon={MapPin} 
            text="Add your website, contact info and location" 
          />
          <BenefitRow 
            icon={BarChart3} 
            text="Access Business Insights (profile views, clicks, engagement)" 
          />
        </div>

        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Not now
          </Button>
          <Button
            onClick={() => {
              onContinue();
              onClose();
            }}
            className="w-full sm:w-auto"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBusinessProfileIntroModal;
