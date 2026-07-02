import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LegalDocument } from '@/hooks/useLegalDocuments';

export type AdminLegalDocument = LegalDocument;

export interface LegalDocumentInput {
  slug: string;
  title: string;
  body: string;
  sort_order: number;
  effective_date: string | null;
  is_published: boolean;
}

const ADMIN_KEY = ['legal_documents', 'admin'] as const;
const PUBLIC_KEY = ['legal_documents', 'published'] as const;

export function useLegalDocumentsAdmin() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ADMIN_KEY });
    qc.invalidateQueries({ queryKey: PUBLIC_KEY });
  };

  const list = useQuery({
    queryKey: ADMIN_KEY,
    queryFn: async (): Promise<AdminLegalDocument[]> => {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as AdminLegalDocument[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: LegalDocumentInput) => {
      const { data, error } = await supabase
        .from('legal_documents')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as AdminLegalDocument;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<LegalDocumentInput> }) => {
      const { data, error } = await supabase
        .from('legal_documents')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AdminLegalDocument;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('legal_documents').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: invalidate,
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('legal_documents')
        .update({ is_published, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return { id, is_published };
    },
    onSuccess: invalidate,
  });

  return {
    ...list,
    documents: list.data ?? [],
    create,
    update,
    remove,
    togglePublish,
  };
}
