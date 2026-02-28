
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

interface AdminProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  temp_admin_expires?: string;
}

interface EditAdminProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: AdminProfile;
  onProfileUpdated: () => void;
  currentUserId: string;
}

const EditAdminProfileDialog = ({ 
  open, 
  onOpenChange, 
  profile, 
  onProfileUpdated,
  currentUserId
}: EditAdminProfileDialogProps) => {
  const [firstName, setFirstName] = useState(profile.first_name);
  const [lastName, setLastName] = useState(profile.last_name);
  const [email, setEmail] = useState(profile.email);
  const [selectedRole, setSelectedRole] = useState(() => {
    if (profile.temp_admin_expires && new Date(profile.temp_admin_expires) > new Date()) {
      return 'temp_admin';
    }
    return profile.role || 'admin';
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error("Error", { description: "Please fill in all required fields" });
      return;
    }

    setLoading(true);
    try {
      // Update basic profile info
      const { error: profileError } = await supabase
        .from('admin_profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Update role if changed
      const currentRole = profile.temp_admin_expires && new Date(profile.temp_admin_expires) > new Date() 
        ? 'temp_admin' 
        : profile.role || 'admin';

      if (selectedRole !== currentRole) {
        let updateData: any = {};

        if (selectedRole === 'temp_admin') {
          // Set temporary admin for 24 hours
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);
          
          updateData = {
            role: 'admin',
            temp_admin_expires: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          };
        } else {
          updateData = {
            role: selectedRole,
            temp_admin_expires: null,
            updated_at: new Date().toISOString()
          };
        }

        const { error: roleError } = await supabase
          .from('admin_profiles')
          .update(updateData)
          .eq('id', profile.id);

        if (roleError) throw roleError;
      }

      toast.success("Success", { description: "Profile updated successfully" });

      onProfileUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Error", { description: "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full Admin';
      case 'review_only':
        return 'Read Only Admin';
      case 'temp_admin':
        return 'Temporary Admin';
      default:
        return 'Full Admin';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Admin Profile</DialogTitle>
          <DialogDescription>
            Update admin profile information and privileges below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">
              First Name
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">
              Last Name
            </Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Role
            </Label>
            <div className="col-span-3">
              {profile.user_id === currentUserId ? (
                <Badge variant="default">
                  {getRoleDisplay(selectedRole)}
                  {selectedRole === 'temp_admin' && profile.temp_admin_expires && (
                    <span className="ml-2 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {Math.ceil((new Date(profile.temp_admin_expires).getTime() - new Date().getTime()) / (1000 * 60 * 60))}h left
                    </span>
                  )}
                </Badge>
              ) : (
                <div className="flex items-center space-x-2">
                  <Select
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Full Admin</SelectItem>
                      <SelectItem value="review_only">Read Only Admin</SelectItem>
                      <SelectItem value="temp_admin">Temporary Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {selectedRole === 'temp_admin' && profile.temp_admin_expires && (
                    <Badge variant="outline" className="bg-yellow-50 text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {Math.ceil((new Date(profile.temp_admin_expires).getTime() - new Date().getTime()) / (1000 * 60 * 60))}h left
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAdminProfileDialog;
