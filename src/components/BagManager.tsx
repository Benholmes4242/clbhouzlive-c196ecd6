
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

  // If this is not the user's own profile and bag is not visible, don't render anything
  if (!isOwnProfile && !isBagVisible) {
    return null;
  }

  async function fetchBag() {
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

  const bagTypes = ["Driver", "Wood", "Iron", "Wedge", "Putter", "Ball"];

  if (loading) {
    return (
      <section className="mt-10 px-2">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xl font-bold">What's in the Bag?</h2>
        </div>
        <p className="text-muted-foreground text-base">Loading...</p>
      </section>
    );
  }

  return (
    <section className="mt-10 px-2">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xl font-bold">What's in the Bag?</h2>
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
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Show this section on my public profile
              </Label>
            </div>
          </>
        )}
      </div>

      <div className="space-y-2">
        {bagTypes.map(type => {
          const item = bag.find(i => i.type === type);
          
          // If not own profile and item is not set, don't show this row
          if (!isOwnProfile && !item) {
            return null;
          }
          
          return (
            <div key={type} className="flex items-start gap-2">
              <span className="font-bold text-sm min-w-16">{type}:</span>
              {item ? (
                <div className="text-sm">
                  <span className="font-bold">{item.brand}</span>
                  {item.model && <span className="font-bold"> {item.model}</span>}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Not set</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default BagManager;
