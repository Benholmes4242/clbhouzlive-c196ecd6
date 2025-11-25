
import React from 'react';
import MentionSuggestions from './MentionSuggestions';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface CaptionInputProps {
  captionInputRef: React.RefObject<HTMLDivElement>;
  onInput: (e: React.FormEvent<HTMLDivElement>) => void;
  showSuggestions: boolean;
  mentionSuggestions: TaggableEntity[];
  onSelectMention: (entity: TaggableEntity) => void;
}

const CaptionInput = ({ 
  captionInputRef, 
  onInput, 
  showSuggestions, 
  mentionSuggestions, 
  onSelectMention 
}: CaptionInputProps) => {
  return (
    <div className="relative">
      <div
        ref={captionInputRef}
        contentEditable
        className="min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-slate-600"
        onInput={onInput}
        data-placeholder="Write your caption and tag friends with @..."
        suppressContentEditableWarning={true}
        style={{
          minHeight: '80px',
        }}
      />

      <MentionSuggestions
        suggestions={mentionSuggestions}
        onSelect={onSelectMention}
        isVisible={showSuggestions}
      />
    </div>
  );
};

export default CaptionInput;
