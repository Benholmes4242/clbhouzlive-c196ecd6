import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { scrollPageToTop } from '@/lib/getScrollParent';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { FIELD_PAINT_CLASS, FIELD_PLACEHOLDER_CLASS } from '@/lib/tokens/field';


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
  const [searchParams] = useSearchParams();
  const { user } = useSupabaseSession();

  const initialCategory: CategoryValue = (() => {
    const raw = searchParams.get('category');
    const match = CATEGORIES.find((c) => c.value === raw);
    return match ? match.value : 'bug';
  })();
  const initialSubject = searchParams.get('subject') ?? '';

  const [category, setCategory] = useState<CategoryValue>(initialCategory);
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    scrollPageToTop('auto');
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
    } catch (e) {
      console.error('support submit failed', e);
      const msg = e instanceof Error ? e.message : 'Could not send your request. Please try again.';
      toast.error(msg);
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
            style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
          >
            <div className="flex justify-center mb-3">
              <CheckCircle2 size={40} style={{ color: '#2F6B4F' }} />
            </div>
            <h3 className="text-[17px] font-semibold mb-1" style={{ color: A.INK }}>
              Request received
            </h3>
            <p className="text-[14px] leading-relaxed mb-4" style={{ color: A.MUTE }}>
              Thanks - we've received your request and will reply soon. You can view it in
              My requests.
            </p>
            <button
              type="button"
              onClick={() => navigate('/manage/requests')}
              className="w-full min-h-[44px] rounded-xl text-[15px] font-semibold"
              style={{ background: A.INK, color: A.CANVAS }}
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
              style={{ color: A.MUTE }}
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
          style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
        >
          <p className="text-[13.5px] leading-relaxed" style={{ color: A.MUTE }}>
            Tell us what's going on and we'll get back to you. Include as much detail as
            possible so we can help fast. We aim to respond to all requests within 24 hours.
          </p>
        </div>

        {/* Category */}
        <div>
          <label
            className="text-[11px] font-semibold uppercase tracking-[1.5px] mb-2 block px-1"
            style={{ color: A.MUTE }}
          >
            Category
          </label>
          <div
            className="rounded-2xl p-2 grid grid-cols-2 gap-2"
            style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
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
                    background: active ? A.INK : 'transparent',
                    color: active ? A.CANVAS : A.INK,
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
            style={{ color: A.MUTE }}
          >
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={140}
            placeholder="Short summary"
            /* FIELD CANON (lib/tokens/field.ts): 6% well, radius 14, height 44
               (was 48 on an A.PANEL slab). Stands alone, no exception. */
            className={`${FIELD_PAINT_CLASS} ${FIELD_PLACEHOLDER_CLASS} w-full h-11 px-4 text-[15px] outline-none`}
            style={{ color: A.INK }}
          />
        </div>

        {/* Message */}
        <div>
          <label
            className="text-[11px] font-semibold uppercase tracking-[1.5px] mb-2 block px-1"
            style={{ color: A.MUTE }}
          >
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What happened? Include steps, device, and anything else that helps us reproduce it."
            rows={7}
            /* FIELD CANON (lib/tokens/field.ts). Textarea: minHeight governs. */
            className={`${FIELD_PAINT_CLASS} ${FIELD_PLACEHOLDER_CLASS} w-full p-4 text-[15px] outline-none resize-none leading-relaxed`}
            style={{ color: A.INK, minHeight: 160 }}
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full min-h-[48px] rounded-2xl text-[15px] font-semibold transition-opacity"
          style={{ background: A.INK, color: A.CANVAS, opacity: canSubmit ? 1 : 0.5 }}
        >
          {submitting ? 'Sending...' : 'Send request'}
        </button>
      </div>
    </ManagePageShell>
  );
}
