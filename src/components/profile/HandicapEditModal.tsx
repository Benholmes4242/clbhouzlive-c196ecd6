
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { generateHandicapOptions } from "./utils/handicapOptions";

interface HandicapEditModalProps {
  userId: string;
  currentHandicap?: number | null;
  onHandicapUpdate: () => void;
}

const HandicapEditModal: React.FC<HandicapEditModalProps> = ({
  userId,
  currentHandicap,
  onHandicapUpdate,
}) => {
  const [open, setOpen] = useState(false);
  const [handicap, setHandicap] = useState(currentHandicap?.toString() || "");
  const [saving, setSaving] = useState(false);

  const handicapOptions = generateHandicapOptions();

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        eg_handicap_index: handicap ? parseFloat(handicap) : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Error updating handicap:', error);
        toast({
          title: "Error",
          description: "Failed to update handicap. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Handicap updated successfully",
        });
        onHandicapUpdate();
        setOpen(false);
      }
    } catch (error) {
      console.error('Error updating handicap:', error);
      toast({
        title: "Error",
        description: "Failed to update handicap. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="w-4 h-4" />
          Edit Handicap
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Handicap</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="handicap">Handicap</Label>
            <Select value={handicap} onValueChange={setHandicap}>
              <SelectTrigger>
                <SelectValue placeholder="Select your handicap" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {handicapOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HandicapEditModal;
