import { X, Copy, Mail } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SUPPORT_EMAIL = 'support@clbhouz.com';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ContactSupportSheet({ open, onClose }: Props) {
  const handleCopy = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    toast.success('Support email copied to clipboard.');
  };

  const handleEmail = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}`;
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] bg-background border-0 px-5"
        hideCloseButton
        style={{ paddingBottom: 'calc(var(--sab) + 24px)' }}
      >
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mt-3 mb-4" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold tracking-tight text-foreground">Contact Support</h2>
          <button onClick={onClose} className="flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        <p className="text-[14px] text-muted-foreground mb-6 leading-relaxed">
          Our support team is available Monday–Friday, 9am–5pm GMT. We aim to respond within 24 hours.
        </p>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted mb-6">
          <Mail size={20} className="text-muted-foreground shrink-0" />
          <p className="text-[15px] font-medium text-foreground flex-1">{SUPPORT_EMAIL}</p>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground"
            aria-label="Copy email"
          >
            <Copy size={18} />
          </button>
        </div>

        <Button className="w-full min-h-[44px]" onClick={handleEmail}>
          Open in Mail
        </Button>
      </SheetContent>
    </Sheet>
  );
}
