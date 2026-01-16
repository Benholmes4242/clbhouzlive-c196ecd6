import React from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface HelpCentreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FAQ_ITEMS = [
  {
    question: 'How do I edit my profile?',
    answer: 'Go to Settings → Profile to update your name, bio, profile photo and club affiliation.',
  },
  {
    question: 'How do I find and follow other golfers?',
    answer: 'Use the Explore tab to discover golfers near you or search by username. Tap Follow on their profile to stay updated.',
  },
  {
    question: 'How do I rate a golf course?',
    answer: 'Visit a course page and tap "Rate this course". You can score different aspects like design, condition, and facilities.',
  },
  {
    question: 'What is Creator Mode?',
    answer: 'Creator Mode enables enhanced content features like long-form videos and creator tools on your profile. Enable it in Settings → Identity & Creator.',
  },
  {
    question: 'How do I block someone?',
    answer: 'Visit their profile, tap the three dots menu, and select "Block". You can manage blocked users in Settings.',
  },
  {
    question: 'How do I delete my account?',
    answer: 'Go to Settings → Danger Zone → Delete account. This action is permanent and cannot be undone.',
  },
];

export function HelpCentreSheet({ open, onOpenChange }: HelpCentreSheetProps) {
  const handleContactSupport = () => {
    window.open('mailto:support@clbhouz.com', '_blank');
  };

  return (
    <BottomSheet open={open} onClose={() => onOpenChange(false)} ariaLabelledBy="help-centre-title">
      <div className="flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E6E9]">
          <div className="w-8" />
          <div className="flex-1 flex justify-center">
            <div className="w-9 h-1 bg-[#D1D5DB] rounded-full" />
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#5E666D]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <h2 id="help-centre-title" className="text-lg font-semibold text-[#1F2428] mb-4">
            Help centre
          </h2>

          <Accordion type="single" collapsible className="w-full space-y-2">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-[#E4E6E9] rounded-lg px-4 bg-white"
              >
                <AccordionTrigger className="text-left text-[14px] font-medium text-[#1F2428] hover:no-underline py-3">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-[13px] text-[#5E666D] pb-3">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[#E4E6E9]">
          <Button
            onClick={handleContactSupport}
            className="w-full h-12 bg-[#1F2428] text-white hover:bg-[#2A3038] font-medium"
          >
            Contact support
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
