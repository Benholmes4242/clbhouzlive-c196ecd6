import React from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LegalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'terms' | 'privacy' | 'guidelines';
}

const LEGAL_CONTENT = {
  terms: {
    title: 'Terms of Service',
    url: 'https://clbhouz.com/legal/terms',
    summary: [
      'By using Clbhouz, you agree to these terms.',
      'You must be at least 13 years old to use this service.',
      'You are responsible for your account and the content you post.',
      'We reserve the right to suspend accounts that violate our policies.',
      'These terms may be updated from time to time.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    url: 'https://clbhouz.com/legal/privacy',
    summary: [
      'We collect information you provide and usage data to improve your experience.',
      'Your data is stored securely and never sold to third parties.',
      'We use cookies for authentication and analytics.',
      'You can request deletion of your data at any time.',
      'We may share data with service providers who help run our platform.',
    ],
  },
  guidelines: {
    title: 'Community Guidelines',
    url: 'https://clbhouz.com/legal/guidelines',
    summary: [
      'Be respectful and supportive of other golfers.',
      'No harassment, hate speech, or discriminatory content.',
      'Keep content golf-related and appropriate for all audiences.',
      'Do not spam, post misleading content, or impersonate others.',
      'Violations may result in content removal or account suspension.',
    ],
  },
};

export function LegalSheet({ open, onOpenChange, type }: LegalSheetProps) {
  const content = LEGAL_CONTENT[type];

  const handleOpenExternal = () => {
    window.open(content.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <BottomSheet open={open} onClose={() => onOpenChange(false)} ariaLabelledBy="legal-sheet-title">
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
          <h2 id="legal-sheet-title" className="text-lg font-semibold text-[#1F2428] mb-4">
            {content.title}
          </h2>

          <div className="space-y-3 mb-6">
            <p className="text-[12px] font-medium text-[#97A1AA] uppercase tracking-wide">
              Summary
            </p>
            <ul className="space-y-3">
              {content.summary.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#97A1AA] mt-1.5 flex-shrink-0" />
                  <span className="text-[14px] text-[#5E666D]">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* External link button */}
          <button
            onClick={handleOpenExternal}
            className="w-full flex items-center justify-center gap-2 bg-[#F8FAFC] border border-[#E4E6E9] rounded-lg p-4 hover:bg-[#F1F5F9] transition-colors"
          >
            <span className="text-[13px] font-medium text-[#1F2428]">
              Read full {content.title.toLowerCase()}
            </span>
            <ExternalLink className="w-4 h-4 text-[#5E666D]" />
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[#E4E6E9]">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full h-12 bg-[#1F2428] text-white hover:bg-[#2A3038] font-medium"
          >
            Done
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
