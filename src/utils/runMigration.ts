import { supabase } from '@/integrations/supabase/client';

export const triggerMigration = async () => {
  console.log('🚀 Starting image migration to Cloudflare R2...');
  
  try {
    const { data, error } = await supabase.functions.invoke('migrate-all-images-to-r2');
    
    if (error) {
      console.error('❌ Migration error:', error);
      throw new Error(error.message);
    }
    
    console.log('✅ Migration completed successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Migration auto-trigger removed - migration already completed