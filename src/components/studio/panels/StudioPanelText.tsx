import { useState, useEffect, useCallback } from 'react';
import { Plus, Move, ArrowLeft, Layers, ChevronUp } from 'lucide-react';
import { StudioEdits, TextOverlay, TextStyle } from '@/types/studio';
import { nanoid } from 'nanoid';
import { cn } from '@/lib/utils';

type StudioPanelTextProps = {
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  onApply: () => void;
  onReset: () => void;
  isPositioningText?: boolean;
  onTogglePositionMode?: () => void;
  activeOverlayId?: string | null;
  onSelectOverlay?: (id: string | null) => void;
};

// 8 style presets with preview labels
const STYLE_PRESETS: { id: TextStyle; label: string; preview: string }[] = [
  { id: 'modern_bold', label: 'Bold', preview: 'Aa' },
  { id: 'classic_serif', label: 'Serif', preview: 'Aa' },
  { id: 'signature', label: 'Script', preview: 'Aa' },
  { id: 'impact', label: 'Impact', preview: 'AA' },
  { id: 'outline', label: 'Outline', preview: 'Aa' },
  { id: 'neon', label: 'Neon', preview: 'Aa' },
  { id: 'glass', label: 'Glass', preview: 'Aa' },
  { id: 'scoreboard', label: 'Score', preview: 'AB' },
];

