import { supabase } from '@/integrations/supabase/client';
import { SwingVisual, SwingVisualPack, VisualPlanItem, SwingFrameData } from '@/types/swing';

export class SwingVisualizer {
  private static readonly PHASE_LABELS = {
    P1: 'Setup',
    P2: 'Backswing Top',
    P3: 'Transition', 
    P4: 'Impact',
    P5: 'Follow Through'
  };

  static async createOrGetPack(analysisId: string, frames?: SwingFrameData[], visualPlan?: VisualPlanItem[]): Promise<SwingVisualPack> {
    // Check if visuals already exist
    const { data: existingVisuals } = await supabase
      .from('swing_visuals')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('frame_index');

    if (existingVisuals && existingVisuals.length > 0) {
      const visuals: SwingVisual[] = existingVisuals.map(v => ({
        id: v.id,
        analysisId: v.analysis_id,
        frameIndex: v.frame_index,
        label: v.label,
        overlay: v.overlay as any,
        url: v.url,
        width: v.width,
        height: v.height,
        createdAt: v.created_at
      }));
      
      return {
        analysisId,
        visuals,
        createdAt: existingVisuals[0].created_at
      };
    }

    // Generate new visuals if we have frames and plan
    if (frames && visualPlan) {
      const visuals = await this.generateVisuals(analysisId, frames, visualPlan);
      return {
        analysisId,
        visuals,
        createdAt: new Date().toISOString()
      };
    }

    // Return empty pack if no data
    return {
      analysisId,
      visuals: [],
      createdAt: new Date().toISOString()
    };
  }

  private static async generateVisuals(
    analysisId: string, 
    frames: SwingFrameData[], 
    visualPlan: VisualPlanItem[]
  ): Promise<SwingVisual[]> {
    const visuals: SwingVisual[] = [];

    for (const planItem of visualPlan) {
      // Map phase hint to frame index
      const frameIndex = this.mapPhaseToFrameIndex(planItem.frameHint, frames.length);
      const frame = frames[frameIndex];
      
      if (!frame) continue;

      // Generate annotated image
      const annotatedImageData = await this.createAnnotatedImage(frame, planItem);
      
      // Upload to storage
      const url = await this.uploadToStorage(analysisId, frameIndex, annotatedImageData);
      
      if (url) {
        const visual: SwingVisual = {
          id: crypto.randomUUID(),
          analysisId,
          frameIndex,
          label: `${planItem.frameHint} ${this.PHASE_LABELS[planItem.frameHint]}`,
          overlay: planItem.overlays,
          url,
          width: 800, // Standard width for consistency
          height: 600, // Standard height for consistency
          createdAt: new Date().toISOString()
        };

        // Save to database
        const { data } = await supabase
          .from('swing_visuals')
          .insert([{
            analysis_id: analysisId,
            frame_index: frameIndex,
            label: visual.label,
            overlay: planItem.overlays,
            url,
            width: visual.width,
            height: visual.height
          }])
          .select()
          .single();

        if (data) {
          visuals.push({
            ...visual,
            id: data.id
          });
        }
      }
    }

    return visuals;
  }

  private static mapPhaseToFrameIndex(phase: string, totalFrames: number): number {
    const phaseMapping: Record<string, number> = {
      P1: 0,                                    // Setup
      P2: Math.floor(totalFrames * 0.25),      // Backswing Top (25%)
      P3: Math.floor(totalFrames * 0.5),       // Transition (50%)
      P4: Math.floor(totalFrames * 0.75),      // Impact (75%)
      P5: totalFrames - 1                      // Follow Through (100%)
    };

    return phaseMapping[phase] || 0;
  }

  private static async createAnnotatedImage(frame: SwingFrameData, planItem: VisualPlanItem): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Set canvas size
        canvas.width = 800;
        canvas.height = 600;

        // Draw original image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Draw overlays
        this.drawOverlays(ctx, planItem.overlays, canvas.width, canvas.height);

        // Add caption
        this.drawCaption(ctx, planItem.caption, canvas.width, canvas.height);

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.src = frame.imageData;
    });
  }

  private static drawOverlays(ctx: CanvasRenderingContext2D, overlay: any, width: number, height: number) {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.font = '14px Arial';
    ctx.fillStyle = '#00ff00';

    // Draw lines
    if (overlay.lines) {
      overlay.lines.forEach((line: any) => {
        ctx.beginPath();
        ctx.moveTo(line.x1 * width, line.y1 * height);
        ctx.lineTo(line.x2 * width, line.y2 * height);
        ctx.stroke();

        // Draw label if present
        if (line.label) {
          const midX = (line.x1 + line.x2) * width / 2;
          const midY = (line.y1 + line.y2) * height / 2;
          ctx.fillText(line.label, midX, midY - 5);
        }
      });
    }

    // Draw keypoints
    if (overlay.keypoints) {
      overlay.keypoints.forEach((point: any) => {
        const x = point.x * width;
        const y = point.y * height;
        
        // Draw circle
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Draw label
        if (point.label) {
          ctx.fillText(point.label, x + 8, y - 8);
        }
      });
    }

    // Draw angles (simplified as arcs)
    if (overlay.angles) {
      overlay.angles.forEach((angle: any) => {
        const x = angle.cx * width;
        const y = angle.cy * height;
        const radius = 30;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, angle.a, angle.b);
        ctx.stroke();

        if (angle.label) {
          ctx.fillText(angle.label, x + radius + 5, y);
        }
      });
    }
  }

  private static drawCaption(ctx: CanvasRenderingContext2D, caption: string, width: number, height: number) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, height - 60, width, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText(caption, 10, height - 25);
  }

  private static async uploadToStorage(analysisId: string, frameIndex: number, imageData: string): Promise<string | null> {
    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      const fileName = `${analysisId}_frame_${frameIndex}.jpg`;
      const filePath = `swing-visuals/${fileName}`;

      const { data, error } = await supabase.storage
        .from('course-media')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.error('Error uploading visual:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('course-media')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error processing visual upload:', error);
      return null;
    }
  }

  static async getVisuals(analysisId: string): Promise<SwingVisual[]> {
    const { data } = await supabase
      .from('swing_visuals')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('frame_index');

    if (!data) return [];

    return data.map(v => ({
      id: v.id,
      analysisId: v.analysis_id,
      frameIndex: v.frame_index,
      label: v.label,
      overlay: v.overlay as any,
      url: v.url,
      width: v.width,
      height: v.height,
      createdAt: v.created_at
    }));
  }

  static async generateExportPack(analysisId: string): Promise<string | null> {
    // This would generate a ZIP file containing all visuals
    // For now, return a placeholder URL
    const visuals = await this.getVisuals(analysisId);
    
    if (visuals.length === 0) return null;

    // In a real implementation, this would create a ZIP file
    // and upload it to storage, then return the download URL
    return `/api/swing/visuals/export?analysisId=${analysisId}`;
  }
}