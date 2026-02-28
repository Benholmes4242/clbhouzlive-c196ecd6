
import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  temp_admin_expires?: string;
}

interface AdminRoleDropdownProps {
  profile: AdminProfile;
  currentUserId: string;
  onRoleChanged: () => void;
}

const AdminRoleDropdown = ({ profile, currentUserId, onRoleChanged }: AdminRoleDropdownProps) => {
  const [loading, setLoading] = useState(false);
  

  const getCurrentRole = () => {
    if (profile.temp_admin_expires && new Date(profile.temp_admin_expires) > new Date()) {
      return 'temp_admin';
    }
    return profile.role || 'admin';
  };

  const handleRoleChange = async (newRole: string) => {
    setLoading(true);
    try {
      let updateData: any = {};

      if (newRole === 'temp_admin') {
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
          role: newRole,
          temp_admin_expires: null,
          updated_at: new Date().toISOString()
        };
      }

      // For now, we'll store role info in admin_profiles
      // In a production app, you'd want a separate admin_roles table
      const { error } = await supabase
        .from('admin_profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) throw error;

      toast.success(`Role updated to ${newRole === 'temp_admin' ? 'Temporary Admin' : newRole === 'review_only' ? 'Review Only' : 'Full Admin'}`);

      onRoleChanged();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error("Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = () => {
    const currentRole = getCurrentRole();
    
    if (currentRole === 'temp_admin') {
      const expiresAt = new Date(profile.temp_admin_expires!);
      const hoursLeft = Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60));
      
      return (
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-yellow-50">
            <Clock className="h-3 w-3 mr-1" />
            Temp Admin ({hoursLeft}h left)
          </Badge>
        </div>
      );
    }
    
    return (
      <Badge variant={currentRole === 'admin' ? 'default' : 'secondary'}>
        {currentRole === 'admin' ? 'Full Admin' : 
         currentRole === 'review_only' ? 'Review Only' : 'Admin'}
      </Badge>
    );
  };

  // Don't allow users to change their own role
  if (profile.user_id === currentUserId) {
    return getRoleDisplay();
  }

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={getCurrentRole()}
        onValueChange={handleRoleChange}
        disabled={loading}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Full Admin</SelectItem>
          <SelectItem value="review_only">Review Only</SelectItem>
          <SelectItem value="temp_admin">Temporary Admin</SelectItem>
        </SelectContent>
      </Select>
      
      {getCurrentRole() === 'temp_admin' && (
        <Badge variant="outline" className="bg-yellow-50 text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {Math.ceil((new Date(profile.temp_admin_expires!).getTime() - new Date().getTime()) / (1000 * 60 * 60))}h left
        </Badge>
      )}
    </div>
  );
};

export default AdminRoleDropdown;
