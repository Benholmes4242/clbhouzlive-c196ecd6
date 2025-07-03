import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/components/theme-provider';

interface Logo {
  id: string;
  file_name: string;
  file_url: string;
  category: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

export const useAppLogo = () => {
  const { theme } = useTheme();
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppLogos();
  }, []);

  const fetchAppLogos = async () => {
    try {
      const { data, error } = await supabase
        .from('logos')
        .select('*')
        .in('category', ['app_logo_light', 'app_logo_dark'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogos(data || []);
    } catch (error) {
      console.error('Error fetching app logos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLogosByCategory = (category: string) => {
    return logos.filter(logo => logo.category === category);
  };

  const getCurrentAppLogo = () => {
    const lightLogos = getLogosByCategory('app_logo_light');
    const darkLogos = getLogosByCategory('app_logo_dark');
    
    if (theme === 'dark') {
      return darkLogos.length > 0 ? darkLogos[0] : lightLogos[0];
    } else if (theme === 'light') {
      return lightLogos.length > 0 ? lightLogos[0] : null;
    } else {
      // System theme - check if user prefers dark
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark && darkLogos.length > 0 ? darkLogos[0] : lightLogos[0];
    }
  };

  return {
    currentLogo: getCurrentAppLogo(),
    lightLogo: getLogosByCategory('app_logo_light')[0] || null,
    darkLogo: getLogosByCategory('app_logo_dark')[0] || null,
    loading,
    refreshLogos: fetchAppLogos
  };
};