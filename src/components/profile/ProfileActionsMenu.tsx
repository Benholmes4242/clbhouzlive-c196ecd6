import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

interface ProfileActionsMenuProps {
  onEditProfile: () => void;
  onMediaManager: () => void;
  onImmersivePreview: () => void;
  align?: "left" | "right";
}

export function ProfileActionsMenu({
  onEditProfile,
  onMediaManager,
  onImmersivePreview,
  align = "right",
}: ProfileActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Profile actions"
        onClick={() => setOpen(v => !v)}
        className="ml-2 inline-flex items-center justify-center rounded-full p-2
                   hover:bg-white/60 active:bg-white/70 border border-white/60
                   bg-white/50 backdrop-blur-md transition"
      >
        <MoreVertical className="h-5 w-5 text-gray-800" />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute mt-2 min-w-[200px] rounded-xl border border-gray-200
                      bg-white/90 backdrop-blur-md shadow-lg focus:outline-none z-50
                      ${align === "right" ? "right-0" : "left-0"}`}
        >
          <ul className="py-1">
            <li>
              <button
                role="menuitem"
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                onClick={() => { setOpen(false); onEditProfile(); }}
              >
                Edit Profile
              </button>
            </li>
            <li>
              <button
                role="menuitem"
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                onClick={() => { setOpen(false); onMediaManager(); }}
              >
                Media Manager
              </button>
            </li>
            <li>
              <button
                role="menuitem"
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                onClick={() => { setOpen(false); onImmersivePreview(); }}
              >
                Immersive Preview
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}