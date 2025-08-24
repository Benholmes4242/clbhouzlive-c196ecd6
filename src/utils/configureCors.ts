import { supabase } from '@/integrations/supabase/client';

export const configureR2Cors = async (bucketName: string = 'clbhouz-media') => {
  try {
    console.log('🔧 Configuring R2 CORS for Lovable preview...');
    
    const { data, error } = await supabase.functions.invoke('configure-r2-cors', {
      body: { bucketName }
    });
    
    if (error) {
      console.error('❌ CORS configuration error:', error);
      throw new Error(error.message);
    }
    
    if (!data?.success) {
      throw new Error(data?.error || 'CORS configuration failed');
    }
    
    console.log('✅ R2 CORS configured successfully!');
    return data;
  } catch (error) {
    console.error('❌ Failed to configure R2 CORS:', error);
    throw error;
  }
};