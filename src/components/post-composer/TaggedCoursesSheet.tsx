// TaggedCoursesSheet — manage the list of courses tagged on a post.
// Open when ≥1 course is tagged; shows each with a remove ✕ and an "Add another" CTA.

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X, MapPin } from 'lucide-react';
import type { TaggedCourse } from './types';

const INK_2 = '#0F172A';
const INK_MUTE = '#64748B';
const SURFACE = '#FFFFFF';
const HAIR = 'rgba(15,23,42,0.07)';
const AMBER = '#F7931E';
const AMBER_SOFT = '#FEF3E7';

interface TaggedCoursesSheetProps {
  open: boolean;
  courses: TaggedCourse[];
  onClose: () => void;
  onRemove: (courseId: string) => void;
  onAdd: () => void;
}

export function TaggedCoursesSheet({
  open,
  courses,
  onClose,
  onRemove,
  onAdd,
}: TaggedCoursesSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.30)',
            zIndex: 10000,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              background: SURFACE,
              borderRadius: '20px 20px 0 0',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
              maxHeight: '78vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.15)' }} />
            </div>

            <div style={{ padding: '6px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: 'rgba(15,23,42,0.40)',
                  }}
                >
                  Tagged courses
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: INK_2 }}>
                  {courses.length} tagged
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(15,23,42,0.05)',
                  border: `1px solid ${HAIR}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={14} strokeWidth={2.5} color="rgba(15,23,42,0.5)" />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
              {courses.map((c, i) => (
                <div
                  key={c.courseId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 12,
                    borderBottom: i < courses.length - 1 ? `0.5px solid ${HAIR}` : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: 'rgba(34,197,94,0.08)',
                      border: '1px solid rgba(34,197,94,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                    }}
                  >
                    ⛳
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: INK_2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {c.courseName}
                      {i === 0 && courses.length > 1 && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            color: AMBER,
                            background: AMBER_SOFT,
                            padding: '2px 6px',
                            borderRadius: 4,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Primary
                        </span>
                      )}
                    </div>
                    {(c.region || c.country) && (
                      <div
                        style={{
                          fontSize: 12,
                          color: INK_MUTE,
                          marginTop: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <MapPin size={11} strokeWidth={1.75} />
                        {[c.region, c.country].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onRemove(c.courseId)}
                    aria-label={`Remove ${c.courseName}`}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(15,23,42,0.05)',
                      border: `1px solid ${HAIR}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <X size={14} strokeWidth={2.5} color={INK_MUTE} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ padding: '10px 16px 0', borderTop: `0.5px solid ${HAIR}` }}>
              <button
                onClick={onAdd}
                style={{
                  width: '100%',
                  padding: '13px 0',
                  borderRadius: 12,
                  border: `1px dashed rgba(15,23,42,0.18)`,
                  background: 'transparent',
                  fontSize: 13,
                  fontWeight: 700,
                  color: INK_2,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Plus size={16} strokeWidth={2} />
                Add another course
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TaggedCoursesSheet;
