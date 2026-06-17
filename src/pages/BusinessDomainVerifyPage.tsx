import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useDomainVerification, useSendDomainCode, useVerifyDomainCode } from '@/hooks/useDomainVerification';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function BusinessDomainVerifyPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [verificationId, setVerificationId] = useState<string | null>(null);

  // Fetch the verification request
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

  const { data: existingVerification } = useDomainVerification(request?.id);
  const sendCode = useSendDomainCode(businessId || '');
  const verifyCode = useVerifyDomainCode();

  // Check if already verified
  useEffect(() => {
    if (request?.domain_confirmed) {
      setStep('success');
    } else if (existingVerification?.status === 'pending') {
      setVerificationId(existingVerification.id);
      setEmail(existingVerification.email);
      setStep('code');
    }
  }, [request, existingVerification]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request?.id || !email.trim()) return;

    const result = await sendCode.mutateAsync({ requestId: request.id, email });
    if (result.verificationId) {
      setVerificationId(result.verificationId);
      setStep('code');
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationId || code.length !== 6) return;

    await verifyCode.mutateAsync({ verificationId, code });
    setStep('success');
  };

  if (!businessId) return null;

  const domain = request?.domain;

  return (
    <div className="min-h-screen bg-background md:max-w-[620px] md:mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Domain verification</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        {!request?.requires_domain_check ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">Domain verification not required</p>
          </div>
        ) : step === 'success' ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Domain verified</h2>
            <p className="text-muted-foreground mb-6">
              Your domain has been confirmed. Your verification request is now ready for final review.
            </p>
            <Button onClick={() => navigate(`/business/${businessId}/verification`)}>
              View verification status
            </Button>
          </div>
        ) : step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div className="text-center mb-8">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Verify your domain</h2>
              <p className="text-muted-foreground">
                Enter your business email address ending in <span className="font-medium">@{domain}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Business email</Label>
              <Input
                id="email"
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

            <Button type="submit" className="w-full" disabled={sendCode.isPending}>
              {sendCode.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending code...
                </>
              ) : (
                'Send verification code'
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Enter verification code</h2>
              <p className="text-muted-foreground">
                We sent a 6-digit code to <span className="font-medium">{email}</span>
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP
                value={code}
                onChange={setCode}
                maxLength={6}
                onComplete={handleVerifyCode}
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

            {verifyCode.isError && (
              <p className="text-sm text-destructive text-center">{(verifyCode.error as Error).message}</p>
            )}

            <Button
              className="w-full"
              onClick={handleVerifyCode}
              disabled={code.length !== 6 || verifyCode.isPending}
            >
              {verifyCode.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify code'
              )}
            </Button>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
