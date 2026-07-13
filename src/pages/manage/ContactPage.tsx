import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const INK = '#0F172A';
const INK_55 = '#64748B';
const CARD_BORDER = 'rgba(15,23,42,0.07)';

const CATEGORIES = [
  { value: 'bug', label: 'Bug' },
  { value: 'account', label: 'Account' },
  { value: 'handicap', label: 'Handicap / WHS' },
  { value: 'billing', label: 'Billing' },
  { value: 'report', label: 'Report a problem' },
  { value: 'other', label: 'Other' },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]['value'];

export default function ContactPage() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();

  const [category, setCategory] = useState<CategoryValue>('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const canSubmit =
    !submitting && subject.trim().length > 0 && message.trim().length > 0 && !!user?.id;

  const handleSubmit = async () => {
    if (!canSubmit || !user?.id) return;
    setSubmitting(true);
    try {
      const { data: ticket, error: ticketErr } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          category,
          subject: subject.trim(),
        })
        .select('id')
        .single();
      if (ticketErr || !ticket) throw ticketErr ?? new Error('Failed to create ticket');

      const { error: msgErr } = await supabase.from('support_messages').insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        sender_role: 'user',
        body: message.trim(),
      });
      if (msgErr) throw msgErr;

      // Fire-and-forget notify email
      supabase.functions.invoke('support-ticket-notify', {
        body: { ticketId: ticket.id },
      }).catch((e) => console.warn('support-ticket-notify failed', e));

      setSubmittedId(ticket.id);
    } catch (e: any) {
      console.error('support submit failed', e);
      toast.error(e?.message || 'Could not send your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedId) {
    return (
      <ManagePageShell title="Contact support">
        <div className="px-4 pt-6">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}
          >
            <div className="flex justify-center mb-3">
              <CheckCircle2 size={40} style={{ color: '#2F6B4F' }} />
            </div>
            <h3 className="text-[17px] font-semibold mb-1" style={{ color: INK }}>
              Request received
            </h3>
            <p className="text-[14px] leading-relaxed mb-4" style={{ color: INK_55 }}>
              Thanks - we've received your request and will reply soon. You can view it in
              My requests.
            </p>
            <button
              type="button"
              onClick={() => navigate('/manage/requests')}
              className="w-full min-h-[44px] rounded-xl text-[15px] font-semibold text-white"
              style={{ background: INK }}
            >
              Go to my requests
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmittedId(null);
                setSubject('');
                setMessage('');
              }}
              className="w-full min-h-[44px] mt-2 text-[14px] font-medium"
              style={{ color: INK_55 }}
            >
              Send another request
            </button>
          </div>
        </div>
      </ManagePageShell>
    );
  }

  return (
    <ManagePageShell title="Contact support">
      <div className="px-4 pt-4 space-y-4 pb-0">
        <div
          className="rounded-2xl p-4"
          style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}
        >
          <p className="text-[13.5px] leading-relaxed" style={{ color: INK_55 }}>
            Tell us what's going on and we'll get back to you. Include as much detail as
            possible so we can help fast.
          </p>
        </div>

        {/* Category */}
        <div>
          <label
            className="text-[11px] font-semibold uppercase tracking-[1.5px] mb-2 block px-1"
            style={{ color: INK_55 }}
          >
            Category
          </label>
          <div
            className="rounded-2xl p-2 grid grid-cols-2 gap-2"
            style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}
          >
            {CATEGORIES.map((c) => {
              const active = c.value === category;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className="min-h-[40px] rounded-lg text-[13.5px] font-medium transition-colors"
                  style={{
                    background: active ? INK : 'transparent',
                    color: active ? '#fff' : INK,
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label
            className="text-[11px] font-semibold uppercase tracking-[1.5px] mb-2 block px-1"
            style={{ color: INK_55 }}
          >
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={140}
            placeholder="Short summary"
            className="w-full h-12 px-4 rounded-2xl text-[15px] outline-none"
            style={{
              background: '#fff',
              border: `1px solid ${CARD_BORDER}`,
              color: INK,
            }}
          />
        </div>

        {/* Message */}
        <div>
          <label
            className="text-[11px] font-semibold uppercase tracking-[1.5px] mb-2 block px-1"
            style={{ color: INK_55 }}
          >
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What happened? Include steps, device, and anything else that helps us reproduce it."
            rows={7}
            className="w-full p-4 rounded-2xl text-[15px] outline-none resize-none leading-relaxed"
            style={{
              background: '#fff',
              border: `1px solid ${CARD_BORDER}`,
              color: INK,
              minHeight: 160,
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full min-h-[48px] rounded-2xl text-[15px] font-semibold text-white transition-opacity"
          style={{ background: INK, opacity: canSubmit ? 1 : 0.5 }}
        >
          {submitting ? 'Sending...' : 'Send request'}
        </button>
      </div>
    </ManagePageShell>
  );
}
