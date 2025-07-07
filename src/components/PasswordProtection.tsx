
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DoorClosed } from 'lucide-react';

interface PasswordProtectionProps {
  children: React.ReactNode;
}

const PasswordProtection: React.FC<PasswordProtectionProps> = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // Check if user is already authenticated on component mount
  useEffect(() => {
    // For debugging - let's force the password screen to show
    console.log('PasswordProtection mounted');
    
    const storedAuth = localStorage.getItem('siteAuthenticated');
    const currentDomain = window.location.hostname;
    const storedDomain = localStorage.getItem('authenticatedDomain');
    
    console.log('Stored auth:', storedAuth);
    console.log('Current domain:', currentDomain);
    console.log('Stored domain:', storedDomain);
    
    // Only authenticate if stored auth exists AND domain matches current domain
    if (storedAuth === 'true' && storedDomain === currentDomain) {
      console.log('User authenticated');
      setIsAuthenticated(true);
    } else {
      console.log('User not authenticated, showing password screen');
      // Clear any stale authentication
      localStorage.removeItem('siteAuthenticated');
      localStorage.removeItem('authenticatedDomain');
      setIsAuthenticated(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For security, password should be validated on server-side
    // This is a temporary client-side check - replace with proper authentication
    const validPasswords = [
      'dev-access-2025!*' // Development access password
    ];
    
    if (validPasswords.includes(password)) {
      setIsAuthenticated(true);
      const currentDomain = window.location.hostname;
      localStorage.setItem('siteAuthenticated', 'true');
      localStorage.setItem('authenticatedDomain', currentDomain);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
      
      // Log failed attempt for security monitoring
      console.warn('Failed password attempt from:', window.location.hostname);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Lock Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                <DoorClosed className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            
            <div>
              <p className="text-muted-foreground text-center leading-relaxed">
                Enter password for access
              </p>
            </div>
            
            {/* Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-center"
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-destructive mt-2">{error}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                variant="secondary"
                className="w-full"
                disabled={!password.trim()}
              >
                Enter
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordProtection;
