import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { posthog } from "@/lib/posthog";

interface InviteRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      execute: (container?: string | HTMLElement, options?: any) => Promise<string>;
    };
  }
}

const InviteRequestModal: React.FC<InviteRequestModalProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [club, setClub] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);

  useEffect(() => {
    // Load Turnstile script
    if (!document.getElementById("turnstile-script")) {
      const script = document.createElement("script");
      script.id = "turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => setTurnstileLoaded(true);
      document.head.appendChild(script);
    } else if (window.turnstile) {
      setTurnstileLoaded(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (!turnstileLoaded || !window.turnstile) {
      toast.error("Security verification not loaded. Please refresh and try again.");
      return;
    }

    setSubmitting(true);
    try {
      // Execute Turnstile challenge
      const turnstileToken = await window.turnstile.execute(undefined, {
        action: "invite",
        sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY || "",
      });

      const res = await fetch(
        "https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/invite-request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            name: name.trim() || null,
            club: club.trim() || null,
            turnstileToken,
          }),
        }
      );

      const data = await res.json();

      posthog.capture('invite_submit', { success: res.ok && data?.ok });

      if (res.ok && data?.ok) {
        toast.success("Thanks! We'll be in touch soon.");
        onOpenChange(false);
        setEmail("");
        setName("");
        setClub("");
      } else {
        toast.error(data?.message || "Could not submit invite request");
      }
    } catch (error) {
      console.error("Invite request error:", error);
      toast.error("Something went wrong. Please try again.");
      posthog.capture('invite_submit', { success: false });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card backdrop-blur-xl border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-display-lg font-semibold tracking-wide">
            Request Invite
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label htmlFor="email" className="text-body-md text-muted-foreground">
              Email <span className="text-destructive">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={submitting}
              required
              className="w-full rounded-lg bg-[color:var(--surface-input)] text-foreground placeholder:text-[color:var(--placeholder-foreground)]
                       border border-[color:hsl(var(--input))] px-4 py-3 text-body-md outline-none
                       focus:border-[color:hsl(var(--input-focus))] focus:ring-0 transition-colors
                       disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="text-body-md text-muted-foreground">
              Name <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={submitting}
              className="w-full rounded-lg bg-[color:var(--surface-input)] text-foreground placeholder:text-[color:var(--placeholder-foreground)]
                       border border-[color:hsl(var(--input))] px-4 py-3 text-body-md outline-none
                       focus:border-[color:hsl(var(--input-focus))] focus:ring-0 transition-colors
                       disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="club" className="text-body-md text-muted-foreground">
              Home Club <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <input
              id="club"
              type="text"
              value={club}
              onChange={(e) => setClub(e.target.value)}
              placeholder="Your golf club"
              disabled={submitting}
              className="w-full rounded-lg bg-[color:var(--surface-input)] text-foreground placeholder:text-[color:var(--placeholder-foreground)]
                       border border-[color:hsl(var(--input))] px-4 py-3 text-body-md outline-none
                       focus:border-[color:hsl(var(--input-focus))] focus:ring-0 transition-colors
                       disabled:opacity-60"
            />
          </div>

          <p className="text-meta text-muted-foreground leading-relaxed">
            We'll only use this to contact you about beta access.
          </p>

          <button
            type="submit"
            disabled={submitting || !turnstileLoaded}
            className="w-full rounded-lg bg-[color:var(--surface-slate)] text-white py-3 font-medium text-body-md
                     hover:bg-[color:var(--surface-slate)]/90 disabled:opacity-60 transition-colors"
          >
            {submitting ? "Submitting..." : "Request Invite"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteRequestModal;
