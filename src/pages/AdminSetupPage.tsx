
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminSetupPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        toast.error("Invalid Link", { description: "This invitation link is invalid or has expired." });
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_invitations')
          .select('email, expires_at')
          .eq('token', token)
          .eq('status', 'pending')
          .single();

        if (error || !data) {
          toast.error("Invalid Invitation", { description: "This invitation is invalid or has already been used." });
          navigate('/');
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          toast.error("Expired Invitation", { description: "This invitation has expired." });
          navigate('/');
          return;
        }

        setFormData(prev => ({ ...prev, email: data.email }));
        setValidToken(true);
      } catch (error) {
        console.error('Error verifying token:', error);
        toast.error("Error", { description: "Failed to verify invitation." });
        navigate('/');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Password Mismatch", { description: "Passwords do not match." });
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password Too Short", { description: "Password must be at least 6 characters long." });
      return;
    }

    setLoading(true);
    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: "https://clbhouz.co.uk/auth/callback",
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create admin profile
        const { error: profileError } = await supabase
          .from('admin_profiles')
          .insert({
            user_id: authData.user.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email
          });

        if (profileError) throw profileError;

        // Give admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'admin'
          });

        if (roleError) throw roleError;

        // Mark invitation as accepted
        const { error: inviteError } = await supabase
          .from('admin_invitations')
          .update({ status: 'accepted' })
          .eq('token', token);

        if (inviteError) throw inviteError;

        toast.success("Welcome!", { description: "Your admin account has been created successfully." });

        navigate('/admin');
      }
    } catch (error) {
      console.error('Error setting up admin account:', error);
      toast.error("Setup Failed", { description: "Failed to create your admin account. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Verifying invitation...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!validToken) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set Up Your Admin Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Admin Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetupPage;
