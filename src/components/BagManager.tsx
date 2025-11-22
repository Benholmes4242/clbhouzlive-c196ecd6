
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import BagEditDialog from "@/components/profile/BagEditDialog";

type BagItem = {
  id: string;
  user_id: string;
  type: string;
  brand: string;
  model: string | null;
  notes: string | null;
  image_url: string | null;
};

interface BagManagerProps {
  userId: string;
  isOwnProfile?: boolean;
  bagVisible?: boolean;
}

const BagManager = ({ userId, isOwnProfile = false, bagVisible = true }: BagManagerProps) => {
  const [bag, setBag] = useState<BagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBagVisible, setIsBagVisible] = useState(bagVisible);

  useEffect(() => {
    if (userId) fetchBag();
  }, [userId]);

  useEffect(() => {
    setIsBagVisible(bagVisible);
  }, [bagVisible]);

  async function fetchBag() {
    if (!userId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("user_bag")
      .select("*")
      .eq("user_id", userId)
      .order("type", { ascending: true });
    
    if (!error && data) {
      setBag(data || []);
    }
    setLoading(false);
  }

  async function handleVisibilityToggle(checked: boolean) {
    setIsBagVisible(checked);
    await supabase
      .from("user_profiles")
      .update({ bag_visible: checked })
      .eq("id", userId);
  }

  const bagTypes = [
    { type: "Driver", dbType: "Driver", allowMultiple: false },
    { type: "Woods", dbType: "Wood", allowMultiple: true },
    { type: "Irons", dbType: "Iron", allowMultiple: false },
    { type: "Wedges", dbType: "Wedge", allowMultiple: true },
    { type: "Putter", dbType: "Putter", allowMultiple: false },
    { type: "Ball", dbType: "Ball", allowMultiple: false }
  ];

  // For public profiles, show bag if it's visible OR if there are items in the bag
  // For own profile, always show the section
  const shouldShowBagSection = isOwnProfile || isBagVisible;

  if (!shouldShowBagSection) {
    return null;
  }

  if (loading) {
    return (
      <section className="mt-10 px-2">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-display text-heading-lg font-semibold leading-snug">What's in the Bag?</h2>
        </div>
        <p className="text-muted-foreground text-body-md">Loading...</p>
      </section>
    );
  }

  return (
    <section className="mt-10 px-2">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-display text-heading-lg font-semibold leading-snug">What's in the Bag?</h2>
        {isOwnProfile && (
          <>
            <BagEditDialog userId={userId} onBagUpdate={fetchBag} />
            <div className="flex items-center space-x-2 ml-auto">
              <Checkbox
                id="bag-visibility"
                checked={isBagVisible}
                onCheckedChange={handleVisibilityToggle}
              />
              <Label
                htmlFor="bag-visibility"
                className="text-body-sm text-muted-foreground cursor-pointer"
              >
                Show this section on my public profile
              </Label>
            </div>
          </>
        )}
      </div>

      <div className="space-y-2">
        {bagTypes.map(bagType => {
          const items = bag.filter(i => i.type === bagType.dbType);
          
          // If not own profile and no items, don't show this row
          if (!isOwnProfile && items.length === 0) {
            return null;
          }
          
          return (
            <div key={bagType.type} className="flex items-start gap-2">
              <span className="font-bold text-body-md min-w-16">{bagType.type}:</span>
              {items.length > 0 ? (
                <div className="text-body-md space-y-1">
                  {items.map((item) => (
                    <div key={item.id}>
                      <span className="font-bold">{item.brand}</span>
                      {item.model && <span className="font-bold"> {item.model}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground text-body-md">Not set</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default BagManager;
