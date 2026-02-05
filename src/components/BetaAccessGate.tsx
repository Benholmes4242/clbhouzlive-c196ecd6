import React, { useState, useEffect } from 'react';
import { hasBetaAccess, validateBetaCode, isNativePlatform } from '@/utils/betaAccess';
import { isMedianApp, getMedianPlatform } from '@/utils/median/isMedianApp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';

interface BetaAccessGateProps {
  children: React.ReactNode;
}

const BetaAccessGate: React.FC<BetaAccessGateProps> = ({ children }) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Debug logging for platform detection (dev only)
    if (import.meta.env.DEV) {
      console.log('[BetaGate] Platform:', getMedianPlatform());
      console.log('[BetaGate] isMedianApp:', isMedianApp());
      console.log('[BetaGate] isNativePlatform:', isNativePlatform());
      console.log('[BetaGate] hasBetaAccess:', hasBetaAccess());
    }
    
    // Check access on mount
    setHasAccess(hasBetaAccess());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Small delay for UX
    setTimeout(() => {
      if (validateBetaCode(code)) {
        setHasAccess(true);
      } else {
        setError('Invalid access code. Please try again.');
        setCode('');
      }
      setIsSubmitting(false);
    }, 300);
  };

  // Still checking access
  if (hasAccess === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Has access - render app
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show beta gate
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8">
        <img 
          src="/clbhouz-logo.svg" 
          alt="clbhouz" 
          className="h-12 w-auto"
          onError={(e) => {
            // Fallback if logo doesn't exist
            e.currentTarget.style.display = 'none';
          }}
        />
        <h1 className="text-3xl font-bold text-foreground tracking-tight mt-4">
          clbhouz
        </h1>
      </div>

      {/* Content Card */}
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Welcome to clbhouz Beta
          </h2>
          <p className="text-muted-foreground text-sm">
            This is a private beta. Please enter your access code to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              placeholder="Enter beta access code"
              className="h-12 text-center text-lg tracking-wider bg-muted/50 border-border focus:border-primary focus:ring-primary"
              autoComplete="off"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-destructive text-sm text-center animate-in fade-in slide-in-from-top-1">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={!code.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              'Enter Beta'
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Don't have a code? Contact us for access.
        </p>
      </div>
    </div>
  );
};

export default BetaAccessGate;
