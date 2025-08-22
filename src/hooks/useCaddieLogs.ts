import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CaddieLog {
  id: string;
  content: string;
  transcription?: string;
  course_name?: string;
  location_name?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export const useCaddieLogs = () => {
  const [caddieLogs, setCaddieLogs] = useState<CaddieLog[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCaddieLogs = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('caddie_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading caddie logs:', error);
        return;
      }

      if (data) {
        setCaddieLogs(data);
      }
    } catch (error) {
      console.error('Error loading caddie logs from Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCaddieLog = async (logId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('caddie_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting caddie log:', error);
        return false;
      }

      // Reload logs after deletion
      await loadCaddieLogs();
      return true;
    } catch (error) {
      console.error('Error deleting caddie log:', error);
      return false;
    }
  };

  useEffect(() => {
    loadCaddieLogs();
  }, []);

  return {
    caddieLogs,
    loading,
    loadCaddieLogs,
    deleteCaddieLog
  };
};