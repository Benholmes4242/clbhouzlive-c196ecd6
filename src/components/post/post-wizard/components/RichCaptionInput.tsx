import {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type { TaggableEntity } from '@/components/post/create-moment/types';

interface RichCaptionInputProps {
  value: string;
  onChange: (plainText: string) => void;
  mentions: TaggableEntity[];
  onCursorChange?: (position: number) => void;
  onMentionQueryChange?: (query: string | null) => void;
  placeholder?: string;
  maxLength?: number;
  accentColor?: string;
}

export interface RichCaptionInputHandle {
  insertMention: (entity: TaggableEntity, replaceRange: [number, number]) => void;
  focus: () => void;
}

/**
 * ContentEditable-based caption input that renders @mentions as styled inline spans.
 *
 * Serialization strategy:
 * - Internal DOM uses styled <span> elements for mentions
 * - onChange emits plain text where mentions are `@username`
 * - The visual layer is purely presentation
 */
export const RichCaptionInput = forwardRef<RichCaptionInputHandle, RichCaptionInputProps>(
  function RichCaptionInput(
    {
      value,
      onChange,
      mentions,
      onCursorChange,
      onMentionQueryChange,
      placeholder = 'Share your round, tip, or moment...',
      maxLength = 2200,
      accentColor = '#f59e0b',
    },
    ref
  ) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isEmpty, setIsEmpty] = useState(!value);
    const isComposingRef = useRef(false);
    const suppressInputRef = useRef(false);

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      insertMention(entity: TaggableEntity, replaceRange: [number, number]) {
        const el = editorRef.current;
        if (!el) return;

        const sanitizedName = (entity.username || entity.name).replace(/\s+/g, '');
        const displayText = `@${sanitizedName}`;

        // Serialize current content, splice in mention, re-render
        const currentText = serializeToPlainText(el);
        const before = currentText.slice(0, replaceRange[0]);
        const after = currentText.slice(replaceRange[1]);
        const newText = `${before}${displayText} ${after}`;

        // Update parent state
        suppressInputRef.current = true;
        onChange(newText);

        // Re-render with mentions
        requestAnimationFrame(() => {
          renderWithMentions(el, newText, [...mentions, entity], accentColor);
          setIsEmpty(false);
          placeCaretAtEnd(el);
          suppressInputRef.current = false;
        });
      },
      focus() {
        editorRef.current?.focus();
      },
    }));

    // Sync value from parent when it changes externally (e.g. draft load)
    useEffect(() => {
      const el = editorRef.current;
      if (!el || suppressInputRef.current) return;

      const currentPlain = serializeToPlainText(el);
      if (currentPlain !== value) {
        renderWithMentions(el, value, mentions, accentColor);
        setIsEmpty(!value);
      }
    }, [value, mentions, accentColor]);

    // Handle input events
    const handleInput = useCallback(() => {
      if (suppressInputRef.current || isComposingRef.current) return;
      const el = editorRef.current;
      if (!el) return;

      const plainText = serializeToPlainText(el);

      // Enforce max length
      if (maxLength && plainText.length > maxLength) {
        const truncated = plainText.slice(0, maxLength);
        renderWithMentions(el, truncated, mentions, accentColor);
        onChange(truncated);
        return;
      }

      setIsEmpty(!plainText);
      onChange(plainText);

      // Detect cursor for mention query
      const cursor = getCaretOffset(el);
      onCursorChange?.(cursor);

      const textBeforeCursor = plainText.slice(0, cursor);
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
      onMentionQueryChange?.(mentionMatch ? mentionMatch[1] : null);
    }, [onChange, maxLength, mentions, accentColor, onCursorChange, onMentionQueryChange]);

    // Paste as plain text
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    }, []);

    // Track cursor on click/keyup for mention detection
    const handleCursorMove = useCallback(() => {
      if (isComposingRef.current) return;
      const el = editorRef.current;
      if (!el) return;

      const cursor = getCaretOffset(el);
      onCursorChange?.(cursor);

      const plainText = serializeToPlainText(el);
      const textBeforeCursor = plainText.slice(0, cursor);
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
      onMentionQueryChange?.(mentionMatch ? mentionMatch[1] : null);
    }, [onCursorChange, onMentionQueryChange]);

    return (
      <div className="relative">
        {/* Placeholder */}
        {isEmpty && (
          <div
            className="absolute top-0 left-0 pointer-events-none select-none text-[20px] font-normal leading-[1.42] tracking-tight"
            style={{ color: '#C7C7CC' }}
          >
            {placeholder}
          </div>
        )}

        {/* ContentEditable div */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          onClick={handleCursorMove}
          onKeyUp={handleCursorMove}
          onCompositionStart={() => { isComposingRef.current = true; }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
            handleInput();
          }}
          className="w-full min-h-[130px] bg-transparent outline-none text-[20px] font-normal leading-[1.42] tracking-tight"
          style={{
            caretColor: accentColor,
            color: '#1A1A1A',
            WebkitUserModify: 'read-write-plaintext-only' as any,
            wordBreak: 'break-word',
          }}
          role="textbox"
          aria-multiline="true"
          aria-label="Caption"
        />
      </div>
    );
  }
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Serialize a contentEditable element to plain text, converting mention spans to @username */
function serializeToPlainText(el: HTMLElement): string {
  let text = '';
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (element.dataset.mentionId) {
        // Mention span — serialize as @username
        text += element.textContent || '';
      } else if (element.tagName === 'BR') {
        text += '\n';
      } else {
        text += serializeToPlainText(element);
      }
    }
  }
  return text;
}

/** Render plain text into contentEditable, converting @username matches to styled spans */
function renderWithMentions(
  el: HTMLElement,
  text: string,
  mentions: TaggableEntity[],
  accentColor: string
) {
  el.innerHTML = '';

  if (!text) return;

  // Build a set of usernames to match against
  const mentionMap = new Map<string, TaggableEntity>();
  for (const m of mentions) {
    const username = (m.username || m.name).toLowerCase().replace(/\s+/g, '');
    mentionMap.set(username, m);
  }

  // Split text by @mentions and render
  const regex = /@([\w.@'+\-]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      el.appendChild(document.createTextNode(beforeText));
    }

    const username = match[1].toLowerCase();
    const entity = mentionMap.get(username);

    if (entity) {
      // Render as styled mention span
      const span = document.createElement('span');
      span.dataset.mentionId = entity.id;
      span.dataset.mentionType = entity.entity_type;
      span.contentEditable = 'false';
      span.style.cssText = `
        color: ${accentColor};
        background-color: ${accentColor}14;
        padding: 2px 4px;
        border-radius: 6px;
        font-weight: 500;
        cursor: default;
        user-select: all;
        line-height: inherit;
      `;
      span.textContent = `@${entity.username || entity.name}`;
      el.appendChild(span);
    } else {
      // No matching mention — render as plain text
      el.appendChild(document.createTextNode(match[0]));
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    el.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
}

/** Get the caret offset as a character position in the serialized plain text */
function getCaretOffset(el: HTMLElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0);
  const preRange = document.createRange();
  preRange.selectNodeContents(el);
  preRange.setEnd(range.startContainer, range.startOffset);

  // Create a temp element, serialize the pre-range content to get char count
  const tempEl = document.createElement('div');
  tempEl.appendChild(preRange.cloneContents());
  return serializeToPlainText(tempEl).length;
}

/** Place the caret at the end of the contentEditable element */
function placeCaretAtEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}
