import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, XCircle, FileSpreadsheet, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminPageHeader, AdminButton, AdminSectionHeader } from '../components/ui';

// ─── CSV Parser (handles quoted fields) ──────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1).map(line => {
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });

  return { headers, rows };
}

// ─── Required fields & validation ────────────────────────────────────────────

const REQUIRED_FIELDS = ['name', 'country', 'continent'];

const VALID_CONTINENTS = [
  'Africa', 'Antarctica', 'Asia', 'Europe',
  'North America', 'Oceania', 'South America',
] as const;

interface ValidatedRow {
  data: Record<string, string>;
  valid: boolean;
  errors: string[];
}

function validateRow(row: Record<string, string>): ValidatedRow {
  const errors: string[] = [];
  if (!row['name']?.trim())    errors.push('Missing name');
  if (!row['country']?.trim()) errors.push('Missing country');
  if (!row['continent']?.trim()) {
    errors.push('Missing continent');
  } else if (!(VALID_CONTINENTS as readonly string[]).includes(row['continent'].trim())) {
    errors.push(`Invalid continent "${row['continent']}" — must be one of: ${VALID_CONTINENTS.join(', ')}`);
  }
  return { data: row, valid: errors.length === 0, errors };
}

// ─── Batch importer ──────────────────────────────────────────────────────────

async function importCourses(
  rows: ValidatedRow[],
  onProgress: (done: number) => void
): Promise<{ inserted: number; errors: number }> {
  const valid = rows.filter(r => r.valid);
  const CHUNK = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < valid.length; i += CHUNK) {
    const chunk = valid.slice(i, i + CHUNK).map(r => ({
      name:          r.data.name,
      country:       r.data.country,
      continent:     r.data.continent as any,
      sub_country:   r.data.sub_country || null,
      region:        r.data.region || null,
      global_rank:   r.data.global_rank ? parseInt(r.data.global_rank) || null : null,
      regional_rank: r.data.regional_rank ? parseInt(r.data.regional_rank) || null : null,
      usa_rank:      r.data.usa_rank ? parseInt(r.data.usa_rank) || null : null,
      website_url:   r.data.website_url || null,
      description:   r.data.description || null,
      latitude:      r.data.latitude ? parseFloat(r.data.latitude) || null : null,
      longitude:     r.data.longitude ? parseFloat(r.data.longitude) || null : null,
    }));

    const { error } = await supabase.from('golf_courses').insert(chunk);
    if (error) {
      errors += chunk.length;
      console.error('Import chunk error:', error);
    } else {
      inserted += chunk.length;
    }
    onProgress(inserted + errors);
  }

  return { inserted, errors };
}

// ─── Drop zone ───────────────────────────────────────────────────────────────

