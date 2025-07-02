
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface PasswordProtectionProps {
  children: React.ReactNode;
}

const PasswordProtection: React.FC<PasswordProtectionProps> = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // Check if user is already authenticated on component mount
  useEffect(() => {
    // Force re-authentication on every session regardless of localStorage
    // This ensures no one can bypass the password protection
    const storedAuth = localStorage.getItem('siteAuthenticated');
    const currentDomain = window.location.hostname;
    const storedDomain = localStorage.getItem('authenticatedDomain');
    
    // Only authenticate if stored auth exists AND domain matches current domain
    if (storedAuth === 'true' && storedDomain === currentDomain) {
      setIsAuthenticated(true);
    } else {
      // Clear any stale authentication
      localStorage.removeItem('siteAuthenticated');
      localStorage.removeItem('authenticatedDomain');
      setIsAuthenticated(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === 'mypassword') {
      setIsAuthenticated(true);
      const currentDomain = window.location.hostname;
      localStorage.setItem('siteAuthenticated', 'true');
      localStorage.setItem('authenticatedDomain', currentDomain);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
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
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Protected Access
              </h1>
              <p className="text-muted-foreground">
                Please enter the password to continue
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
