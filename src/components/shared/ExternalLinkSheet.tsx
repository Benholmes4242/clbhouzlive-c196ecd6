import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Check } from 'lucide-react';
import { toast } from '@/lib/toast';
import { openExternalUrl } from '@/utils/median/openExternalUrl';
import { KICKER, A } from '@/features/courses/components/holes/analytical/tokens';

/**
 * MICRO_BRIEF_TABS_SHEETS_MAP §3 — dark conversion.
 *
 * COPY CONFIRMATION IS ITS OWN MEANING. The tap on "Copy link" produces no
 * other feedback than this colour, so it does not resolve to the index-delta
 * improvement green or a live green; it takes the dark green of record for a
 * near-black surface (#4ADE80) plus a tinted well, so the change is
 * unmistakable rather than a hue nudge on a white button.
 */
const COPIED_INK = '#4ADE80';
const COPIED_FILL = 'rgba(74,222,128,0.12)';
const COPIED_BORDER = 'rgba(74,222,128,0.38)';

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
  const { t } = useTranslation(['common']);
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
        className="rounded-t-3xl border-t px-0 pb-8"
        style={{ background: A.PANEL, borderTopColor: A.BORDER }}
      >
        {/* Grabber Handle */}
        <div className="flex justify-center pt-2 pb-4">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} aria-hidden="true" />
        </div>

        <div className="px-6">
          {/* Overline */}
          <div className="text-center" style={{ ...KICKER, display: 'block' }}>
            {t('common:externalLink.overline')}
          </div>

          {/* Domain */}
          <div
            className="w-full truncate text-center"
            style={{
              marginTop: 12,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: A.INK,
            }}
            title={domain}
          >
            {domain}
          </div>

          {/* Context line */}
          <div
            className="w-full truncate text-center"
            style={{
              marginTop: 3,
              fontSize: 11.5,
              fontWeight: 500,
              color: A.MUTE,
            }}
          >
            {contextLine}
          </div>

          {/* Split actions */}
          <div className="w-full flex" style={{ gap: 9, marginTop: 18 }}>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                flex: 1,
                background: copied ? COPIED_FILL : 'rgba(255,255,255,0.06)',
                border: `1px solid ${copied ? COPIED_BORDER : A.BORDER}`,
                color: copied ? COPIED_INK : A.INK,
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
                  {t('common:externalLink.copied')}
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
                background: A.INK,
                border: 'none',
                color: A.PANEL,
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

      </SheetContent>
    </Sheet>
  );
};

export default ExternalLinkSheet;
