/**
 * Game Expanded Notes
 * Shows game notes with ellipsis truncation
 */

type GameExpandedNotesProps = {
  notes?: string | null;
};

export function GameExpandedNotes({ notes }: GameExpandedNotesProps) {
  if (!notes) return null;
  
  return (
    <div 
      className="mt-2.5 text-[13px] leading-5 line-clamp-2"
      style={{ color: 'var(--hub-text-body)', opacity: 0.75 }}
    >
      {notes}
    </div>
  );
}
