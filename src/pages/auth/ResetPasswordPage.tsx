import React, { useState, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useHideBottomNav();
  useHideHeader();

  useLayoutEffect(() => {
    document.body.classList.add('route-auth');
    return () => { document.body.classList.remove('route-auth'); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/auth', { replace: true }), 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{
        background: 'radial-gradient(ellipse 120% 80% at 50% 20%, rgba(20, 20, 22, 1) 0%, #0a0a0a 100%)',
      }}
    >
      <div
        className="w-full max-w-sm flex flex-col items-center gap-6 p-8 rounded-3xl"
        style={{
          background: 'rgba(10, 10, 10, 0.78)',
          backdropFilter: 'blur(22px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.55)',
        }}
      >
        <img
          src="/images/clbhouz-logo.png"
          alt="clbhouz"
          className="h-10 w-auto opacity-80"
        />

        {success ? (
          <div className="flex flex-col items-center gap-3 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-400" strokeWidth={2.5} />
            </div>
            <p className="text-white text-[16px] font-medium">Password updated</p>
            <p className="text-white/50 text-[13px]">Redirecting to sign in…</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-white text-[20px] font-bold tracking-tight">Set new password</h1>
              <p className="text-white/50 text-[14px] mt-1">Choose a strong password for your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              {/* New password */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="New password"
                  autoFocus
                  autoComplete="new-password"
                  className="w-full h-[52px] px-4 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-[15px] focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <PasswordStrengthIndicator password={password} show={password.length > 0} />

              {/* Confirm password */}
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  className="w-full h-[52px] px-4 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-[15px] focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-[13px] text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !password || !confirmPassword}
                className="w-full h-[52px] rounded-xl bg-white text-[#0D0F11] font-semibold text-[15px] transition-all active:scale-[0.98] disabled:opacity-40"
                style={{
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Set Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
