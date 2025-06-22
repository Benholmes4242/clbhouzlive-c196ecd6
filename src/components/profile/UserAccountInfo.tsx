
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, User, Mail, Trash2 } from 'lucide-react';
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
  const [email, setEmail] = useState(userEmail || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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

      // Update email if changed
      if (email !== userEmail) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        });

        if (emailError) throw emailError;

        toast({
          title: "Email updated",
          description: "Please check your new email address for verification.",
        });
      }

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

  return (
    <>
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

          {/* Email Section */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
            />
            {email !== userEmail && (
              <p className="text-sm text-amber-600">
                Changing your email will require verification of the new address.
              </p>
            )}
          </div>

          {/* Save Changes Button */}
          <Button
            onClick={handleUpdateProfile}
            disabled={isUpdating || (fullName === (profile?.display_name || '') && email === userEmail)}
            className="w-full"
          >
            {isUpdating ? 'Updating...' : 'Save Changes'}
          </Button>

          {/* Delete Account Section */}
          <div className="border-t pt-6 mt-6">
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
          </div>
        </CardContent>
      </Card>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        userEmail={userEmail}
      />
    </>
  );
};

export default UserAccountInfo;