function DropZone({ onFile }: { onFile: (file: File) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      onFile(file);
    } else {
      toast.error('Please upload a .csv file');
    }
  }, [onFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'relative flex flex-col items-center justify-center gap-4 py-16 px-6 rounded-xl border-2 border-dashed cursor-pointer transition-all',
        dragOver
          ? 'border-foreground/40 bg-muted/60'
          : 'border-border/60 hover:border-border hover:bg-muted/30',
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center">
        <Upload className="w-6 h-6 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {dragOver ? 'Drop CSV here' : 'Drag & drop a CSV file'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          or click to browse · Required: name, country, continent
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
          Valid continents: {VALID_CONTINENTS.join(', ')}
        </p>
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

type ImportState = 'idle' | 'parsing' | 'preview' | 'importing' | 'done';

export default function CourseImportPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<ImportState>('idle');
  const [fileName, setFileName] = useState('');
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ inserted: number; errors: number } | null>(null);

  const validCount   = validatedRows.filter(r => r.valid).length;
  const invalidCount = validatedRows.filter(r => !r.valid).length;

  const handleFile = useCallback(async (file: File) => {
    setState('parsing');
    setFileName(file.name);

    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);

      const missingRequired = REQUIRED_FIELDS.filter(f => !headers.includes(f));
      if (missingRequired.length > 0) {
        toast.error(`Missing required columns: ${missingRequired.join(', ')}`);
        setState('idle');
        return;
      }

      const validated = rows.map(validateRow);
      setValidatedRows(validated);
      setState('preview');
    } catch {
      toast.error('Failed to parse CSV file');
      setState('idle');
    }
  }, []);

  const handleImport = useCallback(async () => {
    setState('importing');
    setProgress(0);
    const res = await importCourses(validatedRows, setProgress);
    setResult(res);
    setState('done');
    if (res.errors === 0) {
      toast.success(`Successfully imported ${res.inserted} courses`);
    } else {
      toast.warning(`Imported ${res.inserted} courses with ${res.errors} errors`);
    }
  }, [validatedRows]);

  const handleReset = () => {
    setState('idle');
    setFileName('');
    setValidatedRows([]);
    setProgress(0);
    setResult(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <AdminPageHeader
        title="Course Import"
        description="Import golf courses from a CSV file"
        action={
          <AdminButton variant="ghost" icon={ArrowLeft} size="sm" onClick={() => navigate('/admin-v2/courses')}>
            Back
          </AdminButton>
        }
      />

      {/* Idle — show drop zone */}
      {state === 'idle' && <DropZone onFile={handleFile} />}

      {/* Parsing */}
      {state === 'parsing' && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Parsing {fileName}…</p>
        </div>
      )}

      {/* Preview */}
      {state === 'preview' && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border/60 bg-card px-4 py-3 text-center">
              <p className="text-2xl font-bold text-foreground">{validatedRows.length}</p>
              <p className="text-xs text-muted-foreground">Total rows</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card px-4 py-3 text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{validCount}</p>
              <p className="text-xs text-muted-foreground">Ready to import</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card px-4 py-3 text-center">
              <p className="text-2xl font-bold text-red-500">{invalidCount}</p>
              <p className="text-xs text-muted-foreground">Will be skipped</p>
            </div>
          </div>

          {/* File info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="w-4 h-4" />
            {fileName}
          </div>

          {/* Preview table */}
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <AdminSectionHeader title={`Preview (first ${Math.min(10, validatedRows.length)} rows)`} />
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground w-10"></th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Country</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Continent</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {validatedRows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b border-border/20 last:border-0">
                      <td className="px-3 py-2">
                        {row.valid
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <XCircle className="w-4 h-4 text-red-500" />
                        }
                      </td>
                      <td className="px-3 py-2 text-foreground font-medium">{row.data.name || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.data.country || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.data.continent || '—'}</td>
                      <td className="px-3 py-2 text-red-500 text-[11px]">{row.errors.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <AdminButton
              variant="primary"
              icon={Upload}
              onClick={handleImport}
              disabled={validCount === 0}
            >
              Import {validCount} Course{validCount !== 1 ? 's' : ''}
            </AdminButton>
            <AdminButton variant="ghost" onClick={handleReset}>
              Cancel
            </AdminButton>
          </div>
        </div>
      )}

      {/* Importing */}
      {state === 'importing' && (
        <div className="space-y-4 py-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-foreground font-medium">
              Importing… {progress} / {validCount}
            </p>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${validCount > 0 ? (progress / validCount) * 100 : 0}%`,
                background: 'hsl(var(--accent-amber))',
              }}
            />
          </div>
        </div>
      )}

      {/* Done */}
      {state === 'done' && result && (
        <div className="flex flex-col items-center gap-5 py-12">
          <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-500/15 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">Import Complete</p>
            <p className="text-sm text-muted-foreground mt-1">
              {result.inserted} course{result.inserted !== 1 ? 's' : ''} imported
              {result.errors > 0 && `, ${result.errors} failed`}
            </p>
          </div>
          <div className="flex gap-3">
            <AdminButton variant="primary" onClick={() => navigate('/admin-v2/courses')}>
              View Courses
            </AdminButton>
            <AdminButton variant="outline" onClick={handleReset}>
              Import More
            </AdminButton>
          </div>
        </div>
      )}
    </div>
  );
}
