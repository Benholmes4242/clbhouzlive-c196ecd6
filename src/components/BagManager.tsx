
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Golf } from "lucide-react";

type BagItemData = {
  type: string;
  label: string;
  photoLabel: string;
  showPhoto: boolean;
  field: string;
};

const BAG_FIELDS: BagItemData[] = [
  { type: "Driver", label: "Driver", field: "driver", photoLabel: "Upload Driver Photo", showPhoto: true },
  { type: "Wood", label: "Woods", field: "woods", photoLabel: "Upload Woods Photo", showPhoto: true },
  { type: "Iron", label: "Irons", field: "irons", photoLabel: "Upload Irons Photo", showPhoto: true },
  { type: "Wedge", label: "Wedges", field: "wedges", photoLabel: "Upload Wedges Photo", showPhoto: true },
  { type: "Putter", label: "Putter", field: "putter", photoLabel: "Upload Putter Photo", showPhoto: true },
  { type: "Ball", label: "Ball", field: "ball", photoLabel: "Upload Ball Photo", showPhoto: true },
  { type: "Cloth", label: "Cloth (Optional)", field: "cloth", photoLabel: "Upload Cloth Photo", showPhoto: true },
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

const BagManager = ({ userId }: { userId: string }) => {
  const [bag, setBag] = useState<BagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{
    [key: string]: { brand: string; model: string; notes: string; image: File | null; imageUrl: string | null }
  }>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (userId) fetchBag();
    // eslint-disable-next-line
  }, [userId]);

  async function fetchBag() {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_bag")
      .select("*")
      .eq("user_id", userId)
      .order("type", { ascending: true });
    if (!error && data) {
      setBag(data || []);
      // Pre-fill the form values for items already in bag
      let newForm: any = {};
      for (let item of data) {
        newForm[item.type] = {
          brand: item.brand || "",
          model: item.model || "",
          notes: item.notes || "",
          image: null,
          imageUrl: item.image_url ?? null
        };
      }
      setForm(newForm);
    }
    setLoading(false);
  }

  async function handleInputChange(type: string, key: string, value: string | File | null) {
    setForm(f => ({
      ...f,
      [type]: {
        ...(f[type] || { brand: "", model: "", notes: "", image: null, imageUrl: null }),
        [key]: value
      }
    }));
  }

  async function handlePhotoUpload(type: string, file: File) {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${userId}/bag/${type.toLowerCase()}-${Date.now()}.${ext}`;
    // Small file, so upsert is fine
    let { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      alert("Photo upload failed.");
      return null;
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    setUploading(false);
    return urlData?.publicUrl ?? null;
  }

  async function handleSave(type: string) {
    const itemForm = form[type];
    if (!itemForm || !itemForm.brand) return;
    let imageUrl = itemForm.imageUrl || null;
    // Upload photo if selected
    if (itemForm.image) {
      imageUrl = await handlePhotoUpload(type, itemForm.image);
    }
    // Find if already exists in bag
    const existing = bag.find(i => i.type === type);
    if (existing) {
      // Update
      await supabase.from("user_bag").update({
        brand: itemForm.brand,
        model: itemForm.model || null,
        notes: itemForm.notes || null,
        image_url: imageUrl
      }).eq("id", existing.id);
    } else {
      // Insert
      await supabase.from("user_bag").insert([{
        user_id: userId,
        type,
        brand: itemForm.brand,
        model: itemForm.model || null,
        notes: itemForm.notes || null,
        image_url: imageUrl
      }]);
    }
    // Remove temp file from form
    setForm(f => ({ ...f, [type]: { ...f[type], image: null, imageUrl } }));
    fetchBag();
  }

  async function handleDelete(type: string) {
    const existing = bag.find(i => i.type === type);
    if (existing) {
      await supabase.from("user_bag").delete().eq("id", existing.id);
      setForm(f => ({ ...f, [type]: { brand: "", model: "", notes: "", image: null, imageUrl: null } }));
      fetchBag();
    }
  }

  // Render
  return (
    <section className="mt-10 px-2">
      <div className="flex items-center gap-2 mb-3">
        <Golf className="h-6 w-6 text-green-700" />
        <h2 className="text-xl font-bold">What's in the Bag?</h2>
      </div>
      <p className="text-muted-foreground text-base mb-3">
        Show off your clubs, golf ball, or favorite towel 🎒
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {BAG_FIELDS.map(field => {
          const existing = bag.find(i => i.type === field.type);
          const val = form[field.type] || { brand: "", model: "", notes: "", image: null, imageUrl: null };
          return (
            <div
              key={field.field}
              className="bg-white rounded-lg shadow border p-4 flex flex-col gap-2 relative"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg tracking-wide">{field.label}:</span>
                {existing && (
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
              <Label className="text-xs text-muted-foreground">Make / Brand</Label>
              <Input
                value={val.brand || ""}
                placeholder={`e.g. Titleist, TaylorMade`}
                onChange={e => handleInputChange(field.type, "brand", e.target.value)}
                className="mb-1"
              />
              <Label className="text-xs text-muted-foreground">Model</Label>
              <Input
                value={val.model || ""}
                placeholder={`e.g. Pro V1x, i230`}
                onChange={e => handleInputChange(field.type, "model", e.target.value)}
                className="mb-1"
              />
              {field.type === "Cloth" && (
                <>
                  <Label className="text-xs text-muted-foreground">Description (optional / fun!)</Label>
                  <Input
                    value={val.notes || ""}
                    placeholder={`Your towel, lucky rag, etc`}
                    onChange={e => handleInputChange(field.type, "notes", e.target.value)}
                    className="mb-1"
                  />
                </>
              )}
              {field.showPhoto && (
                <div>
                  <Label className="text-xs text-muted-foreground">{field.photoLabel}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      className="w-auto"
                      onChange={e => {
                        const file = e.target.files?.[0] ?? null;
                        handleInputChange(field.type, "image", file);
                      }}
                    />
                    {val.imageUrl && (
                      <img src={val.imageUrl} alt={`${field.label} photo`} className="h-10 w-10 rounded object-cover border" />
                    )}
                  </div>
                </div>
              )}
              <Button
                className="mt-2"
                variant="default"
                size="sm"
                onClick={() => handleSave(field.type)}
                disabled={uploading || !val.brand}
              >
                {existing ? "Update" : "Save"}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default BagManager;
