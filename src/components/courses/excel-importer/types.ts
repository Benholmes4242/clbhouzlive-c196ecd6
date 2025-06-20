
import { Database } from '@/integrations/supabase/types';

export type Continent = Database['public']['Enums']['continent'];

export interface ExcelCourseData {
  name: string;
  country: string;
  region?: string;
  continent: Continent;
  global_rank?: number;
  regional_rank?: number;
  usa_rank?: number;
  description?: string;
  latitude?: number;
  longitude?: number;
  thumbnail_image?: string;
  website_url?: string;
}

export interface ImportResult {
  totalCourses: number;
  insertedCourses: number;
  skippedCourses: number;
  errors: number;
  inserted: any[];
  skipped: any[];
  errorDetails: any[];
}

export interface DebugInfo {
  totalLines: number;
  headers: string[];
  normalizedHeaders: string[];
  columnMapping: Record<string, number>;
}
