import { useState } from 'react';
import { Plus } from 'lucide-react';
import { StudioEdits, TextOverlay } from '@/types/studio';
import { nanoid } from 'nanoid';

type StudioPanelTextProps = {
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  onApply: () => void;
  onReset: () => void;
};

const FONTS: TextOverlay['style'][] = ['modern', 'classic', 'signature'];
const COLORS = ['#0a0a0a', '#FFFFFF', '#FF9C40', '#3B82F6', '#EF4444', '#10B981'];

export default function StudioPanelText({ edits, updateEdits, onApply, onReset }: StudioPanelTextProps) {
  const [textBoxes, setTextBoxes] = useState<TextOverlay[]>(edits?.textOverlays || []);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);

  const addTextBox = () => {
    const newBox: TextOverlay = {
      id: nanoid(),
      text: 'New text',
      x: 0.5,
      y: 0.5,
      scale: 1,
      style: 'modern',
      color: '#FFFFFF'
    };
    const updated = [...textBoxes, newBox];
    setTextBoxes(updated);
    setSelectedBox(newBox.id);
    updateEdits({ textOverlays: updated });
  };

  const updateBox = (id: string, changes: Partial<TextOverlay>) => {
    const updated = textBoxes.map(box => 
      box.id === id ? { ...box, ...changes } : box
    );
    setTextBoxes(updated);
    updateEdits({ textOverlays: updated });
  };

  const removeBox = (id: string) => {
    const updated = textBoxes.filter(box => box.id !== id);
    setTextBoxes(updated);
    updateEdits({ textOverlays: updated });
    if (selectedBox === id) setSelectedBox(null);
  };

  const selected = textBoxes.find(box => box.id === selectedBox);

  return (
    <div className="flex flex-col h-full">
      {/* Text boxes list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {textBoxes.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <p className="text-sm">No text added yet</p>
            <p className="text-xs mt-1">Tap + to add text to your media</p>
          </div>
        ) : (
          textBoxes.map(box => (
            <button
              key={box.id}
              onClick={() => setSelectedBox(box.id)}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                selectedBox === box.id
                  ? 'border-[rgba(255,156,64,0.5)] bg-[rgba(255,156,64,0.05)]'
                  : 'border-zinc-200 bg-white hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-900 truncate">{box.text}</span>
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
              <div className="text-xs text-zinc-500 mt-1">
                {box.style} • {(box.scale * 100).toFixed(0)}%
              </div>
            </button>
          ))
        )}
      </div>

      {/* Controls for selected box */}
      {selected && (
        <div className="p-4 border-t border-zinc-200 bg-white space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Text</label>
            <input
              type="text"
              value={selected.text}
              onChange={(e) => updateBox(selected.id, { text: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:border-[rgba(255,156,64,0.5)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Font</label>
            <div className="flex gap-2">
              {FONTS.map(font => (
                <button
                  key={font}
                  onClick={() => updateBox(selected.id, { style: font })}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors capitalize ${
                    selected.style === font
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Scale</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={selected.scale}
              onChange={(e) => updateBox(selected.id, { scale: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-zinc-500 mt-1">{(selected.scale * 100).toFixed(0)}%</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => updateBox(selected.id, { color })}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    selected.color === color
                      ? 'border-zinc-900 scale-110'
                      : 'border-zinc-200'
                  }`}
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
