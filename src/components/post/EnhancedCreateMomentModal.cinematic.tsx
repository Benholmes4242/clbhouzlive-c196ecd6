import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { useSnapModal } from "@/hooks/useSnapModal";
import { useOptimisticPostSubmission } from "@/hooks/useOptimisticPostSubmission";
import CourseTagInput from "@/components/posts/CourseTagInput";
import BackgroundMusicSelector from "@/components/posts/BackgroundMusicSelector";

type Props = { 
  theme?: "dark" | "light";
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  initialFiles?: File[];
  selectedCourse?: any;
  onCourseSelect?: (course: any) => void;
};

export default function EnhancedCreateMomentModalCinematic({ 
  theme = "dark", 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting,
  initialFiles = [],
  selectedCourse,
  onCourseSelect
}: Props) {
  const isDark = theme === "dark";

  const {
    caption,
    setCaption,
    selectedCourse: snapCourse,
    setSelectedCourse
  } = useSnapModal();

  // Use the files and course from props
  const files = initialFiles;
  const course = selectedCourse || snapCourse;

  const canPost = useMemo(() => files?.length > 0 && !isSubmitting, [files, isSubmitting]);

  const handlePost = async () => {
    if (!canPost) return;
    
    onSubmit({
      caption,
      files,
      selectedCourse: course,
      visibility: "public", // Default for now
      backgroundMusic: null // Default for now
    });
  };

  const panel = isDark ? "bg-black/60" : "bg-white/70";
  const card = isDark ? "bg-neutral-900/70 text-white" : "bg-white/85 text-neutral-900";
  const subtl = isDark ? "text-white/70" : "text-neutral-600";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* backdrop */}
          <div 
            className={`absolute inset-0 bg-white/10 backdrop-blur-xl`} 
            onClick={onClose} 
          />

          {/* shell */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              className="w-full max-w-[520px] bg-white/20 backdrop-blur-2xl ring-1 ring-white/20 rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.35)] border border-white/10"
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Edge-to-edge media header */}
              <MediaPreview items={files} theme={theme} />

              {/* Floating cards */}
              <div className="space-y-3 p-4 -mt-6">
                {/* Caption */}
                <div className={`rounded-2xl px-4 py-3 bg-white/15 backdrop-blur-md ring-1 ring-white/20 border border-white/10 text-white`}>
                  <label className={`block text-[15px] mb-1 text-white/70`}>Add a caption</label>
                  <div className="flex items-start gap-2">
                    <textarea
                      className="w-full bg-transparent outline-none resize-none placeholder-opacity-50"
                      rows={2}
                      placeholder="Write a caption…"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        // TODO: call AI caption helper
                        console.log("AI caption helper clicked");
                      }}
                      className={`${isDark ? "hover:bg-white/10" : "hover:bg-black/5"} px-3 py-2 rounded-lg shrink-0 transition-colors`}
                      aria-label="Write a caption for me"
                    >
                      ✨
                    </button>
                  </div>
                </div>

                {/* Course */}
                <div className={`rounded-2xl px-4 py-3 bg-white/15 backdrop-blur-md ring-1 ring-white/20 border border-white/10 text-white`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-[15px] mb-1">Tag a golf course</div>
                      <CourseTagInput
                        selectedCourse={course}
                        onCourseSelect={onCourseSelect || setSelectedCourse}
                        placeholder="Start typing to find a course..."
                      />
                    </div>
                    <button
                      onClick={() => {
                        // TODO: GPS location helper
                        console.log("GPS location helper clicked");
                      }}
                      className={`hover:bg-white/10 px-3 py-2 rounded-lg transition-colors`}
                      aria-label="Use my location"
                    >
                      📍
                    </button>
                  </div>
                </div>

                {/* Music */}
                <div className={`rounded-2xl px-4 py-3 bg-white/15 backdrop-blur-md ring-1 ring-white/20 border border-white/10 text-white`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-[15px] mb-1">Background music</div>
                      <div className={`text-white/70 text-sm`}>
                        Popular golf tracks today
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        // TODO: Background music selector
                        console.log("Music selector clicked");
                      }}
                      className={`hover:bg-white/10 px-3 py-2 rounded-lg transition-colors`}
                      aria-label="Select music"
                    >
                      🎵
                    </button>
                  </div>
                </div>

                {/* Visibility segmented */}
                <div className={`rounded-2xl px-2 py-2 bg-white/15 backdrop-blur-md ring-1 ring-white/20 border border-white/10 text-white`}>
                  <Segmented
                    value="public"
                    onChange={(value) => console.log("Visibility changed:", value)}
                    options={[
                      { value: "public", label: "Public" },
                      { value: "private", label: "Private Archive" },
                    ]}
                  />
                </div>

                {/* CTA */}
                <div className="pt-2" />
                <button
                  onClick={handlePost}
                  disabled={!canPost}
                  className="relative w-full h-12 rounded-2xl text-white bg-gradient-to-r from-emerald-600 to-lime-600 disabled:opacity-50 overflow-hidden transition-all duration-200 hover:from-emerald-500 hover:to-lime-500 disabled:hover:from-emerald-600 disabled:hover:to-lime-600"
                >
                  {isSubmitting && (
                    <motion.div
                      className="absolute inset-0"
                      initial={{ backgroundPositionX: "0%" }}
                      animate={{ backgroundPositionX: "200%" }}
                      transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                      style={{ 
                        backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,.18) 50%, transparent 100%)",
                        backgroundSize: "50% 100%"
                      }}
                    />
                  )}
                  <span className="relative z-10 font-medium">
                    {isSubmitting ? "Posting…" : "Post"}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Simple preview; swap with your carousel if available */
function MediaPreview({ items, theme }: { items: File[]; theme?: "dark" | "light" }) {
  const fallback = theme === "dark" ? "bg-black/40" : "bg-black/10";
  
  if (!items?.length) {
    return <div className={`h-56 ${fallback} flex items-center justify-center`}>
      <span className="text-white/50 text-sm">No media selected</span>
    </div>;
  }

  const firstFile = items[0];
  const previewUrl = URL.createObjectURL(firstFile);
  const isVideo = firstFile.type.startsWith('video/');

  return (
    <div className="relative h-56 bg-black">
      {isVideo ? (
        <video 
          src={previewUrl} 
          className="h-full w-full object-cover" 
          muted 
          playsInline
        />
      ) : (
        <img 
          src={previewUrl} 
          alt="" 
          className="h-full w-full object-cover" 
        />
      )}
      
      {/* Media count indicator */}
      {items.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
          1 / {items.length}
        </div>
      )}
      
      {/* Gradients for overlay effect */}
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
}

function Segmented({
  value, 
  onChange, 
  options,
}: { 
  value: string; 
  onChange: (v: string) => void; 
  options: { value: string; label: string }[] 
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl p-1 bg-white/10">
      {options.map(option => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`h-10 rounded-lg transition-all duration-200 font-medium
              ${active 
                ? "bg-white/90 text-neutral-900 shadow-sm" 
                : "text-white/80 hover:bg-white/10"
              }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}