import { useEffect, useMemo, useState } from "react";
import { CoachFinderForm } from "./CoachFinderForm";

export function CoachPromptInline({
  swingAnalysisId,
  defaultLocation,
}: {
  swingAnalysisId: string;
  defaultLocation?: { lat?: number; lng?: number; city?: string; region?: string; country?: string };
}) {
  const storageKey = useMemo(() => `coach_dismiss_${swingAnalysisId}`, [swingAnalysisId]);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setDismissed(localStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  const dismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") localStorage.setItem(storageKey, "1");
  };

  if (dismissed || submitted) return null;

  return (
    <section
      role="region"
      aria-label="Coach recommendations"
      className="mt-4 rounded-2xl border border-border bg-card/60 backdrop-blur shadow-sm transition-all duration-200"
    >
      {!expanded ? (
        <div className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="font-medium text-foreground mb-1">Want a pro to review this in person?</h3>
            <p className="text-sm text-muted-foreground">
              We can suggest nearby coaches and (optionally) share your video and analysis with them.
            </p>
          </div>
          <div className="flex gap-3 lg:shrink-0">
            <button
              onClick={dismiss}
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
            >
              No thanks
            </button>
            <button
              onClick={() => setExpanded(true)}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Recommend coaches near me
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <CoachFinderForm
            swingAnalysisId={swingAnalysisId}
            defaultLocation={defaultLocation}
            onCancel={() => setExpanded(false)}
            onSubmitSuccess={() => setSubmitted(true)}
          />
        </div>
      )}
    </section>
  );
}