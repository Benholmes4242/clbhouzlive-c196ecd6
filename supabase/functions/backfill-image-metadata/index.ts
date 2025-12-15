// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Note: probe-image-size requires node modules, using fetch-based approach instead
async function probeImage(url: string): Promise<{ width: number; height: number } | null> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    // Try to get dimensions from headers if available
    // Otherwise, we'll need to fetch the image
    if (!response.ok) return null;
    
    // Fallback: fetch first bytes to detect image type
    const fullResponse = await fetch(url);
    const buffer = await fullResponse.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 30));
    
    // PNG signature
    if (bytes[0] === 0x89 && bytes[1] === 0x50) {
      const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
      const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
      return { width, height };
    }
    
    // JPEG signature  
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
      // JPEG requires parsing SOF marker, simplified - return null
      return null;
    }
    
    return null;
  } catch {
    return null;
  }
}

type Row = {
  id: string;
  media_url: string;
};

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dry_run") === "true";
    const batchSize = Number(url.searchParams.get("batch_size") ?? "200");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) fetch candidate images
    const { data: rows, error } = await supabase
      .from("post_media")
      .select("id, media_url")
      .eq("media_type", "image")
      .is("media_width", null)
      .limit(batchSize);

    if (error) throw error;

    let processed = 0;
    const failures: { id: string; error: string }[] = [];
    const updates: any[] = [];

    for (const r of rows as Row[]) {
      try {
        // Guard for empty / data URLs
        if (!r.media_url || r.media_url.startsWith("data:")) {
          throw new Error("Invalid or data URL");
        }

        // 2) probe image dimensions
        const result = await probeImage(r.media_url);

        const w = result?.width ?? null;
        const h = result?.height ?? null;

        let orientation: "portrait" | "landscape" | "square" | null = null;
        if (w && h) {
          orientation = w === h ? "square" : w > h ? "landscape" : "portrait";
        }

        updates.push({
          id: r.id,
          media_width: w,
          media_height: h,
          image_orientation: orientation,
          exif: null,
        });

        processed++;
      } catch (e: any) {
        failures.push({ id: r.id, error: String(e?.message ?? e) });
      }
    }

    // 3) write back
    if (!dryRun && updates.length) {
      // batch upserts by id
      const { error: upErr } = await supabase.from("post_media").upsert(updates, {
        onConflict: "id",
        ignoreDuplicates: false,
      });
      if (upErr) throw upErr;
    }

    return new Response(
      JSON.stringify({
        success: true,
        dry_run: dryRun,
        fetched: rows?.length ?? 0,
        processed,
        failed: failures.length,
        failures: failures.slice(0, 20), // return sample
      }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});
