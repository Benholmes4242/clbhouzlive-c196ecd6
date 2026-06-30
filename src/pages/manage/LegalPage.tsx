import { ManagePageShell } from '@/components/manage/ManagePageShell';

const INK_55 = '#64748B';

const SECTIONS = [
  {
    title: 'Terms of Service',
    body: [
      'By using clbhouz, you agree to these Terms of Service. You must be 13 or older to create an account. You are responsible for maintaining the security of your account and all activity that occurs under it.',
      'We reserve the right to suspend or terminate accounts that violate our community standards, post illegal content, or engage in behaviour that harms other users.',
    ],
  },
  {
    title: 'Privacy Policy',
    body: [
      'We collect information you provide directly (profile data, posts, scorecards) and information generated through your use of clbhouz (activity, device info, location when permitted).',
      'We do not sell your personal data to third parties. We use your data to provide and improve the clbhouz service, personalise your experience, and send relevant notifications.',
    ],
  },
  {
    title: 'Community Guidelines',
    body: [
      'clbhouz is a golf community. We expect all members to treat each other with respect. Harassment, hate speech, spam, and impersonation are not permitted and may result in permanent account removal.',
      'All content must relate to golf or the golf lifestyle. Off-topic commercial promotion is not allowed without prior approval from our team.',
    ],
  },
];

export default function LegalPage() {
  return (
    <ManagePageShell title="Legal">
      <div className="px-4 pt-4 space-y-4">
        {SECTIONS.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl p-4"
            style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.07)' }}
          >
            <h3 className="text-[16px] font-semibold text-foreground mb-2">{s.title}</h3>
            <div className="space-y-2 text-[14px] leading-relaxed" style={{ color: INK_55 }}>
              {s.body.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        ))}
      </div>
    </ManagePageShell>
  );
}
