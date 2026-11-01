/** One session-cached head-only count shared by both post course-search fields.
 * Loading/errors omit the figure. No second read while pending or after failure. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { catalogueThousands } from '../lib/postFlowRules';
let countRead: Promise<number | null> | null = null;
export function readCourseCatalogueCount(): Promise<number | null> {
  if (!countRead) countRead = (async () => {
    try {
      const { count, error } = await supabase.from('golf_courses').select('id', { count:'exact', head:true });
      return error ? null : catalogueThousands(count);
    } catch { return null; }
  })();
  return countRead;
}
export function useCourseSearchPlaceholder(enabled = true): string {
  const { t } = useTranslation('composer');
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => { if (!enabled) return; let live = true; void readCourseCatalogueCount().then(n => { if(live) setCount(n); }); return () => { live = false; }; }, [enabled]);
  return count == null ? t('postFlow.searchAny') : t('postFlow.searchCount', { countLabel: count.toLocaleString('en-GB') });
}