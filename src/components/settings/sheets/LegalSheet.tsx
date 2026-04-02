import { X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LegalSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] bg-background border-0 px-5 max-h-[80vh] overflow-y-auto"
        hideCloseButton
        style={{ paddingBottom: 'calc(var(--sab) + 24px)' }}
      >
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mt-3 mb-4" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold tracking-tight text-foreground">Legal</h2>
          <button onClick={onClose} className="flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 text-[14px] text-muted-foreground leading-relaxed">
          <section>
            <h3 className="text-[16px] font-semibold text-foreground mb-2">Terms of Service</h3>
            <p>By using Clbhouz, you agree to these Terms of Service. You must be 13 or older to create an account. You are responsible for maintaining the security of your account and all activity that occurs under it.</p>
            <p className="mt-2">We reserve the right to suspend or terminate accounts that violate our community standards, post illegal content, or engage in behaviour that harms other users.</p>
          </section>

          <section>
            <h3 className="text-[16px] font-semibold text-foreground mb-2">Privacy Policy</h3>
            <p>We collect information you provide directly (profile data, posts, scorecards) and information generated through your use of Clbhouz (activity, device info, location when permitted).</p>
            <p className="mt-2">We do not sell your personal data to third parties. We use your data to provide and improve the Clbhouz service, personalise your experience, and send relevant notifications.</p>
          </section>

          <section>
            <h3 className="text-[16px] font-semibold text-foreground mb-2">Community Guidelines</h3>
            <p>Clbhouz is a golf community. We expect all members to treat each other with respect. Harassment, hate speech, spam, and impersonation are not permitted and may result in permanent account removal.</p>
            <p className="mt-2">All content must relate to golf or the golf lifestyle. Off-topic commercial promotion is not allowed without prior approval from our team.</p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
