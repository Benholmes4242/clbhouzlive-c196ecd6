import React, { useState } from 'react';
import { EditorScreen, bakeImageEdits } from '@/components/studio-v2';
import type { SimpleEdits } from '@/types/studioSimple';

const SAMPLE_IMAGE =
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1600&q=80';

/**
 * Phase 1 dev harness for studio-v2. Loads a sample image into EditorScreen
 * and on Done bakes the edits to a flat JPEG blob for visual verification.
 * Remove in Phase 2.
 */
export default function DevEditorHarness() {
  const [open, setOpen] = useState(false);
  const [baking, setBaking] = useState(false);
  const [bakedUrl, setBakedUrl] = useState<string | null>(null);
  const [lastEdits, setLastEdits] = useState<SimpleEdits | null>(null);
  const [src, setSrc] = useState<string>(SAMPLE_IMAGE);

  const handleDone = async (edits: SimpleEdits) => {
    setLastEdits(edits);
    setBaking(true);
    setOpen(false);
    try {
      const blob = await bakeImageEdits(src, edits);
      if (bakedUrl) URL.revokeObjectURL(bakedUrl);
      setBakedUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error('[DevEditorHarness] bake failed', e);
      alert('Bake failed: ' + (e as Error).message);
    } finally {
      setBaking(false);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setSrc(url);
    setBakedUrl(null);
  };

  return (
    <div className="min-h-screen p-6 space-y-4" style={{ background: '#F8FAFC', color: '#0F172A' }}>
      <h1 className="text-xl font-bold">studio-v2 · dev harness</h1>
      <p className="text-sm" style={{ color: '#64748B' }}>
        Phase 1 verification only. Open the editor, make edits, hit Done — the baked output appears below.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 text-sm font-semibold rounded-lg"
          style={{ background: '#0F172A', color: '#fff' }}
        >
          Open editor
        </button>
        <input type="file" accept="image/*" onChange={onFile} className="text-xs" />
        {baking && <span className="text-xs" style={{ color: '#64748B' }}>Baking…</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: '#64748B' }}>Source</div>
          <img src={src} alt="source" className="w-full rounded-lg" />
        </div>
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: '#64748B' }}>Baked output</div>
          {bakedUrl ? (
            <>
              <img src={bakedUrl} alt="baked" className="w-full rounded-lg" />
              <a
                href={bakedUrl}
                download="baked.jpg"
                className="inline-block mt-2 text-xs font-semibold"
                style={{ color: '#F7931E' }}
              >
                Download
              </a>
            </>
          ) : (
            <div
              className="aspect-square rounded-lg flex items-center justify-center text-xs"
              style={{ background: 'rgba(15,23,42,0.05)', color: '#94A3B8' }}
            >
              No baked output yet
            </div>
          )}
        </div>
      </div>

      {lastEdits && (
        <pre className="text-[10px] p-3 rounded-lg overflow-auto" style={{ background: 'rgba(15,23,42,0.05)' }}>
          {JSON.stringify(lastEdits, null, 2)}
        </pre>
      )}

      {open && (
        <EditorScreen src={src} onCancel={() => setOpen(false)} onDone={handleDone} />
      )}
    </div>
  );
}
