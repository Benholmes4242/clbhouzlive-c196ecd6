
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Edit, X, Plus } from "lucide-react";

type BagItemData = {
  type: string;
  label: string;
  field: string;
  allowMultiple?: boolean;
};

const BAG_FIELDS: BagItemData[] = [
  { type: "Driver", label: "Driver", field: "driver" },
  { type: "Wood", label: "Woods", field: "woods", allowMultiple: true },
  { type: "Iron", label: "Irons", field: "irons" },
  { type: "Wedge", label: "Wedges", field: "wedges", allowMultiple: true },
  { type: "Putter", label: "Putter", field: "putter" },
  { type: "Ball", label: "Ball", field: "ball" }
];

type BagItem = {
  id: string;
  user_id: string;
  type: string;
  brand: string;
  model: string | null;
  notes: string | null;
  image_url: string | null;
};

interface BagEditDialogProps {
  userId: string;
  onBagUpdate: () => void;
}

const BagEditDialog: React.FC<BagEditDialogProps> = ({ userId, onBagUpdate }) => {
  const [open, setOpen] = useState(false);
  const [bag, setBag] = useState<BagItem[]>([]);
  const [form, setForm] = useState<{
    [key: string]: { brand: string; model: string; notes: string }[]
  }>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open && userId) fetchBag();
  }, [open, userId]);

  async function fetchBag() {
    const { data, error } = await supabase
      .from("user_bag")
      .select("*")
      .eq("user_id", userId)
      .order("type", { ascending: true });
    if (!error && data) {
      setBag(data || []);
      // Pre-fill the form values for items already in bag
      let newForm: any = {};
      for (let field of BAG_FIELDS) {
        const items = data.filter(item => item.type === field.type);
        if (field.allowMultiple) {
          newForm[field.type] = items.length > 0 
            ? items.map(item => ({
                brand: item.brand || "",
                model: item.model || "",
                notes: item.notes || ""
              }))
            : [{ brand: "", model: "", notes: "" }];
        } else {
          const item = items[0];
          newForm[field.type] = [{
            brand: item?.brand || "",
            model: item?.model || "",
            notes: item?.notes || ""
          }];
        }
      }
      setForm(newForm);
    }
  }

  async function handleInputChange(type: string, index: number, key: string, value: string) {
    setForm(f => ({
      ...f,
      [type]: (f[type] || [{ brand: "", model: "", notes: "" }]).map((item, i) => 
        i === index ? { ...item, [key]: value } : item
      )
    }));
  }

  function addClub(type: string) {
    setForm(f => ({
      ...f,
      [type]: [...(f[type] || []), { brand: "", model: "", notes: "" }]
    }));
  }

  function removeClub(type: string, index: number) {
    setForm(f => ({
      ...f,
      [type]: (f[type] || []).filter((_, i) => i !== index)
    }));
  }

  async function handleSave(type: string) {
    const itemForms = form[type] || [];
    const validItems = itemForms.filter(item => item.brand);
    
    if (validItems.length === 0) return;

    // Delete all existing items of this type first
    const existingItems = bag.filter(i => i.type === type);
    for (const item of existingItems) {
      await supabase.from("user_bag").delete().eq("id", item.id);
    }

    // Insert all valid items
    for (const item of validItems) {
      await supabase.from("user_bag").insert([{
        user_id: userId,
        type,
        brand: item.brand,
        model: item.model || null,
        notes: item.notes || null,
        image_url: null
      }]);
    }

    fetchBag();
    onBagUpdate();
  }

  async function handleDelete(type: string) {
    const existingItems = bag.filter(i => i.type === type);
    for (const item of existingItems) {
      await supabase.from("user_bag").delete().eq("id", item.id);
    }
    
    const field = BAG_FIELDS.find(f => f.type === type);
    setForm(f => ({ 
      ...f, 
      [type]: field?.allowMultiple ? [{ brand: "", model: "", notes: "" }] : [{ brand: "", model: "", notes: "" }]
    }));
    fetchBag();
    onBagUpdate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="w-4 h-4" />
          Edit Bag
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>What's in the Bag</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-4">
          {BAG_FIELDS.map(field => {
            const existingItems = bag.filter(i => i.type === field.type);
            const formItems = form[field.type] || [{ brand: "", model: "", notes: "" }];
            
            return (
              <div
                key={field.field}
                className="bg-white rounded-lg shadow border p-4 flex flex-col gap-2 relative"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg tracking-wide">{field.label}:</span>
                  {existingItems.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto"
                      aria-label={`Remove ${field.label}`}
                      onClick={() => handleDelete(field.type)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {formItems.map((item, index) => (
                  <div key={index} className="space-y-2">
                    {index > 0 && <hr className="border-gray-200" />}
                    <div className="flex items-center gap-2">
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeClub(field.type, index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                      <Label className="text-xs text-muted-foreground flex-1">
                        {index === 0 ? "Make / Brand" : `${field.label} ${index + 1} - Make / Brand`}
                      </Label>
                    </div>
                    <Input
                      value={item.brand || ""}
                      placeholder={`e.g. Titleist, TaylorMade`}
                      onChange={e => handleInputChange(field.type, index, "brand", e.target.value)}
                      className="mb-1"
                    />
                    <Label className="text-xs text-muted-foreground">Model</Label>
                    <Input
                      value={item.model || ""}
                      placeholder={`e.g. Pro V1x, i230`}
                      onChange={e => handleInputChange(field.type, index, "model", e.target.value)}
                      className="mb-1"
                    />
                  </div>
                ))}

                {field.allowMultiple && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 gap-2"
                    onClick={() => addClub(field.type)}
                  >
                    <Plus className="w-4 h-4" />
                    Add another {field.label.slice(0, -1)}
                  </Button>
                )}

                <Button
                  className="mt-2"
                  variant="default"
                  size="sm"
                  onClick={() => handleSave(field.type)}
                  disabled={uploading || !formItems.some(item => item.brand)}
                >
                  {existingItems.length > 0 ? "Update" : "Save"}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BagEditDialog;
