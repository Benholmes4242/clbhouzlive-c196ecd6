import React, { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Globe, Check } from 'lucide-react';
import { toast } from '@/lib/toast';
import { openExternalUrl } from '@/utils/median/openExternalUrl';

interface ExternalLinkSheetProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

const DEFAULT_TITLE = 'Official Website';

const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
  }
};

export const ExternalLinkSheet: React.FC<ExternalLinkSheetProps> = ({
  isOpen,
  onClose,
  url,
  title = DEFAULT_TITLE,
}) => {
  const [copied, setCopied] = useState(false);

  const domain = extractDomain(url);
  const hasCustomTitle = title && title !== DEFAULT_TITLE;
  const contextLine = hasCustomTitle ? `${title} · official website` : title;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleOpenWebsite = () => {
    openExternalUrl(url);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl bg-background border-t border-border px-0 pb-8"
      >
        {/* Grabber Handle */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="w-9 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        <div className="px-6">
          {/* Overline */}
          <div
            className="text-center uppercase"
            style={{
              fontSize: '10.5px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: 'rgba(15,23,42,0.45)',
            }}
          >
            LEAVING CLBHOUZ
          </div>

          {/* Plaque */}
          <div
            className="flex flex-col items-center text-center"
            style={{
              marginTop: 12,
              background: '#ffffff',
              border: '0.5px solid rgba(15,23,42,0.08)',
              borderRadius: 16,
              boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
              padding: '18px 16px',
            }}
          >
            {/* Globe squircle */}
            <div
              className="flex items-center justify-center"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(247,147,30,0.1)',
                border: '1px solid rgba(247,147,30,0.25)',
              }}
            >
              <Globe style={{ width: 22, height: 22, color: '#F7931E' }} />
            </div>

            {/* Domain */}
            <div
              className="w-full truncate"
              style={{
                marginTop: 10,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: '#0F172A',
              }}
              title={domain}
            >
              {domain}
            </div>

            {/* Context line */}
            <div
              className="w-full truncate"
              style={{
                marginTop: 3,
                fontSize: 11.5,
                fontWeight: 500,
                color: 'rgba(15,23,42,0.45)',
              }}
            >
              {contextLine}
            </div>

            {/* Split actions */}
            <div className="w-full flex" style={{ gap: 9, marginTop: 14 }}>
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  flex: 1,
                  background: '#ffffff',
                  border: '0.5px solid rgba(15,23,42,0.08)',
                  color: copied ? '#16a34a' : '#0F172A',
                  fontSize: 13.5,
                  fontWeight: 700,
                  borderRadius: 14,
                  padding: '13px 0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {copied ? (
                  <>
                    <Check style={{ width: 14, height: 14 }} />
                    Copied
                  </>
                ) : (
                  'Copy link'
                )}
              </button>
              <button
                type="button"
                onClick={handleOpenWebsite}
                style={{
                  flex: 2,
                  background: '#F7931E',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 13.5,
                  fontWeight: 700,
                  borderRadius: 14,
                  padding: '13px 0',
                }}
              >
                Visit website
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExternalLinkSheet;
