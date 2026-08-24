import { useEffect, useRef, useState } from 'react';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import { Mail, Check } from 'lucide-react';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const HAIRLINE = `1px solid ${A.BORDER}`;
const DANGER = '#FF5A5A';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'\u2022'.repeat(Math.max(2, local.length - 2))}@${domain}`;
}

type Step = 'email' | 'code' | 'success';

export default function EmailPage() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();

  const [step, setStep] = useState<Step>('email');
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const emailValid = EMAIL_RE.test(newEmail.trim().toLowerCase());

  // Countdown for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const sendCode = async (): Promise<boolean> => {
    const target = newEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(target)) return false;
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: target });
      if (error) throw error;
      setResendCooldown(30);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not send code. Try again.';
      toast.error(msg);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendInitial = async () => {
    const ok = await sendCode();
    if (ok) {
      setCode('');
      setOtpError(null);
      setStep('code');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || submitting) return;
    setCode('');
    setOtpError(null);
    const ok = await sendCode();
    if (ok) toast.success('New code sent');
  };

  const handleVerify = async (token: string) => {
    if (token.length !== 6 || submitting) return;
    setSubmitting(true);
    setOtpError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: newEmail.trim().toLowerCase(),
        token,
        type: 'email_change',
      });
      if (error) throw error;
      setStep('success');
    } catch (err) {
      const e = err as { message?: string; status?: number } | undefined;
      const rawMessage = e?.message ?? '';
      const msg = rawMessage.toLowerCase();
      const status = e?.status;
      if (msg.includes('expired')) {
        setOtpError('That code is no longer valid. If you requested more than one, use the newest email.');
      } else if (status === 401 || status === 403 || msg.includes('invalid') || msg.includes('token')) {
        setOtpError('That code is not right. Check the email and try again.');
      } else {
        setOtpError(rawMessage || 'Could not verify code.');
      }
      setCode('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ManagePageShell title="Email">
      <div className="px-4 pt-4 space-y-4 pb-0">
        {step === 'email' && (
          <>
            {/* Current email */}
            <div className="rounded-2xl p-4" style={{ background: A.PANEL, border: HAIRLINE }}>
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: A.MUTE }}>
                Current email
              </p>
              <p className="text-[15px] font-medium mt-1.5" style={{ color: A.INK }}>
                {user?.email ? maskEmail(user.email) : '\u2014'}
              </p>
            </div>

            {/* New email */}
            <div className="rounded-2xl p-4 space-y-4" style={{ background: A.PANEL, border: HAIRLINE }}>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: A.MUTE }}>
                  New email
                </Label>
                <Input
                  type="email"
                  inputMode="email"
                  placeholder="your@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value.toLowerCase())}
                  autoCapitalize="none"
                  autoComplete="email"
                  spellCheck={false}
                  style={{ background: A.BORDER, border: 'none' }}
                />
              </div>
              <Button
                className="w-full min-h-[44px] font-semibold"
                disabled={!emailValid || submitting}
                onClick={handleSendInitial}
                style={{ background: A.INK, color: A.CANVAS }}
              >
                {submitting ? 'Sending\u2026' : 'Send verification code'}
              </Button>
            </div>

            <p className="text-[12px] leading-relaxed px-1" style={{ color: A.MUTE }}>
              We will send a 6-digit code to your new address. Your account email only changes once you enter that code. No password needed.
            </p>
          </>
        )}

        {step === 'code' && (
          <div className="rounded-2xl p-6 space-y-4" style={{ background: A.PANEL, border: HAIRLINE }}>
            <div className="flex flex-col items-center text-center gap-3">
              <div>
                <p className="text-[17px] font-semibold" style={{ color: A.INK }}>
                  Enter verification code
                </p>
                <p className="text-[13px] mt-1" style={{ color: A.MUTE }}>
                  We sent a 6-digit code to {newEmail}
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <InputOTP
                value={code}
                onChange={(v) => { setCode(v); if (otpError) setOtpError(null); }}
                maxLength={6}
                onComplete={handleVerify}
                disabled={submitting}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {otpError && (
              <p className="text-[13px] text-center leading-relaxed" style={{ color: DANGER }}>
                {otpError}
              </p>
            )}

            <div className="flex flex-col items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || submitting}
                className="text-[13px] font-medium"
                style={{
                  color: resendCooldown > 0 ? A.DIM : A.INK,
                  
                  cursor: resendCooldown > 0 ? 'default' : 'pointer',
                }}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setCode(''); setOtpError(null); }}
                disabled={submitting}
                className="text-[13px]"
                style={{ color: A.MUTE, cursor: 'pointer' }}
              >
                Use a different email
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="rounded-2xl p-6 space-y-4" style={{ background: A.PANEL, border: HAIRLINE }}>
            <div className="flex flex-col items-center text-center gap-3">
              <Check size={15} style={{ color: A.GREEN }} strokeWidth={2.5} />
              <div>
                <p className="text-[17px] font-semibold" style={{ color: A.INK }}>
                  Email updated
                </p>
                <p className="text-[13px] mt-1 leading-relaxed" style={{ color: A.MUTE }}>
                  Your account email is now {newEmail}. Use it next time you sign in.
                </p>
              </div>
            </div>
            <Button
              className="w-full min-h-[44px] font-semibold"
              onClick={() => navigate(-1)}
              style={{ background: A.INK, color: A.CANVAS }}
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </ManagePageShell>
  );
}
