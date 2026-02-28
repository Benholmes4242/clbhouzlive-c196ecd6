import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, User, Lock, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DeleteAccountModal from './DeleteAccountModal';

interface UserAccountInfoProps {
  profile: {
    username?: string | null;
    display_name?: string | null;
    id: string;
  };
  userEmail?: string;
  onProfileUpdate: () => void;
}

const UserAccountInfo: React.FC<UserAccountInfoProps> = ({
  profile,
  userEmail,
  onProfileUpdate
}) => {
  const [fullName, setFullName] = useState(profile?.display_name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Password change states - simplified (no current password)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      // Update profile display name
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          display_name: fullName || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      onProfileUpdate();
      toast.success("Profile updated", { description: "Your account information has been updated successfully." });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Clear password fields
      setNewPassword('');
      setConfirmPassword('');

      toast.success("Password updated");
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Username Section */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="space-y-2">
                <Input
                  id="username"
                  value={profile?.username ? `@${profile.username}` : 'Not set'}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Usernames cannot be changed. To request a change, please contact Clbhouz support.
                </p>
              </div>
            </div>

            {/* Full Name Section */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            {/* Save Changes Button */}
            <Button
              onClick={handleUpdateProfile}
              disabled={isUpdating || (fullName === (profile?.display_name || ''))}
              className="w-full"
            >
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Password Change Section - Simplified */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Set New Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              You're signed in, so you can set a new password directly.
            </p>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
              />
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
              />
            </div>

            {/* Change Password Button */}
            <Button
              onClick={handlePasswordChange}
              disabled={isUpdatingPassword || !newPassword || !confirmPassword}
              className="w-full"
            >
              {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>

        {/* Delete Account Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground">
                Deleting your account will hide your profile and anonymize your data. This action can be reversed by contacting support.
              </p>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete My Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        userEmail={userEmail}
      />
    </>
  );
};

export default UserAccountInfo;
