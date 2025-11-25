import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export function CoachFinderForm({
  swingAnalysisId,
  defaultLocation,
  onCancel,
  onSubmitSuccess,
}: {
  swingAnalysisId: string;
  defaultLocation?: { lat?: number; lng?: number; city?: string; region?: string; country?: string };
  onCancel: () => void;
  onSubmitSuccess: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    lat: defaultLocation?.lat ?? "",
    lng: defaultLocation?.lng ?? "",
    city: defaultLocation?.city ?? "",
    region: defaultLocation?.region ?? "",
    country: defaultLocation?.country ?? "",
    radiusKm: 25,
    focus: "Driver",
    priceMin: "",
    priceMax: "",
    shareVideo: false,
    shareAnalysisText: false,
    firstNameOnly: true,
    maskPreciseLocation: true,
    consent: false,
  });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.lat || !form.lng) {
      return toast({ title: "Location required", description: "Please enter latitude and longitude", variant: "destructive" });
    }
    if (!form.radiusKm || Number(form.radiusKm) < 1) {
      return toast({ title: "Invalid radius", description: "Radius must be at least 1km", variant: "destructive" });
    }
    if ((form.shareVideo || form.shareAnalysisText) && !form.consent) {
      return toast({ title: "Consent required", description: "You must agree to share data with coaches", variant: "destructive" });
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("swing-coach-outreach", {
        body: {
          swingAnalysisId,
          lat: Number(form.lat),
          lng: Number(form.lng),
          city: form.city,
          region: form.region,
          country: form.country,
          radiusKm: Number(form.radiusKm),
          focus: form.focus,
          priceMin: form.priceMin ? Number(form.priceMin) : null,
          priceMax: form.priceMax ? Number(form.priceMax) : null,
          shareVideo: !!form.shareVideo,
          shareAnalysisText: !!form.shareAnalysisText,
          firstNameOnly: !!form.firstNameOnly,
          maskPreciseLocation: !!form.maskPreciseLocation,
        },
      });

      if (error) {
        console.error('Outreach error:', error);
        return toast({ 
          title: "Could not create outreach", 
          description: error.message, 
          variant: "destructive" 
        });
      }

      const coachCount = data?.chosen?.length || 0;
      toast({ 
        title: `Request sent to ${coachCount} coach${coachCount === 1 ? "" : "es"}!`,
        description: coachCount > 0 ? "Coaches will be notified about your swing analysis." : "No coaches found in your area with these criteria."
      });
      onSubmitSuccess();
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({ 
        title: "Something went wrong", 
        description: "Please try again later", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-foreground mb-1">Find coaches near you</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Tell us your location and preferences to find the best coaches in your area.
        </p>
      </div>

      {/* Location Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Latitude</label>
          <input 
            type="number" 
            step="any"
            className="input" 
            placeholder="51.5074" 
            value={form.lat} 
            onChange={(e) => setForm({ ...form, lat: e.target.value })} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Longitude</label>
          <input 
            type="number" 
            step="any"
            className="input" 
            placeholder="-0.1278" 
            value={form.lng} 
            onChange={(e) => setForm({ ...form, lng: e.target.value })} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">City</label>
          <input 
            type="text"
            className="input" 
            placeholder="London" 
            value={form.city} 
            onChange={(e) => setForm({ ...form, city: e.target.value })} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Radius (km)</label>
          <input 
            type="number" 
            className="input" 
            placeholder="25" 
            value={form.radiusKm} 
            onChange={(e) => setForm({ ...form, radiusKm: Number(e.target.value) || 25 })} 
          />
        </div>
      </div>

      {/* Focus and Price */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Focus Area</label>
          <select 
            className="input" 
            value={form.focus} 
            onChange={(e) => setForm({ ...form, focus: e.target.value })}
          >
            <option value="Driver">Driver</option>
            <option value="Irons">Irons</option>
            <option value="Short Game">Short Game</option>
            <option value="Putting">Putting</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Price Min</label>
            <input 
              type="number" 
              className="input" 
              placeholder="50" 
              value={form.priceMin} 
              onChange={(e) => setForm({ ...form, priceMin: e.target.value })} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Price Max</label>
            <input 
              type="number" 
              className="input" 
              placeholder="150" 
              value={form.priceMax} 
              onChange={(e) => setForm({ ...form, priceMax: e.target.value })} 
            />
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="space-y-3 p-3 rounded-lg bg-muted/50">
        <h4 className="text-sm font-medium text-foreground">Privacy Settings</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={form.firstNameOnly} 
              onChange={(e) => setForm({ ...form, firstNameOnly: e.target.checked })}
              className="rounded border-border"
            />
            Share first name only
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={form.maskPreciseLocation} 
              onChange={(e) => setForm({ ...form, maskPreciseLocation: e.target.checked })}
              className="rounded border-border"
            />
            Mask precise location
          </label>
        </div>
      </div>

      {/* Sharing Options */}
      <div className="space-y-3 p-3 rounded-lg bg-muted/50">
        <h4 className="text-sm font-medium text-foreground">Share with coaches (optional)</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={form.shareVideo} 
              onChange={(e) => setForm({ ...form, shareVideo: e.target.checked })}
              className="rounded border-border"
            />
            Share swing video with selected coaches
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={form.shareAnalysisText} 
              onChange={(e) => setForm({ ...form, shareAnalysisText: e.target.checked })}
              className="rounded border-border"
            />
            Share AI analysis text with selected coaches
          </label>
        </div>
      </div>

      {/* Consent */}
      {(form.shareVideo || form.shareAnalysisText) && (
        <label className="flex items-start gap-2 text-sm p-3 rounded-lg border border-orange-200 bg-orange-50">
          <input 
            type="checkbox" 
            checked={form.consent} 
            onChange={(e) => setForm({ ...form, consent: e.target.checked })}
            className="rounded border-border mt-0.5"
          />
          <span className="text-orange-800">
            I agree to share my swing video and AI analysis with selected coaches so they can contact me.
          </span>
        </label>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button 
          onClick={onCancel} 
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Cancel
        </button>
        <Button
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Sending..." : "Find coaches"}
        </Button>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
          color: hsl(var(--foreground));
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input:focus {
          outline: none;
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
        }
        .input::placeholder {
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  );
}