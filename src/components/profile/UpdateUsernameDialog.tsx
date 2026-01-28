
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UpdateUsernameDialogProps {
  userId: string;
  currentUsername?: string | null;
  onUpdate: () => void;
}

const UpdateUsernameDialog: React.FC<UpdateUsernameDialogProps> = ({
  userId,
  currentUsername,
  onUpdate,
}) => {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(currentUsername || "");
  const [saving, setSaving] = useState(false);

  // Function to clean username - remove spaces and @ symbol, preserve case
  const cleanUsername = (value: string) => {
    return value.replace(/\s+/g, '').replace('@', '');
  };

  // Handle username input change with automatic space removal
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanedValue = cleanUsername(e.target.value);
    setUsername(cleanedValue);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleanedUsername = cleanUsername(username);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          username: cleanedUsername,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating username:', error);
        alert('Error updating username');
      } else {
        onUpdate();
        setOpen(false);
      }
    } catch (error) {
      console.error('Error updating username:', error);
      alert('Error updating username');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="w-4 h-4" />
          {currentUsername ? 'Edit Username' : 'Add Username'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Username</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={handleUsernameChange}
              placeholder="username"
            />
            <p className="text-xs text-muted-foreground">
              Your username will appear as @{username}. Spaces will be automatically removed.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !username.trim()}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateUsernameDialog;
