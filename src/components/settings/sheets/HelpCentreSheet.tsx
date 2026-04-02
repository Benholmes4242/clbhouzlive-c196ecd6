import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const FAQS = [
  {
    q: 'How do I change my username?',
    a: 'Usernames can be changed once every 30 days. Go to your Profile page, tap Edit Profile, and update your username there.',
  },
  {
    q: 'How does the handicap index work?',
    a: 'Your handicap index is calculated from your submitted scorecards using the World Handicap System (WHS). Submit at least 3 rounds to establish your index.',
  },
  {
    q: 'What is Creator Mode?',
    a: 'Creator Mode unlocks advanced analytics, monetisation tools, and a dedicated creator profile separate from your personal profile.',
  },
  {
    q: 'How do I delete a post?',
    a: 'Tap the three-dot menu on any of your posts and select Delete. Video posts may take a few moments to fully remove.',
  },
  {
    q: 'Can I make my profile private?',
    a: 'Yes — go to Settings > Privacy & Safety and disable Public Profile. Only approved followers will see your content.',
  },
  {
    q: 'How do I report a user or post?',
    a: "Tap the three-dot menu on any post or visit a user's profile and select Report. Our moderation team reviews all reports.",
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function HelpCentreSheet({ open, onClose }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

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
          <h2 className="text-[20px] font-bold tracking-tight text-foreground">Help Centre</h2>
          <button onClick={onClose} className="flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-1">
          {FAQS.map((faq, i) => (
            <div key={i} className="border-b border-border last:border-0">
              <button
                className="w-full flex items-center justify-between py-4 text-left min-h-[44px]"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <span className="text-[15px] font-medium text-foreground pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-muted-foreground transition-transform duration-200 ${expanded === i ? 'rotate-180' : ''}`}
                />
              </button>
              {expanded === i && (
                <p className="text-[14px] text-muted-foreground pb-4 leading-relaxed">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
