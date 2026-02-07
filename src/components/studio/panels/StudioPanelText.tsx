import { useState, useEffect, useCallback } from 'react';
import { Plus, Move, ArrowLeft, Layers, ChevronUp, Type } from 'lucide-react';
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
  { id: 'scoreboard', label: 'Scoreboard', preview: 'AB' },
];

// Expanded 16-color palette
const COLORS = [
  '#FFFFFF', '#0a0a0a', '#FF9C40', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#F1F5F9', '#6B7280', '#F97316', '#06B6D4', '#EC4899', '#14B8A6', '#D97706', '#6366F1',
];

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
  
  const [internalSelectedBox, setInternalSelectedBox] = useState<string | null>(null);
  const selectedBox = activeOverlayId !== undefined ? activeOverlayId : internalSelectedBox;
  
  const handleSelectBox = useCallback((id: string | null) => {
    if (onSelectOverlay) {
      onSelectOverlay(id);
    } else {
      setInternalSelectedBox(id);
    }
  }, [onSelectOverlay]);

  useEffect(() => {
    setTextBoxes(edits?.textOverlays || []);
  }, [edits?.textOverlays]);

  const addTextBox = useCallback(() => {
    const baseY = 0.4;
    const yOffset = textBoxes.length * 0.08;
    const newY = Math.min(baseY + yOffset, 0.75);
    
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
    handleSelectBox(newBox.id);
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
      handleSelectBox(updated.length > 0 ? updated[updated.length - 1].id : null);
    }
  }, [textBoxes, updateEdits, selectedBox, handleSelectBox]);
  
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
          <h4 className="font-semibold text-foreground">Position text</h4>
          <button
            onClick={onTogglePositionMode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to editing
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Drag to move • Pinch to resize • Use handle to rotate
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Layers header */}
      <div className="px-3 pt-2 pb-1.5 flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Layers</span>
        <span className="text-[11px] text-muted-foreground/50 ml-auto">{textBoxes.length}</span>
      </div>
      
      {/* Text boxes list OR empty state */}
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {!hasTextLayers ? (
          /* Inviting empty state CTA */
          <button
            onClick={addTextBox}
            className="w-full py-6 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Type className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">Tap to add text overlay</span>
            <span className="text-[11px] text-muted-foreground">Add captions, titles, or labels</span>
          </button>
        ) : (
          <div className="space-y-1">
            {[...textBoxes].reverse().map((box, reverseIndex) => {
              const isSelected = selectedBox === box.id;
              const isTopLayer = reverseIndex === 0;
              
              return (
                <div key={box.id}>
                  {/* Layer row */}
                  <div
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
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/40 bg-card hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-[13px] font-medium text-foreground truncate">{box.text}</span>
                        <span className="text-[10px] text-muted-foreground/70 flex-shrink-0">
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
                            className="text-muted-foreground/50 hover:text-foreground p-0.5"
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
                          className="text-muted-foreground/50 hover:text-destructive text-[10px] font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline controls for selected layer — text input sits directly below its layer */}
                  {isSelected && selected && (
                    <div className="mt-1.5 space-y-2.5 pb-2">
                      {/* Text input — directly below the layer it belongs to */}
                      <input
                        type="text"
                        value={selected.text}
                        onChange={(e) => updateBox(selected.id, { text: e.target.value })}
                        placeholder="Enter text..."
                        className="w-full px-2.5 py-1.5 rounded-md border border-border/60 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-ring/20 bg-card text-foreground"
                      />

                      {/* Position on media button */}
                      {onTogglePositionMode && (
                        <button
                          onClick={onTogglePositionMode}
                          className="w-full py-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-center gap-1.5 text-muted-foreground text-xs font-medium"
                        >
                          <Move className="w-3.5 h-3.5" />
                          Position on media
                        </button>
                      )}

                      {/* Style selector */}
                      <div>
                        <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Style</label>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5">
                          {STYLE_PRESETS.map(preset => (
                            <button
                              key={preset.id}
                              onClick={() => updateBox(selected.id, { style: preset.id })}
                              className={cn(
                                "flex-shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-md border transition-all min-w-[52px]",
                                selected.style === preset.id
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border/40 bg-card text-foreground hover:bg-muted/30'
                              )}
                            >
                              <span 
                                className={cn(
                                  "text-base leading-none",
                                  PREVIEW_FONTS[preset.id],
                                )}
                              >
                                {preset.preview}
                              </span>
                              <span className="text-[9px] font-medium">{preset.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Size slider — custom styled */}
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-medium text-muted-foreground w-8">Size</label>
                        <input
                          type="range"
                          min="0.6"
                          max="3"
                          step="0.1"
                          value={selected.scale}
                          onChange={(e) => updateBox(selected.id, { scale: parseFloat(e.target.value) })}
                          className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-5
                            [&::-webkit-slider-thumb]:h-5
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-primary
                            [&::-webkit-slider-thumb]:shadow-md
                            [&::-webkit-slider-thumb]:cursor-grab
                            [&::-webkit-slider-thumb]:active:cursor-grabbing
                            [&::-moz-range-thumb]:w-5
                            [&::-moz-range-thumb]:h-5
                            [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:bg-primary
                            [&::-moz-range-thumb]:border-0
                            [&::-moz-range-thumb]:shadow-md"
                        />
                        <span className="text-[11px] text-muted-foreground w-8 text-right font-mono">{(selected.scale * 100).toFixed(0)}%</span>
                      </div>

                      {/* Color picker — expanded 16 colors */}
                      <div>
                        <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Color</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => updateBox(selected.id, { color })}
                              className={cn(
                                "w-7 h-7 rounded-md border-2 transition-all",
                                selected.color === color
                                  ? 'border-primary scale-105 ring-1 ring-primary/20'
                                  : 'border-border/40 hover:scale-105'
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
            })}
            
            {/* Add another button */}
            <button
              onClick={addTextBox}
              className="w-full py-1.5 mt-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex items-center justify-center gap-1 text-[11px]"
            >
              <Plus className="w-3 h-3" />
              <span className="font-medium">Add another</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
