import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import {
  useDomainVerification,
  useSendDomainCode,
  useVerifyDomainCode,
} from '@/hooks/useDomainVerification';

interface Props {
  businessId: string;
  onDone: () => void;
}

export default function DomainStep({ businessId, onDone }: Props) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [innerStep, setInnerStep] = useState<'email' | 'code' | 'success'>('email');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: request } = useQuery({
    queryKey: ['business-verification-request', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_verification_requests')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: existingVerification } = useDomainVerification(request?.id ?? null);
  const sendCode = useSendDomainCode(businessId);
  const verifyCode = useVerifyDomainCode();

  useEffect(() => {
    if (request?.domain_confirmed) setInnerStep('success');
    else if (existingVerification?.status === 'pending') {
      setVerificationId(existingVerification.id);
      setEmail(existingVerification.email);
      setInnerStep('code');
    }
  }, [request, existingVerification]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request?.id || !email.trim()) return;
    const result = await sendCode.mutateAsync({ requestId: request.id, email });
    if (result.verificationId) {
      setVerificationId(result.verificationId);
      setInnerStep('code');
    }
  };

  const handleVerify = async () => {
    if (!verificationId || code.length !== 6) return;
    await verifyCode.mutateAsync({ verificationId, code });
    setInnerStep('success');
    queryClient.invalidateQueries({ queryKey: ['business-verification-request'] });
    queryClient.invalidateQueries({ queryKey: ['business-verification-request-status'] });
  };

  const domain = request?.domain;

  if (!request?.requires_domain_check) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">Domain verification isn't required for this request.</p>
        <Button variant="secondary" className="mt-6" onClick={onDone}>
          Close
        </Button>
      </div>
    );
  }

  if (innerStep === 'success') {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Domain verified</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Your domain has been confirmed. Your verification request is now ready for final review.
        </p>
        <Button variant="secondary" onClick={onDone}>
          Done
        </Button>
      </motion.div>
    );
  }

  if (innerStep === 'email') {
    return (
      <form onSubmit={handleSendCode} className="space-y-6 py-4">
        <div className="text-center">
          <div className="h-14 w-14 rounded-full bg-[#F7931E]/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-7 w-7" style={{ color: '#F7931E' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2">Verify your domain</h3>
          <p className="text-sm text-muted-foreground">
            Enter your business email ending in <span className="font-medium">@{domain}</span>
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="domain-email">Business email</Label>
          <Input
            id="domain-email"
            type="email"
            placeholder={`you@${domain}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {sendCode.isError && (
            <p className="text-sm text-destructive">{(sendCode.error as Error).message}</p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full h-11 text-white border-0"
          style={{ background: '#0F172A' }}
          disabled={sendCode.isPending}
        >
          {sendCode.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending…
            </>
          ) : (
            'Send verification code'
          )}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <div className="h-14 w-14 rounded-full bg-[#F7931E]/10 flex items-center justify-center mx-auto mb-4">
          <Mail className="h-7 w-7" style={{ color: '#F7931E' }} />
        </div>
        <h3 className="text-lg font-semibold mb-2">Enter verification code</h3>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium">{email}</span>
        </p>
      </div>
      <div className="flex justify-center">
        <InputOTP value={code} onChange={setCode} maxLength={6} onComplete={handleVerify}>
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      {verifyCode.isError && (
        <p className="text-sm text-destructive text-center">{(verifyCode.error as Error).message}</p>
      )}
      <Button
        className="w-full h-11 text-white border-0"
        style={{ background: '#0F172A' }}
        onClick={handleVerify}
        disabled={code.length !== 6 || verifyCode.isPending}
      >
        {verifyCode.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Verifying…
          </>
        ) : (
          'Verify code'
        )}
      </Button>
      <button
        type="button"
        onClick={() => setInnerStep('email')}
        className="w-full text-sm text-muted-foreground hover:text-foreground"
      >
        Use a different email
      </button>
    </div>
  );
}
