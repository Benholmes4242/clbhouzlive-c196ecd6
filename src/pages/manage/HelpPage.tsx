import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ManagePageShell } from '@/components/manage/ManagePageShell';

const INK_55 = '#64748B';

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
    a: 'Yes, go to Settings then Privacy and disable Public Profile. Only approved followers will see your content.',
  },
  {
    q: 'How do I report a user or post?',
    a: "Tap the three-dot menu on any post or visit a user's profile and select Report. Our moderation team reviews all reports.",
  },
];

export default function HelpPage() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <ManagePageShell title="Help centre">
      <div className="px-4 pt-4">
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.07)' }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgba(15,23,42,0.08)' }}>
              <button
                className="w-full flex items-center justify-between px-4 py-4 text-left min-h-[52px]"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <span className="text-[15px] font-medium text-foreground pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 transition-transform duration-200 ${expanded === i ? 'rotate-180' : ''}`}
                  style={{ color: INK_55 }}
                />
              </button>
              {expanded === i && (
                <p className="text-[14px] px-4 pb-4 leading-relaxed" style={{ color: INK_55 }}>{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </ManagePageShell>
  );
}
