
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, User, Lock, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  const { toast } = useToast();

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
      toast({
        title: "Profile updated",
        description: "Your account information has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Password update failed",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
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
                  className="bg-gray-100"
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

        {/* Password Change Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
              />
            </div>

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
              disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="w-full"
            >
              {isUpdatingPassword ? 'Updating Password...' : 'Change Password'}
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
                Once you delete your account, there is no going back. Please be certain.
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
