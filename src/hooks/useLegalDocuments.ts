import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LegalDocument {
  id: string;
  slug: string;
  title: string;
  body: string;
  sort_order: number;
  effective_date: string | null;
  is_published: boolean;
  updated_at: string;
}

export type LegalDocumentIndexRow = Pick<
  LegalDocument,
  'slug' | 'title' | 'effective_date' | 'sort_order'
>;

const PUBLIC_KEY = ['legal_documents', 'published'] as const;

export function useLegalDocuments() {
  return useQuery({
    queryKey: PUBLIC_KEY,
    queryFn: async (): Promise<LegalDocumentIndexRow[]> => {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('slug,title,effective_date,sort_order')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as LegalDocumentIndexRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLegalDocument(slug: string | undefined) {
  return useQuery({
    queryKey: ['legal_documents', 'published', 'doc', slug],
    enabled: !!slug,
    queryFn: async (): Promise<LegalDocument | null> => {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('slug', slug!)
        .eq('is_published', true)
        .maybeSingle();
      if (error) throw error;
      return (data as LegalDocument | null) ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });
}
