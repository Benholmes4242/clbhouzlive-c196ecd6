import { Copy, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Button } from '@/components/ui/button';

const INK_55 = '#64748B';
const SUPPORT_EMAIL = 'support@clbhouz.com';

export default function ContactPage() {
  const handleCopy = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    toast.success('Support email copied to clipboard.');
  };

  const handleEmail = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}`;
  };

  return (
    <ManagePageShell title="Contact support">
      <div className="px-4 pt-4 space-y-4">
        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.07)' }}>
          <p className="text-[14px] leading-relaxed" style={{ color: INK_55 }}>
            Our support team is available Monday to Friday, 9am to 5pm GMT. We aim to respond within 24 hours.
          </p>
        </div>

        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.07)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] mb-2" style={{ color: INK_55 }}>
            Email
          </p>
          <div className="flex items-center gap-3">
            <Mail size={18} style={{ color: INK_55 }} className="shrink-0" />
            <p className="text-[15px] font-medium text-foreground flex-1 break-all">{SUPPORT_EMAIL}</p>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center min-h-[40px] min-w-[40px]"
              style={{ color: INK_55 }}
              aria-label="Copy email"
            >
              <Copy size={18} />
            </button>
          </div>
        </div>

        <Button className="w-full min-h-[44px]" onClick={handleEmail}>
          Open in mail
        </Button>
      </div>
    </ManagePageShell>
  );
}
