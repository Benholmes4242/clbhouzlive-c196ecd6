import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { triggerHaptic } from "@/lib/ui/haptics";

// ── Template definitions ──────────────────────────────────────────
const TEMPLATES = [
  {
    id: "course-vlog",
    emoji: "🎥",
    name: "Course Vlog",
    description: "Document your round",
    gradient: "linear-gradient(135deg, #2a1f0a 0%, #4a3510 50%, #3a2a0a 100%)",
  },
  {
    id: "tournament",
    emoji: "🏆",
    name: "Tournament",
    description: "Competition recap",
    gradient: "linear-gradient(135deg, #1a2a1a 0%, #2a4a2a 50%, #1a3a1a 100%)",
  },
  {
    id: "hole-in-one",
    emoji: "🔥",
    name: "Hole-in-One",
    description: "Celebrate the ace",
    gradient: "linear-gradient(135deg, #3a1a1a 0%, #5a2020 50%, #4a1a1a 100%)",
  },
  {
    id: "best-shots",
    emoji: "📸",
    name: "Best Shots",
    description: "Your finest moments",
    gradient: "linear-gradient(135deg, #1a2030 0%, #2a3a5a 50%, #1a2a4a 100%)",
  },
  {
    id: "course-review",
    emoji: "⭐",
    name: "Course Review",
    description: "Share your take",
    gradient: "linear-gradient(135deg, #2a2010 0%, #4a3a18 50%, #3a2a10 100%)",
  },
] as const;

// ── Quick action definitions ──────────────────────────────────────
const QUICK_ACTIONS = [
  { id: "best-shots", emoji: "📸", label: "Best Shots" },
  { id: "tag-partners", emoji: "🏷️", label: "Tag Partners" },
  { id: "add-location", emoji: "📍", label: "Location" },
] as const;

// ── Noise texture SVG (inline, no external asset) ─────────────────
const NOISE_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E`;

// ── Spring easing for staggered entrance ──────────────────────────
const springTransition = (delay: number) => ({
  duration: 0.6,
  ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
  delay,
});

interface CreateMomentHeroProps {
  hasMedia: boolean;
  isBusinessActor: boolean;
  isTyping: boolean;
  onPickFromCamera: () => void;
  onPickFromLibrary: () => void;
  onSelectTemplate?: (templateId: string) => void;
  onQuickAction?: (actionId: string) => void;
}

export default function CreateMomentHero({
  hasMedia,
  onPickFromCamera,
  onPickFromLibrary,
  onSelectTemplate,
  onQuickAction,
}: CreateMomentHeroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (hasMedia) return null;

  return (
    <div
      className="h-full w-full flex flex-col relative overflow-y-auto overflow-x-hidden"
      style={{
        background: `linear-gradient(180deg,
          #1a1008   0%,
          #2a1a0a   12%,
          #33200c   28%,
          #f8f6f3   55%,
          #f9f8f6   100%
        )`,
      }}
    >
      {/* ── Ambient amber glow ─────────────────────────────── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -60,
          left: "50%",
          transform: "translateX(-50%)",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(245,158,11,0.10) 0%, rgba(251,191,36,0.04) 40%, transparent 70%)",
        }}
      />

      {/* ── Grain texture ──────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          opacity: 0.03,
          backgroundImage: `url("${NOISE_SVG}")`,
        }}
      />

      {/* ── Content wrapper (centered, max-width constrained) */}
      <div className="relative z-[2] flex flex-col items-center w-full max-w-[430px] mx-auto px-5 pt-6 pb-10"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)" }}
      >
        {/* ═══════════════════════════════════════════════════
            PHASE 4 — Glass Capture Card
           ═══════════════════════════════════════════════════ */}
        <motion.div
          className="w-full relative rounded-3xl"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(245,158,11,0.12)",
            padding: "32px 24px 28px",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: `all 0.6s cubic-bezier(0.32,0.72,0,1) 0.15s`,
          }}
        >
          {/* Amber accent line */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2"
            style={{
              width: 60,
              height: 2,
              borderRadius: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)",
            }}
          />

          {/* Inner glow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              top: -30,
              width: 240,
              height: 120,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)",
            }}
          />

          {/* Title */}
          <div className="text-center mb-6">
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "white",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                marginBottom: 6,
              }}
            >
              Create Your Moment
            </h1>
            <p
              style={{
                fontSize: 14,
                fontWeight: 400,
                color: "rgba(255,255,255,0.45)",
              }}
            >
              Up to 10 photos & videos from your round
            </p>
          </div>

          {/* Camera & Gallery buttons */}
          <div className="flex gap-3">
            {/* Camera */}
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic("selection");
                onPickFromCamera();
              }}
              whileTap={{
                scale: 0.97,
                background: "rgba(245,158,11,0.15)",
                borderColor: "rgba(245,158,11,0.3)",
                boxShadow: "0 0 20px rgba(245,158,11,0.08)",
              }}
              className="flex-1 flex flex-col items-center gap-2 rounded-2xl py-4"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <span style={{ fontSize: 28 }}>📷</span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                Camera
              </span>
            </motion.button>

            {/* Gallery */}
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic("light");
                onPickFromLibrary();
              }}
              whileTap={{
                scale: 0.97,
                background: "rgba(245,158,11,0.15)",
                borderColor: "rgba(245,158,11,0.3)",
                boxShadow: "0 0 20px rgba(245,158,11,0.08)",
              }}
              className="flex-1 flex flex-col items-center gap-2 rounded-2xl py-4"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <span style={{ fontSize: 28 }}>🖼️</span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                Gallery
              </span>
            </motion.button>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            PHASE 5 — Template Cards Carousel
           ═══════════════════════════════════════════════════ */}
        <div
          className="w-full mt-8"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: `all 0.6s cubic-bezier(0.32,0.72,0,1) 0.3s`,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(120,100,70,0.5)",
              paddingLeft: 0,
              marginBottom: 14,
            }}
          >
            Start from a template
          </p>

          {/* Horizontally scrollable carousel */}
          <div
            className="flex gap-3 overflow-x-auto pb-1"
            style={{
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
              scrollSnapType: "x proximity",
            }}
          >
            {TEMPLATES.map((tpl) => (
              <motion.button
                key={tpl.id}
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  onSelectTemplate?.(tpl.id);
                }}
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -2 }}
                className="flex-shrink-0 flex flex-col justify-between text-left rounded-2xl"
                style={{
                  minWidth: 120,
                  height: 150,
                  padding: "16px 14px",
                  background: tpl.gradient,
                  border: "1px solid transparent",
                  scrollSnapAlign: "start",
                }}
              >
                <span style={{ fontSize: 32 }}>{tpl.emoji}</span>
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "white",
                      lineHeight: 1.3,
                    }}
                  >
                    {tpl.name}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.4)",
                      marginTop: 2,
                    }}
                  >
                    {tpl.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            PHASE 6 — Quick Actions
           ═══════════════════════════════════════════════════ */}
        <div
          className="flex justify-center gap-8 w-full"
          style={{
            padding: "36px 24px 24px",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(15px)",
            transition: `all 0.6s cubic-bezier(0.32,0.72,0,1) 0.45s`,
          }}
        >
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => {
                triggerHaptic("light");
                onQuickAction?.(action.id);
              }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(168,162,158,0.08)",
                  border: "1px solid rgba(168,162,158,0.12)",
                  fontSize: 20,
                }}
              >
                {action.emoji}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#78716c",
                }}
              >
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
