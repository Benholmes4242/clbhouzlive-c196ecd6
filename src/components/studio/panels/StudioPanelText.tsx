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
  const hasTextLayers = textBoxes.length > 0;

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
      {/* Layers header - compact */}
      <div className="px-3 pt-2 pb-1.5 flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-xs font-medium text-zinc-600">Layers</span>
        <span className="text-[11px] text-zinc-400 ml-auto">{textBoxes.length}</span>
      </div>
      
      {/* Text boxes list (Layers) OR empty state CTA */}
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {!hasTextLayers ? (
          /* Empty state: Single clear CTA */
          <button
            onClick={addTextBox}
            className="w-full py-4 rounded-lg border border-dashed border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 transition-colors flex flex-col items-center justify-center gap-1"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Add Text</span>
          </button>
        ) : (
          /* Layers list - ultra compact rows */
          <div className="space-y-1">
            {[...textBoxes].reverse().map((box, reverseIndex) => {
              const isSelected = selectedBox === box.id;
              const isTopLayer = reverseIndex === 0;
              
              return (
                <div
                  key={box.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectBox(box.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectBox(box.id);
                    }
                  }}
                  className={cn(
                    "w-full px-2 py-1.5 rounded-md border text-left transition-colors cursor-pointer",
                    isSelected
                      ? 'border-[rgba(255,156,64,0.4)] bg-[rgba(255,156,64,0.04)]'
                      : 'border-zinc-100 bg-white hover:bg-zinc-50'
                  )}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-[13px] font-medium text-zinc-800 truncate">{box.text}</span>
                      <span className="text-[10px] text-zinc-400 opacity-70 flex-shrink-0">
                        {STYLE_PRESETS.find(p => p.id === box.style)?.label} · {(box.scale * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {!isTopLayer && isSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            bringToFront(box.id);
                          }}
                          className="text-zinc-300 hover:text-zinc-500 p-0.5"
                          title="Bring to front"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBox(box.id);
                        }}
                        className="text-zinc-300 hover:text-red-400 text-[10px] font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Inline add button - slim secondary style */}
            <button
              onClick={addTextBox}
              className="w-full py-1.5 mt-0.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-1 text-[11px]"
            >
              <Plus className="w-3 h-3" />
              <span className="font-medium">Add another</span>
            </button>
          </div>
        )}
      </div>

      {/* Controls for selected box - compact */}
      {selected && (
        <div className="px-3 py-2.5 border-t border-zinc-100 bg-white space-y-2.5 max-h-[45vh] overflow-y-auto">
          {/* Text input - compact */}
          <div>
            <input
              type="text"
              value={selected.text}
              onChange={(e) => updateBox(selected.id, { text: e.target.value })}
              placeholder="Enter text..."
              className="w-full px-2.5 py-1.5 rounded-md border border-zinc-200 text-sm focus:outline-none focus:border-[rgba(255,156,64,0.5)] focus:ring-1 focus:ring-[rgba(255,156,64,0.2)]"
            />
          </div>

          {/* Position on media button - secondary style */}
          {onTogglePositionMode && (
            <button
              onClick={onTogglePositionMode}
              className="w-full py-2 rounded-md bg-zinc-50 hover:bg-zinc-100 transition-colors flex items-center justify-center gap-1.5 text-zinc-600 text-xs font-medium"
            >
              <Move className="w-3.5 h-3.5" />
              Position on media
            </button>
          )}

          {/* Style selector - compact chips */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Style</label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5">
              {STYLE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => updateBox(selected.id, { style: preset.id })}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md border transition-all min-w-[48px]",
                    selected.style === preset.id
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  )}
                >
                  <span 
                    className={cn(
                      "text-sm leading-none",
                      PREVIEW_FONTS[preset.id],
                      selected.style === preset.id ? 'text-white' : 'text-zinc-900'
                    )}
                  >
                    {preset.preview}
                  </span>
                  <span className="text-[9px] font-medium">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size slider - compact */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-medium text-zinc-500 w-8">Size</label>
            <input
              type="range"
              min="0.6"
              max="3"
              step="0.1"
              value={selected.scale}
              onChange={(e) => updateBox(selected.id, { scale: parseFloat(e.target.value) })}
              className="flex-1 accent-zinc-900 h-1"
            />
            <span className="text-[11px] text-zinc-500 w-8 text-right">{(selected.scale * 100).toFixed(0)}%</span>
          </div>

          {/* Color picker - compact */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Color</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => updateBox(selected.id, { color })}
                  className={cn(
                    "w-7 h-7 rounded-md border-2 transition-all",
                    selected.color === color
                      ? 'border-zinc-900 scale-105 ring-1 ring-zinc-900/20'
                      : 'border-zinc-200 hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
