import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { Eye, EyeOff, Loader2, ChevronLeft } from 'lucide-react';

type View = 'landing' | 'sign-in' | 'sign-up' | 'forgot';

export default function NewAuthPage() {
  useHideBottomNav();
  useHideHeader();

  const navigate = useNavigate();
  const [view, setView] = useState<View>('landing');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  const clearErrors = () => setError(null);

  // ── Google sign in ──
  const handleGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  // ── Apple sign in ──
  const handleApple = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  // ── Email sign in ──
  const handleSignIn = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    clearErrors();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message.includes('Invalid login') ? 'Email or password is incorrect' : 'Something went wrong. Please try again.');
      setLoading(false);
    }
    // On success AuthWrapper handles redirect
  };

  // ── Email sign up ──
  const handleSignUp = async () => {
    if (!email || !username || !password || !confirmPassword) { setError('Please fill in all fields'); return; }
    if (username.trim().length < 3) { setError('Username must be at least 3 characters'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('Username can only contain letters, numbers and underscores'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }

    setLoading(true);
    clearErrors();

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { username: username.trim() },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        setError('An account with this email already exists. Try signing in.');
      } else if ((error as any)?.status === 429) {
        setError('Too many attempts. Please wait a moment.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setLoading(false);
      return;
    }

    // identities.length === 0 means email already exists but is unconfirmed
    if (data?.user?.identities?.length === 0) {
      navigate('/auth/check-email', { state: { email }, replace: true });
      return;
    }

    if (data?.user) {
      navigate('/auth/check-email', { state: { email }, replace: true });
      return;
    }

    setError('Something went wrong. Please try again.');
    setLoading(false);
  };

  // ── Forgot password ──
  const handleForgot = async () => {
    if (!email) { setError('Please enter your email address'); return; }
    setLoading(true);
    clearErrors();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setForgotSent(true);
    setLoading(false);
  };

  // ── Shared input style ──
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#e8610a]/60 focus:bg-white/[0.08] transition-all";

  // ── OAuth buttons ──
  const OAuthButtons = () => (
    <div className="flex flex-col gap-3 w-full">
      <button onClick={handleApple} disabled={loading}
        className="w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 text-[15px] font-medium text-white transition-all active:scale-[0.98]"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M14.94 13.38c-.29.67-.63 1.28-1.03 1.85-.55.77-1 1.3-1.34 1.6-.54.5-1.11.75-1.72.77-.44 0-.97-.12-1.58-.37-.62-.25-1.19-.37-1.7-.37-.54 0-1.12.12-1.74.37-.62.25-1.12.38-1.51.39-.58.02-1.17-.24-1.75-.78-.37-.33-.84-.89-1.39-1.69-.59-.85-1.08-1.84-1.46-2.96C.24 10.72 0 9.32 0 7.97c0-1.53.33-2.85 1-3.95a5.82 5.82 0 0 1 2.07-2.1A5.57 5.57 0 0 1 5.87 1c.47 0 1.08.14 1.85.42.76.28 1.25.42 1.46.42.16 0 .7-.16 1.6-.49.86-.3 1.58-.43 2.17-.38 1.6.13 2.8.76 3.6 1.9-1.43.87-2.14 2.09-2.12 3.65.02 1.22.45 2.23 1.31 3.04.39.37.82.65 1.3.86-.1.3-.21.6-.34.87l.04-.01ZM11.46.37c0 .95-.35 1.84-1.04 2.67-.83.97-1.84 1.53-2.93 1.44a2.95 2.95 0 0 1-.02-.36c0-.92.4-1.9 1.1-2.7.36-.4.81-.74 1.36-1.01.55-.27 1.07-.41 1.55-.44.02.13.02.27.02.4h-.04Z"/></svg>
        Continue with Apple
      </button>
      <button onClick={handleGoogle} disabled={loading}
        className="w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 text-[15px] font-medium text-white transition-all active:scale-[0.98]"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58Z" fill="#EA4335"/></svg>
        Continue with Google
      </button>
    </div>
  );

  // ── Divider ──
  const Divider = () => (
    <div className="flex items-center gap-4 w-full my-2">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-[13px] text-white/30 font-medium">or</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col items-center gap-6">

          {/* Logo */}
          <div className="mb-2">
            <img src="/lovable-uploads/clbhouz-logo-white.png" alt="Clbhouz" className="h-10 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>

          {/* ── LANDING VIEW ── */}
          {view === 'landing' && (
            <>
              <div className="text-center mb-2">
                <h1 className="text-[28px] font-bold text-white tracking-tight">The home of golf.</h1>
                <p className="text-[15px] text-white/50 mt-1">Connect, explore and track your game.</p>
              </div>
              <OAuthButtons />
              <Divider />
              <div className="flex flex-col gap-3 w-full">
                <button onClick={() => { clearErrors(); setView('sign-up'); }}
                  className="w-full rounded-2xl py-3.5 text-[15px] font-semibold text-white transition-all active:scale-[0.98]"
                  style={{ background: 'rgba(232,97,10,0.9)', border: '1px solid rgba(232,97,10,0.5)' }}>
                  Create account
                </button>
                <button onClick={() => { clearErrors(); setView('sign-in'); }}
                  className="w-full rounded-2xl py-3.5 text-[15px] font-medium text-white/70 transition-all active:scale-[0.98]"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Sign in
                </button>
              </div>
            </>
          )}

          {/* ── SIGN IN VIEW ── */}
          {view === 'sign-in' && (
            <>
              <div className="flex items-center gap-3 w-full mb-2">
                <button onClick={() => { clearErrors(); setView('landing'); }} className="text-white/50 hover:text-white transition-colors">
                  <ChevronLeft size={22} />
                </button>
                <h1 className="text-[22px] font-bold text-white">Sign in</h1>
              </div>
              <OAuthButtons />
              <Divider />
              <div className="flex flex-col gap-3 w-full">
                <input type="email" placeholder="Email" value={email} onChange={e => { setEmail(e.target.value); clearErrors(); }} className={inputClass} autoComplete="email" />
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => { setPassword(e.target.value); clearErrors(); }} className={inputClass} autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {error && <p className="text-red-400 text-[13px]">{error}</p>}
                <button onClick={handleSignIn} disabled={loading} className="w-full rounded-2xl py-3.5 text-[15px] font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]" style={{ background: 'rgba(232,97,10,0.9)', border: '1px solid rgba(232,97,10,0.5)' }}>
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Sign in
                </button>
                <button onClick={() => { clearErrors(); setView('forgot'); }} className="text-[13px] text-white/40 text-center hover:text-white/60 transition-colors">
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {/* ── SIGN UP VIEW ── */}
          {view === 'sign-up' && (
            <>
              <div className="flex items-center gap-3 w-full mb-2">
                <button onClick={() => { clearErrors(); setView('landing'); }} className="text-white/50 hover:text-white transition-colors">
                  <ChevronLeft size={22} />
                </button>
                <h1 className="text-[22px] font-bold text-white">Create account</h1>
              </div>
              <OAuthButtons />
              <Divider />
              <div className="flex flex-col gap-3 w-full">
                <input type="email" placeholder="Email" value={email} onChange={e => { setEmail(e.target.value); clearErrors(); }} className={inputClass} autoComplete="email" />
                <input type="text" placeholder="Username" value={username} onChange={e => { setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '')); clearErrors(); }} className={inputClass} autoComplete="username" maxLength={30} />
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => { setPassword(e.target.value); clearErrors(); }} className={inputClass} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {password.length > 0 && <PasswordStrengthIndicator password={password} />}
                <input type={showPassword ? 'text' : 'password'} placeholder="Confirm password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); clearErrors(); }} className={inputClass} autoComplete="new-password" />
                {error && <p className="text-red-400 text-[13px]">{error}</p>}
                <button onClick={handleSignUp} disabled={loading} className="w-full rounded-2xl py-3.5 text-[15px] font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]" style={{ background: 'rgba(232,97,10,0.9)', border: '1px solid rgba(232,97,10,0.5)' }}>
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Create account
                </button>
                <p className="text-[11px] text-white/30 text-center leading-relaxed">
                  By creating an account you agree to our{' '}
                  <a href="/terms" className="underline underline-offset-2">Terms</a>
                  {' '}and{' '}
                  <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a>.
                </p>
              </div>
            </>
          )}

          {/* ── FORGOT VIEW ── */}
          {view === 'forgot' && (
            <>
              <div className="flex items-center gap-3 w-full mb-2">
                <button onClick={() => { clearErrors(); setView('sign-in'); }} className="text-white/50 hover:text-white transition-colors">
                  <ChevronLeft size={22} />
                </button>
                <h1 className="text-[22px] font-bold text-white">Reset password</h1>
              </div>
              {forgotSent ? (
                <div className="text-center">
                  <p className="text-[15px] text-white/60">Check {email} for a reset link.</p>
                  <button onClick={() => { setView('sign-in'); setForgotSent(false); }} className="mt-4 text-[13px] text-white/40 hover:text-white/60 transition-colors">Back to sign in</button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  <p className="text-[14px] text-white/50">Enter your email and we'll send you a reset link.</p>
                  <input type="email" placeholder="Email" value={email} onChange={e => { setEmail(e.target.value); clearErrors(); }} className={inputClass} />
                  {error && <p className="text-red-400 text-[13px]">{error}</p>}
                  <button onClick={handleForgot} disabled={loading} className="w-full rounded-2xl py-3.5 text-[15px] font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]" style={{ background: 'rgba(232,97,10,0.9)', border: '1px solid rgba(232,97,10,0.5)' }}>
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    Send reset link
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