const COLORS = ['#FFFFFF', '#0a0a0a', '#FF9C40', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

// Font class preview mapping for style chips
const PREVIEW_FONTS: Record<TextStyle, string> = {
  modern_bold: 'font-sans font-extrabold',
  classic_serif: 'font-serif italic',
  signature: 'font-cursive',
  impact: 'font-sans font-black uppercase',
  outline: 'font-sans font-bold uppercase',
  neon: 'font-sans font-bold',
  glass: 'font-sans font-semibold',
  scoreboard: 'font-mono font-bold uppercase',
  // Legacy
  modern: 'font-sans font-bold',
  classic: 'font-serif italic',
};

export default function StudioPanelText({ 
  edits, 
  updateEdits, 
  onApply, 
  onReset,
  isPositioningText = false,
  onTogglePositionMode,
  activeOverlayId,
  onSelectOverlay
}: StudioPanelTextProps) {
  const [textBoxes, setTextBoxes] = useState<TextOverlay[]>(edits?.textOverlays || []);
  
  // Use external selection if provided, else internal
  const [internalSelectedBox, setInternalSelectedBox] = useState<string | null>(null);
  const selectedBox = activeOverlayId !== undefined ? activeOverlayId : internalSelectedBox;
  
  const handleSelectBox = useCallback((id: string | null) => {
    if (onSelectOverlay) {
      onSelectOverlay(id);
    } else {
      setInternalSelectedBox(id);
    }
  }, [onSelectOverlay]);

  // Sync with external edits changes
  useEffect(() => {
    setTextBoxes(edits?.textOverlays || []);
  }, [edits?.textOverlays]);

  const addTextBox = useCallback(() => {
    // Cascade positioning within safe area: stack subsequent overlays below center
    const baseY = 0.4; // Start a bit above center for safe area
    const yOffset = textBoxes.length * 0.08;
    const newY = Math.min(baseY + yOffset, 0.75); // Stay within safe bottom margin
    
    const newBox: TextOverlay = {
      id: nanoid(),
      text: 'New text',
      x: 0.5,
      y: newY,
      scale: 1.2,
      rotation: 0,
      style: 'modern_bold',
      color: '#FFFFFF'
    };
    const updated = [...textBoxes, newBox];
    setTextBoxes(updated);
    handleSelectBox(newBox.id); // Auto-select new overlay
    updateEdits({ textOverlays: updated });
  }, [textBoxes, updateEdits, handleSelectBox]);

  const updateBox = useCallback((id: string, changes: Partial<TextOverlay>) => {
    const updated = textBoxes.map(box => 
      box.id === id ? { ...box, ...changes } : box
    );
    setTextBoxes(updated);
    updateEdits({ textOverlays: updated });
  }, [textBoxes, updateEdits]);

  const removeBox = useCallback((id: string) => {
    const updated = textBoxes.filter(box => box.id !== id);
    setTextBoxes(updated);
    updateEdits({ textOverlays: updated });
    if (selectedBox === id) {
      // Select the last remaining overlay, or null
      handleSelectBox(updated.length > 0 ? updated[updated.length - 1].id : null);
    }
  }, [textBoxes, updateEdits, selectedBox, handleSelectBox]);
  
  // Bring selected overlay to front (move to end of array)
  const bringToFront = useCallback((id: string) => {
    const index = textBoxes.findIndex(box => box.id === id);
    if (index === -1 || index === textBoxes.length - 1) return;
    
    const updated = [...textBoxes];
    const [item] = updated.splice(index, 1);
    updated.push(item);
    setTextBoxes(updated);
    updateEdits({ textOverlays: updated });
  }, [textBoxes, updateEdits]);

  const selected = textBoxes.find(box => box.id === selectedBox);

  // Compact view when positioning
  if (isPositioningText) {
    return (
      <div className="flex flex-col h-full max-h-[20vh] py-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-zinc-900">Position text</h4>
          <button
            onClick={onTogglePositionMode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to editing
          </button>
        </div>
        <p className="text-xs text-zinc-500 text-center">
          Drag to move • Pinch to resize • Use handle to rotate
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Layers header */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <Layers className="w-4 h-4 text-zinc-500" />
        <span className="text-sm font-medium text-zinc-700">Layers</span>
        <span className="text-xs text-zinc-400 ml-auto">{textBoxes.length} text{textBoxes.length !== 1 ? 's' : ''}</span>
      </div>
      
      {/* Text boxes list (Layers) */}
      <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
        {textBoxes.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <p className="text-sm">No text added yet</p>
            <p className="text-xs mt-1">Tap + to add text to your media</p>
          </div>
        ) : (
          // Render in reverse order so newest appears at top
          [...textBoxes].reverse().map((box, reverseIndex) => {
            const isSelected = selectedBox === box.id;
            const isTopLayer = reverseIndex === 0;
            
            return (
              <button
                key={box.id}
                onClick={() => handleSelectBox(box.id)}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-colors",
                  isSelected
                    ? 'border-[rgba(255,156,64,0.5)] bg-[rgba(255,156,64,0.05)]'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-zinc-900 truncate flex-1">{box.text}</span>
                  <div className="flex items-center gap-2">
                    {/* Bring to front button */}
                    {!isTopLayer && isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          bringToFront(box.id);
                        }}
                        className="text-zinc-400 hover:text-zinc-600 p-1"
                        title="Bring to front"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBox(box.id);
                      }}
                      className="text-zinc-400 hover:text-red-500 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {STYLE_PRESETS.find(p => p.id === box.style)?.label || box.style} • {(box.scale * 100).toFixed(0)}%
                  {box.rotation ? ` • ${Math.round(box.rotation)}°` : ''}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Controls for selected box */}
      {selected && (
        <div className="p-4 border-t border-zinc-200 bg-white space-y-4 max-h-[50vh] overflow-y-auto">
          {/* Text input */}
          <div>
            <label className="block text-body-sm font-medium text-zinc-700 mb-2">Text</label>
            <input
              type="text"
              value={selected.text}
              onChange={(e) => updateBox(selected.id, { text: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:border-[rgba(255,156,64,0.5)]"
            />
          </div>

          {/* Position on media button */}
          {onTogglePositionMode && (
            <button
              onClick={onTogglePositionMode}
              className="w-full py-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-zinc-800 font-medium"
            >
              <Move className="w-5 h-5" />
              Position on media
            </button>
          )}

          {/* Style selector - horizontal scrolling chips */}
          <div>
            <label className="block text-body-sm font-medium text-zinc-700 mb-2">Style</label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {STYLE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => updateBox(selected.id, { style: preset.id })}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all min-w-[60px]",
                    selected.style === preset.id
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  )}
                >
                  <span 
                    className={cn(
                      "text-base leading-none",
                      PREVIEW_FONTS[preset.id],
                      selected.style === preset.id ? 'text-white' : 'text-zinc-900'
                    )}
                  >
                    {preset.preview}
                  </span>
                  <span className="text-[10px] font-medium">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scale slider */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Size</label>
            <input
              type="range"
              min="0.6"
              max="3"
              step="0.1"
              value={selected.scale}
              onChange={(e) => updateBox(selected.id, { scale: parseFloat(e.target.value) })}
              className="w-full accent-zinc-900"
            />
            <div className="text-xs text-zinc-500 mt-1">{(selected.scale * 100).toFixed(0)}%</div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => updateBox(selected.id, { color })}
                  className={cn(
                    "w-9 h-9 rounded-lg border-2 transition-all",
                    selected.color === color
                      ? 'border-zinc-900 scale-110 ring-2 ring-zinc-900/20'
                      : 'border-zinc-200 hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add button */}
      <div className="p-4 border-t border-zinc-200">
        <button
          onClick={addTextBox}
          className="w-full py-3 rounded-lg border-2 border-dashed border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Text</span>
        </button>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-zinc-200 flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 py-2.5 rounded-lg border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={onApply}
          className="flex-1 py-2.5 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
