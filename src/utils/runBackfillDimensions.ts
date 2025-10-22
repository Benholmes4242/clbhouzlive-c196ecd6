import { supabase } from '@/integrations/supabase/client';

interface BackfillResult {
  processed: number;
  updated: number;
  skipped: number;
  failed: number;
  dryRun?: boolean;
  errors?: Array<{ id: string; reason: string }>;
  message: string;
}

export const triggerBackfillDimensions = async (options: {
  batchSize?: number;
  dryRun?: boolean;
} = {}): Promise<BackfillResult> => {
  const { batchSize = 50, dryRun = false } = options;
  
  console.log(`🎬 Starting video dimensions backfill (batch: ${batchSize}, dryRun: ${dryRun})...`);
  
  try {
    const { data, error } = await supabase.functions.invoke('backfill-video-dimensions', {
      body: { batchSize, dryRun }
    });
    
    if (error) {
      console.error('❌ Backfill error:', error);
      throw new Error(error.message);
    }
    
    console.log('✅ Backfill completed:', data);
    
    if (data.errors && data.errors.length > 0) {
      console.warn('⚠️ Some rows failed:', data.errors);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    throw error;
  }
};

// Helper: Run multiple batches until complete
export const runFullBackfill = async (options: {
  maxBatches?: number;
  batchSize?: number;
} = {}): Promise<{ totalUpdated: number; totalProcessed: number; batches: number }> => {
  const { maxBatches = 20, batchSize = 50 } = options;
  
  let totalUpdated = 0;
  let totalProcessed = 0;
  let batches = 0;
  
  console.log(`🚀 Starting full backfill (max ${maxBatches} batches of ${batchSize})...`);
  
  for (let i = 0; i < maxBatches; i++) {
    const result = await triggerBackfillDimensions({ batchSize, dryRun: false });
    
    totalUpdated += result.updated;
    totalProcessed += result.processed;
    batches++;
    
    console.log(`Batch ${batches}: ${result.updated} updated, ${result.skipped} skipped, ${result.failed} failed`);
    
    // Stop if no more rows to process
    if (result.processed === 0) {
      console.log('✅ No more rows to process - backfill complete!');
      break;
    }
    
    // Brief pause between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const summary = { totalUpdated, totalProcessed, batches };
  console.log('🎉 Full backfill complete:', summary);
  
  return summary;
};

// Dry run helper - test without making changes
export const testBackfill = async (batchSize = 10) => {
  console.log('🧪 Testing backfill (dry run)...');
  return triggerBackfillDimensions({ batchSize, dryRun: true });
};
