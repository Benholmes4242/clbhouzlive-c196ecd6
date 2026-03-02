import { useState, useEffect, useCallback } from 'react';
import { Plus, Layers, ChevronUp, Type } from 'lucide-react';
import { StudioEdits, TextOverlay, TextStyle } from '@/types/studio';
import { nanoid } from 'nanoid';

type StudioPanelTextProps = {
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  onApply: () => void;
  onReset: () => void;
  activeOverlayId?: string | null;
  onSelectOverlay?: (id: string | null) => void;
};

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

const COLORS = [
  '#FFFFFF', '#0a0a0a', '#FF9C40', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#F1F5F9', '#6B7280', '#F97316', '#06B6D4', '#EC4899', '#14B8A6', '#D97706', '#6366F1',
];

const PREVIEW_FONTS: Record<TextStyle, string> = {
  modern_bold: 'font-sans font-extrabold',
  classic_serif: 'font-serif italic',
  signature: 'font-cursive',
  impact: 'font-sans font-black uppercase',
  outline: 'font-sans font-bold uppercase',
  neon: 'font-sans font-bold',
  glass: 'font-sans font-semibold',
  scoreboard: 'font-mono font-bold uppercase',
  modern: 'font-sans font-bold',
  classic: 'font-serif italic',
};

export default function StudioPanelText({ 
  edits, 
  updateEdits, 
  onApply, 
  onReset,
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

  return (
    <div className="flex flex-col h-full">
      {/* Layers header */}
      <div className="px-3 pt-2 pb-1.5 flex items-center gap-2">
        <Layers className="w-3.5 h-3.5" style={{ color: '#AEAEB2' }} />
        <span className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: '#AEAEB2' }}>Layers</span>
        <span className="text-[11px] ml-auto" style={{ color: '#f59e0b' }}>{textBoxes.length}</span>
      </div>
      
      {/* Text boxes list OR empty state */}
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {!hasTextLayers ? (
          <button
            onClick={addTextBox}
            className="w-full py-6 rounded-xl transition-colors flex flex-col items-center justify-center gap-2"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
              <Type className="w-5 h-5" style={{ color: '#f59e0b' }} />
            </div>
            <span className="text-sm font-medium text-white">Tap to add text overlay</span>
            <span className="text-[11px]" style={{ color: '#AEAEB2' }}>Add captions, titles, or labels</span>
          </button>
        ) : (
          <div className="space-y-1">
            {[...textBoxes].reverse().map((box, reverseIndex) => {
              const isSelected = selectedBox === box.id;
              const isTopLayer = reverseIndex === 0;
              
              return (
                <div key={box.id}>
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
                    className="w-full px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer"
                    style={{
                      border: isSelected ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      background: isSelected ? 'rgba(245,158,11,0.08)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-[13px] font-medium text-white truncate">{box.text}</span>
                        <span className="text-[10px] flex-shrink-0" style={{ color: '#AEAEB2' }}>
                          {STYLE_PRESETS.find(p => p.id === box.style)?.label} · {(box.scale * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isTopLayer && isSelected && (
                          <button
                            onClick={(e) => { e.stopPropagation(); bringToFront(box.id); }}
                            className="p-0.5"
                            style={{ color: '#AEAEB2' }}
                            title="Bring to front"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeBox(box.id); }}
                          className="text-[10px] font-medium"
                          style={{ color: '#EF4444' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline controls for selected layer */}
                  {isSelected && selected && (
                    <div className="mt-1.5 space-y-2.5 pb-2">
                      <input
                        type="text"
                        value={selected.text}
                        onChange={(e) => updateBox(selected.id, { text: e.target.value })}
                        placeholder="Enter text..."
                        className="w-full px-2.5 py-1.5 rounded-md text-sm focus:outline-none text-white"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          caretColor: '#f59e0b',
                        }}
                      />

                      {/* Hint about positioning */}
                      <p className="text-center text-[11px]" style={{ color: '#AEAEB2' }}>
                        Drag overlays on the preview above to reposition
                      </p>

                      {/* Style selector */}
                      <div>
                        <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#AEAEB2' }}>Style</label>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5">
                          {STYLE_PRESETS.map(preset => (
                            <button
                              key={preset.id}
                              onClick={() => updateBox(selected.id, { style: preset.id })}
                              className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl transition-all min-w-[52px]"
                              style={selected.style === preset.id ? {
                                background: '#f59e0b',
                                color: '#FFFFFF',
                              } : {
                                background: 'rgba(255,255,255,0.08)',
                                color: '#FFFFFF',
                              }}
                            >
                              <span className={`text-base leading-none ${PREVIEW_FONTS[preset.id]}`}>
                                {preset.preview}
                              </span>
                              <span className="text-[9px] font-medium">{preset.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Size slider */}
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-medium w-8" style={{ color: '#AEAEB2' }}>Size</label>
                        <input
                          type="range"
                          min="0.6"
                          max="3"
                          step="0.1"
                          value={selected.scale}
                          onChange={(e) => updateBox(selected.id, { scale: parseFloat(e.target.value) })}
                          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-5
                            [&::-webkit-slider-thumb]:h-5
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:shadow-md
                            [&::-webkit-slider-thumb]:cursor-grab
                            [&::-webkit-slider-thumb]:active:cursor-grabbing
                            [&::-moz-range-thumb]:w-5
                            [&::-moz-range-thumb]:h-5
                            [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:border-0
                            [&::-moz-range-thumb]:shadow-md"
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            // @ts-ignore
                            '--tw-slider-thumb-bg': '#f59e0b',
                          }}
                        />
                        <span className="text-[11px] w-8 text-right font-mono" style={{ color: '#AEAEB2' }}>{(selected.scale * 100).toFixed(0)}%</span>
                      </div>

                      {/* Color picker */}
                      <div>
                        <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#AEAEB2' }}>Color</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => updateBox(selected.id, { color })}
                              className="w-7 h-7 rounded-md transition-all"
                              style={{
                                backgroundColor: color,
                                border: selected.color === color ? '2px solid white' : '2px solid rgba(255,255,255,0.12)',
                                outline: selected.color === color ? '2px solid transparent' : undefined,
                                outlineOffset: selected.color === color ? '2px' : undefined,
                                transform: selected.color === color ? 'scale(1.05)' : undefined,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Add another */}
            <button
              onClick={addTextBox}
              className="w-full py-1.5 mt-0.5 rounded-md transition-colors flex items-center justify-center gap-1 text-[11px]"
              style={{ color: '#f59e0b' }}
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
