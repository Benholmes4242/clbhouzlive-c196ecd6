import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const f = vi.hoisted(() => ({ upload: vi.fn(), from: vi.fn(), update: vi.fn(), eq: vi.fn(), storage: vi.fn() }));
vi.mock('@/utils/r2OnlyUpload', () => ({ uploadToR2Only: f.upload }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: f.from, storage: { from: f.storage } } }));
vi.mock('@/hooks/admin/useGolfCoursesStats', () => ({ useGolfCoursesStats: vi.fn() }));
vi.mock('@/hooks/useDebouncedValue', () => ({ useDebouncedValue: vi.fn() }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { uploadCoursePhoto } from '@/features/admin/hooks/useCourses';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.[cm]?[jt]sx?$/.test(file) ? [file] : [];
  });
}

describe('FIX_UPLOAD_PLAYER_1 admin course photos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    f.from.mockReturnValue({ update: f.update });
    f.update.mockReturnValue({ eq: f.eq });
    f.eq.mockResolvedValue({ error: null });
  });

  it('uploads once to the course R2 bucket and writes the returned public URL without storage calls', async () => {
    const file = new File(['photo'], 'course.jpg', { type: 'image/jpeg' });
    const publicUrl = 'https://images.clbhouz.com/course-photo.jpg';
    f.upload.mockResolvedValue({ success: true, publicUrl });
    await expect(uploadCoursePhoto('course-id', file)).resolves.toBe(publicUrl);
    expect(f.upload).toHaveBeenCalledTimes(1);
    expect(f.upload).toHaveBeenCalledWith(file, 'clbhouz-course-images', expect.stringMatching(/^course-photos\/course-id-\d+\.jpg$/));
    expect(f.from).toHaveBeenCalledWith('golf_courses');
    expect(f.update).toHaveBeenCalledWith({ thumbnail_image: publicUrl });
    expect(f.eq).toHaveBeenCalledWith('id', 'course-id');
    expect(f.storage).not.toHaveBeenCalled();
  });

  it('throws the R2 error x without updating golf_courses', async () => {
    f.upload.mockResolvedValue({ success: false, error: 'x' });
    await expect(uploadCoursePhoto('course-id', new File(['photo'], 'course.jpg'))).rejects.toThrow('x');
    expect(f.from).not.toHaveBeenCalled();
    expect(f.update).not.toHaveBeenCalled();
    expect(f.storage).not.toHaveBeenCalled();
  });

  it('rejects a missing public URL with Upload failed without updating golf_courses', async () => {
    f.upload.mockResolvedValue({ success: true });
    await expect(uploadCoursePhoto('course-id', new File(['photo'], 'course.jpg'))).rejects.toThrow('Upload failed');
    expect(f.update).not.toHaveBeenCalled();
  });

  it('no admin source calls supabase.storage upload, including multiline chains', () => {
    const violations = sourceFiles('src/features/admin').filter(file => {
      const tree = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      let found = false;
      function visit(node: ts.Node) {
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'upload'
          && /supabase\.storage\b/.test(node.expression.expression.getText(tree).replace(/\s/g, ''))) found = true;
        ts.forEachChild(node, visit);
      }
      visit(tree);
      return found;
    });
    expect(violations).toEqual([]);
  });
});