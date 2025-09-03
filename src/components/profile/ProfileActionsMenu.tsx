import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

type Props = {
  onEditProfile: () => void;
  onOpenMediaManager: () => void;
  onOpenImmersivePreview: () => void;
  align?: "left" | "right";
};

export function ProfileActionsMenu({
  onEditProfile,
  onOpenMediaManager,
  onOpenImmersivePreview,
  align = "right",
}: Props) {
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
        className="ml-2 inline-flex items-center justify-center rounded-full p-1.5
                   hover:bg-black/10 active:bg-black/15 
                   transition-colors duration-200"
      >
        <MoreVertical className="h-4 w-4 text-current" />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute mt-2 min-w-[200px] rounded-xl border border-gray-200/50
                      bg-white/95 backdrop-blur-md shadow-xl focus:outline-none z-50
                      ${align === "right" ? "right-0" : "left-0"}`}
        >
          <ul className="py-1">
            <li>
              <button
                role="menuitem"
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100/70 text-gray-800 
                          first:rounded-t-xl transition-colors duration-150"
                onClick={() => { setOpen(false); onEditProfile(); }}
              >
                Edit Profile
              </button>
            </li>
            <li>
              <button
                role="menuitem"
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100/70 text-gray-800
                          transition-colors duration-150"
                onClick={() => { setOpen(false); onOpenMediaManager(); }}
              >
                Media Manager
              </button>
            </li>
            <li>
              <button
                role="menuitem"  
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100/70 text-gray-800
                          last:rounded-b-xl transition-colors duration-150"
                onClick={() => { setOpen(false); onOpenImmersivePreview(); }}
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