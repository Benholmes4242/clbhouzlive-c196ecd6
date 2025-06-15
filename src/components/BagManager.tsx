
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, BaggageClaim } from "lucide-react";

type BagItem = {
  id: string;
  user_id: string;
  type: string;
  brand: string;
  model: string | null;
  notes: string | null;
  image_url: string | null;
};

const CLUB_TYPES = [
  "Driver",
  "Wood",
  "Hybrid",
  "Iron",
  "Wedge",
  "Putter",
  "Ball",
  "Other"
];

const BagManager = ({ userId }: { userId: string }) => {
  const [bag, setBag] = useState<BagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    type: "",
    brand: "",
    model: "",
    notes: "",
  });

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
    if (!error) setBag(data || []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.type || !form.brand) return;
    await supabase.from("user_bag").insert([
      {
        user_id: userId,
        type: form.type,
        brand: form.brand,
        model: form.model || null,
        notes: form.notes || null,
      },
    ]);
    setForm({ type: "", brand: "", model: "", notes: "" });
    setAdding(false);
    fetchBag();
  }

  async function handleDelete(id: string) {
    await supabase.from("user_bag").delete().eq("id", id);
    fetchBag();
  }

  return (
    <section className="mt-10 px-2">
      <div className="flex items-center gap-2 mb-3">
        <BaggageClaim className="h-5 w-5 text-green-700" />
        <h2 className="text-lg font-semibold">What's in the Bag?</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-2">
        Show off your clubs and golf ball to let friends know what you play!
      </p>

      {/* Add Club/Ball Form */}
      {adding ? (
        <form className="bg-muted rounded-lg p-3 flex flex-col gap-2 mb-4" onSubmit={handleAdd}>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={form.type}
                className="w-full border rounded p-2 text-sm"
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                required
              >
                <option value="">Select...</option>
                {CLUB_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                placeholder="TaylorMade, Titleist, etc"
                value={form.brand}
                onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="Model (optional)"
                value={form.model}
                onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Any notes? (opt.)"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button size="sm" variant="secondary" onClick={() => setAdding(false)} type="button">
              Cancel
            </Button>
            <Button size="sm" disabled={!form.type || !form.brand || loading}>
              Add
            </Button>
          </div>
        </form>
      ) : (
        <Button size="sm" className="mb-4" onClick={() => setAdding(true)}>
          + Add Club or Ball
        </Button>
      )}

      {/* Bag List */}
      {loading ? (
        <div className="text-base text-muted-foreground px-3 py-4">Loading...</div>
      ) : bag.length === 0 ? (
        <div className="text-muted-foreground px-3 py-4">No clubs or balls added yet.</div>
      ) : (
        <ul className="space-y-2">
          {bag.map(item => (
            <li key={item.id} className="bg-white flex flex-col sm:flex-row sm:items-center justify-between rounded border p-3 shadow-sm">
              <div className="flex-1 flex gap-3 items-center">
                {/* Image (optional) */}
                {/* <img src={item.image_url || "/club-placeholder.svg"} alt="" className="h-10 w-10 object-contain" /> */}
                <div>
                  <span className="font-semibold">{item.type}:</span>{" "}
                  <span className="">{item.brand}{item.model ? ` ${item.model}` : ""}</span>
                  {item.notes && (
                    <span className="ml-2 text-xs text-muted-foreground italic">({item.notes})</span>
                  )}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="mt-2 sm:mt-0"
                aria-label="Remove"
                onClick={() => handleDelete(item.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default BagManager;
