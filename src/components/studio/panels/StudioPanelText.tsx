import { useState, useEffect, useCallback } from 'react';
import { Plus, Layers, ChevronUp } from 'lucide-react';
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
  '#FFFFFF', '#0a0a0a', '#FF9C40', '#3B82F6', '#EF4444', '#10B981', '#E8980A', '#8B5CF6',
  '#F1F5F9', '#6B7280', '#F97316', '#06B6D4', '#EC4899', '#14B8A6', '#D97706', '#6366F1',
];

const SIZES: { id: string; label: string; scale: number }[] = [
  { id: 'S', label: 'S', scale: 0.8 },
  { id: 'M', label: 'M', scale: 1.2 },
  { id: 'L', label: 'L', scale: 1.8 },
  { id: 'XL', label: 'XL', scale: 2.5 },
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
  const [newText, setNewText] = useState('');
  const [newColor, setNewColor] = useState('#FFFFFF');
  const [newScale, setNewScale] = useState(1.2);
  
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

  const addTextBox = useCallback((text?: string, color?: string, scale?: number) => {
    const baseY = 0.4;
    const yOffset = textBoxes.length * 0.08;
    const newY = Math.min(baseY + yOffset, 0.75);
    
    const newBox: TextOverlay = {
      id: nanoid(),
      text: text || 'New text',
      x: 0.5,
      y: newY,
      scale: scale || 1.2,
      rotation: 0,
      style: 'modern_bold',
      color: color || '#FFFFFF'
    };
    const updated = [...textBoxes, newBox];
    setTextBoxes(updated);
    handleSelectBox(newBox.id);
    updateEdits({ textOverlays: updated });
  }, [textBoxes, updateEdits, handleSelectBox]);

  const handleAddFromInput = useCallback(() => {
    if (!newText.trim()) return;
    addTextBox(newText.trim(), newColor, newScale);
    setNewText('');
  }, [newText, newColor, newScale, addTextBox]);

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

  const activeSize = SIZES.find(s => Math.abs(s.scale - newScale) < 0.05)?.id || 'M';

  return (
    <div className="flex flex-col h-full">
      {/* Layers section - only when layers exist */}
      {hasTextLayers && (
        <>
          <div className="px-3 pt-2 pb-1.5 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.45)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Layers</span>
            <span className="text-[11px] ml-auto" style={{ color: 'rgba(255,255,255,0.70)' }}>{textBoxes.length}</span>
          </div>
          
          <div className="px-3 pb-2">
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
                        border: isSelected ? '1px solid rgba(255,255,255,0.30)' : '1px solid rgba(255,255,255,0.08)',
                        background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                      }}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="text-[13px] font-medium text-white truncate">{box.text}</span>
                          <span className="text-[10px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            {STYLE_PRESETS.find(p => p.id === box.style)?.label} · {(box.scale * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {!isTopLayer && isSelected && (
                            <button
                              onClick={(e) => { e.stopPropagation(); bringToFront(box.id); }}
                              className="p-0.5"
                              style={{ color: 'rgba(255,255,255,0.45)' }}
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
                          className="w-full focus:outline-none text-white"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 14,
                            padding: '11px 14px',
                            fontSize: 15,
                            caretColor: '#F7931E',
                          }}
                        />

                        {/* Style selector */}
                        <div>
                          <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Style</label>
                          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5">
                            {STYLE_PRESETS.map(preset => (
                              <button
                                key={preset.id}
                                onClick={() => updateBox(selected.id, { style: preset.id })}
                                className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl transition-all min-w-[52px]"
                                style={selected.style === preset.id ? {
                                  background: 'rgba(255,255,255,0.90)',
                                  color: '#0D0D0D',
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

                        {/* Color picker */}
                        <div>
                          <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Color</label>
                          <div className="flex gap-1.5 flex-wrap">
                            {COLORS.map(color => (
                              <button
                                key={color}
                                onClick={() => updateBox(selected.id, { color })}
                                className="w-7 h-7 rounded-md transition-all"
                                style={{
                                  backgroundColor: color,
                                  border: selected.color === color ? '2px solid white' : '2px solid rgba(255,255,255,0.12)',
                                  transform: selected.color === color ? 'scale(1.05)' : undefined,
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Size pills */}
                        <div>
                          <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Size</label>
                          <div className="flex gap-2">
                            {SIZES.map(size => {
                              const isActive = Math.abs(selected.scale - size.scale) < 0.05;
                              return (
                                <button
                                  key={size.id}
                                  onClick={() => updateBox(selected.id, { scale: size.scale })}
                                  className="text-[13px] transition-all"
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: 8,
                                    background: isActive ? 'rgba(247,147,30,0.15)' : 'rgba(255,255,255,0.06)',
                                    border: isActive ? '1px solid rgba(247,147,30,0.30)' : '1px solid rgba(255,255,255,0.08)',
                                    color: isActive ? '#F7931E' : 'rgba(255,255,255,0.55)',
                                    fontWeight: isActive ? 700 : 400,
                                  }}
                                >
                                  {size.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 12px' }} />
        </>
      )}

      {/* ADD TEXT section — always visible */}
      <div className="px-3 pt-3 pb-3 flex-1 overflow-y-auto">
        {/* Eyebrow */}
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.10em',
          textTransform: 'uppercase' as const,
          color: 'rgba(255,255,255,0.28)',
        }}>
          Add text
        </span>

        {/* Input */}
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddFromInput(); }}
          placeholder="Type something..."
          className="w-full focus:outline-none text-white mt-2"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '11px 14px',
            fontSize: 15,
            caretColor: '#F7931E',
          }}
        />

        {/* Colour swatches */}
        <div className="mt-3">
          <div className="flex gap-1.5 flex-wrap">
            {COLORS.map(color => (
              <button
                key={color}
                onClick={() => setNewColor(color)}
                className="w-7 h-7 rounded-md transition-all"
                style={{
                  backgroundColor: color,
                  border: newColor === color ? '2px solid white' : '2px solid rgba(255,255,255,0.12)',
                  transform: newColor === color ? 'scale(1.05)' : undefined,
                }}
              />
            ))}
          </div>
        </div>

        {/* Size pills */}
        <div className="mt-3 flex gap-2">
          {SIZES.map(size => {
            const isActive = activeSize === size.id;
            return (
              <button
                key={size.id}
                onClick={() => setNewScale(size.scale)}
                className="text-[13px] transition-all"
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: isActive ? 'rgba(247,147,30,0.15)' : 'rgba(255,255,255,0.06)',
                  border: isActive ? '1px solid rgba(247,147,30,0.30)' : '1px solid rgba(255,255,255,0.08)',
                  color: isActive ? '#F7931E' : 'rgba(255,255,255,0.55)',
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                {size.label}
              </button>
            );
          })}
        </div>

        {/* Add button */}
        {newText.trim() && (
          <button
            onClick={handleAddFromInput}
            className="w-full mt-3 py-2 rounded-xl flex items-center justify-center gap-1.5 text-[13px] font-semibold transition-colors"
            style={{
              background: 'rgba(247,147,30,0.15)',
              border: '1px solid rgba(247,147,30,0.28)',
              color: '#F7931E',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add to canvas
          </button>
        )}
      </div>
    </div>
  );
}
