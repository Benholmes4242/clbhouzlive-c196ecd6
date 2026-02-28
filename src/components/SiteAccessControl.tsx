import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DoorClosed, Shield } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
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

  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (user) {
          const { data: hasAdminRole } = await supabase.rpc('is_admin');
          if (hasAdminRole) {
            setHasAccess(true);
            setLoading(false);
            return;
          }
        }

        const storedAccessStr = localStorage.getItem('siteAccess');
        
        if (storedAccessStr) {
          try {
            const accessData = JSON.parse(storedAccessStr);
            const currentDomain = window.location.hostname;
            
            if (accessData.granted && 
                accessData.domain === currentDomain && 
                accessData.expiresAt) {
              const expiryDate = new Date(accessData.expiresAt);
              const now = new Date();
              
              if (now < expiryDate) {
                setHasAccess(true);
              } else {
                localStorage.removeItem('siteAccess');
              }
            }
          } catch (error) {
            console.error('Error parsing stored access data:', error);
            localStorage.removeItem('siteAccess');
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
      const { data, error } = await supabase.functions.invoke('secure-site-access', {
        body: {
          accessCode: accessCode,
          domain: window.location.hostname
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        const accessData = {
          granted: true,
          timestamp: Date.now(),
          domain: window.location.hostname,
          sessionToken: data.sessionToken,
          expiresAt: data.expiresAt
        };
        
        localStorage.setItem('siteAccess', JSON.stringify(accessData));
        setHasAccess(true);
        
        toast.success('Access Granted', {
          description: 'Welcome to clubhouz!',
        });
      } else {
        setError(data.message || 'Invalid access code. Please check your code and try again.');
        setAccessCode('');
      }
    } catch (error: any) {
      console.error('Error validating access code:', error);
      setError('Unable to validate access code. Please try again.');
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
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            
            <div>
              <h2 className="font-display text-xl font-semibold mb-2">Secure Access Required</h2>
              <p className="text-muted-foreground text-center leading-relaxed">
                Enter your access code to continue to clubhouz
              </p>
            </div>
            
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
