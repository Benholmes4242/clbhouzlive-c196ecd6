import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DoorClosed, Shield } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SiteAccessControlProps {
  children: React.ReactNode;
}

const SiteAccessControl: React.FC<SiteAccessControlProps> = ({ children }) => {
  const [accessCode, setAccessCode] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useSupabaseSession();
  const { toast } = useToast();

  // Check if user already has access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check if user is an admin (admins get automatic access)
        if (user) {
          const { data: hasAdminRole } = await supabase.rpc('is_admin');
          if (hasAdminRole) {
            setHasAccess(true);
            setLoading(false);
            return;
          }
        }

        // Check local storage for valid access
        const storedAccess = localStorage.getItem('siteAccess');
        const accessTimestamp = localStorage.getItem('siteAccessTimestamp');
        const currentDomain = window.location.hostname;
        const storedDomain = localStorage.getItem('siteAccessDomain');
        
        if (storedAccess === 'granted' && 
            storedDomain === currentDomain && 
            accessTimestamp) {
          const timestamp = parseInt(accessTimestamp);
          const now = Date.now();
          const oneWeek = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
          
          // Access is valid for one week
          if (now - timestamp < oneWeek) {
            setHasAccess(true);
          } else {
            // Clear expired access
            localStorage.removeItem('siteAccess');
            localStorage.removeItem('siteAccessTimestamp');
            localStorage.removeItem('siteAccessDomain');
          }
        }
      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      // Validate access code against environment or secure configuration
      // This should be moved to a secure edge function in production
      const validAccessCodes = [
        'CLBHOUZ2024', // Main access code
        'DEV-ACCESS-2024', // Development access
        'ADMIN-OVERRIDE' // Admin override
      ];
      
      if (validAccessCodes.includes(accessCode.toUpperCase())) {
        const currentDomain = window.location.hostname;
        const timestamp = Date.now().toString();
        
        // Store access grant with timestamp and domain
        localStorage.setItem('siteAccess', 'granted');
        localStorage.setItem('siteAccessTimestamp', timestamp);
        localStorage.setItem('siteAccessDomain', currentDomain);
        
        setHasAccess(true);
        toast({
          title: 'Access Granted',
          description: 'Welcome to clubhouz!',
        });
        
        // Log successful access for security monitoring
        console.log('Site access granted for domain:', currentDomain);
      } else {
        setError('Invalid access code. Please check your code and try again.');
        setAccessCode('');
        
        // Log failed attempt for security monitoring
        console.warn('Failed site access attempt:', {
          domain: window.location.hostname,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent.slice(0, 100) // Truncated for privacy
        });
      }
    } catch (error) {
      console.error('Error validating access code:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Security Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-2">Secure Access Required</h2>
              <p className="text-muted-foreground text-center leading-relaxed">
                Enter your access code to continue to clubhouz
              </p>
            </div>
            
            {/* Access Code Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="text-center"
                  autoFocus
                  disabled={submitting}
                />
                {error && (
                  <p className="text-sm text-destructive mt-2">{error}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                variant="outline"
                className="w-full"
                disabled={!accessCode.trim() || submitting}
              >
                {submitting ? 'Verifying...' : 'Access Site'}
              </Button>
            </form>
            
            <div className="text-xs text-muted-foreground">
              Need an access code? Contact the site administrator.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteAccessControl;