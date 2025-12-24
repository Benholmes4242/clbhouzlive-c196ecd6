import React from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { X, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ContactSupportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUPPORT_EMAIL = 'support@clbhouz.com';

export function ContactSupportSheet({ open, onOpenChange }: ContactSupportSheetProps) {
  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      toast.success('Email copied');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleOpenEmail = () => {
    window.open(`mailto:${SUPPORT_EMAIL}`, '_blank');
  };

  return (
    <BottomSheet open={open} onClose={() => onOpenChange(false)} ariaLabelledBy="contact-support-title">
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
          <h2 id="contact-support-title" className="text-lg font-semibold text-[#1F2428] mb-2">
            Contact support
          </h2>
          <p className="text-[13px] text-[#5E666D] mb-6">
            Get in touch with our team and we'll help you out.
          </p>

          {/* Email display */}
          <div className="bg-[#F8FAFC] border border-[#E4E6E9] rounded-lg p-4 mb-4">
            <p className="text-[12px] text-[#97A1AA] mb-1">Support email</p>
            <p className="text-[16px] font-medium text-[#1F2428]">{SUPPORT_EMAIL}</p>
          </div>

          <p className="text-[12px] text-[#97A1AA] text-center">
            We typically respond within 24 hours.
          </p>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[#E4E6E9] space-y-3">
          <Button
            onClick={handleCopyEmail}
            variant="outline"
            className="w-full h-12 border-[#E4E6E9] text-[#1F2428] hover:bg-[#F3F4F6] font-medium"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy email
          </Button>
          <Button
            onClick={handleOpenEmail}
            className="w-full h-12 bg-[#1F2428] text-white hover:bg-[#2A3038] font-medium"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open email app
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
