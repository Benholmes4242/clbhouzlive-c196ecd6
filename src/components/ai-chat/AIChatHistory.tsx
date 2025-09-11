// src/components/ai-chat/AIChatHistory.tsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  MODAL_PANEL_SIZES,
  MODAL_ANIMATION,
  MODAL_Z_INDEX,
  MODAL_BEHAVIOUR,
} from "@/ui/modal/constants";
import { panelVariants, overlayVariants, transition } from "@/ui/modal/variants";
import { FLAGS } from "@/config/flags";

// If you have a legacy, centered/glass history modal, import it here for the flag fallback.
// import { LegacyAIChatHistory } from "./LegacyAIChatHistory";

type AIChatHistoryProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectMessage: (message: string) => void;
  onNewConversation?: () => void;
  // Add any props you already use below:
  // historyItems?: YourHistoryItemType[];
  // selectedId?: string;
};

function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [locked]);
}

export default function AIChatHistory(props: AIChatHistoryProps) {
  const { isOpen, onClose } = props;

  // Feature flag rollback to legacy behaviour if needed
  if (!FLAGS.ECHO_MODAL_USE_PROFILE_BEHAVIOUR) {
    // return <LegacyAIChatHistory {...props} />;
    // Temporary fallback if you don't have a legacy component exposed:
    return null;
  }

  // Match ProfileModalRouter behaviour
  useScrollLock(isOpen);

  // Escape-to-close (only if behaviour allows it)
  useEffect(() => {
    if (!isOpen || !MODAL_BEHAVIOUR.closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay — identical behaviour to ProfileModalRouter */}
      <motion.div
        className="fixed inset-0 bg-black/50"
        style={{ zIndex: MODAL_Z_INDEX.container }}
        variants={overlayVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        exit="closed"
        transition={transition}
        onClick={MODAL_BEHAVIOUR.closeOnOverlay ? onClose : undefined}
        aria-hidden
        data-testid="ai-history-overlay"
      />

      {/* Right slide panel — exact sizing via shared constants */}
      <motion.aside
        className={[
          "fixed inset-y-0 right-0",
          "bg-white dark:bg-neutral-900 shadow-xl",
          "md:rounded-l-2xl",
          "flex flex-col",
          // Widths use CSS vars so we can map arbitrary values from constants
          "w-[--history-mobile-w] md:w-[--history-desktop-w] max-w-[--history-max-w]",
        ].join(" ")}
        style={{
          zIndex: MODAL_Z_INDEX.panel,
          ["--history-mobile-w" as any]: MODAL_PANEL_SIZES.mobileWidth,
          ["--history-desktop-w" as any]: MODAL_PANEL_SIZES.desktopWidth,
          ["--history-max-w" as any]: MODAL_PANEL_SIZES.desktopMaxWidth,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Echo History"
        variants={panelVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        exit="closed"
        transition={transition}
        data-testid="ai-history-panel"
      >
        {/* Header (keep minimal; style to your project) */}
        <div className="sticky top-0 z-[1] flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
          <h2 className="text-base font-semibold">Swing Coach & Chat History</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Close history"
          >
            ✕
          </button>
        </div>

        {/* Body — put your existing history UI here */}
        <div className="flex-1 overflow-auto px-4 py-4">
          {/* TODO: Reinsert your previous history list/content here.
              Keep markup only (no additional modal wrappers).
              Example:
              <HistoryList items={props.historyItems} selectedId={props.selectedId} onSelect={...} />
          */}
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">History functionality will be restored here</p>
            <p className="text-xs mt-2">Using ProfileModalRouter-standardized behavior</p>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
