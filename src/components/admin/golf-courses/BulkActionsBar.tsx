import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ChevronDown, 
  Download, 
  Trash2, 
  X,
  CheckCircle2
} from 'lucide-react';
import { GolfCourse } from './types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface BulkActionsBarProps {
  selectedCourses: GolfCourse[];
  onClearSelection: () => void;
  onSuccess?: () => void;
}

export function BulkActionsBar({ 
  selectedCourses, 
  onClearSelection,
  onSuccess 
}: BulkActionsBarProps) {
  
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Country', 'State/Region', 'Area', 'Latitude', 'Longitude', 'Global Rank', 'Website'];
    const rows = selectedCourses.map(course => [
      course.id,
      course.name,
      course.country,
      course.sub_country || '',
      course.region || '',
      course.latitude?.toString() || '',
      course.longitude?.toString() || '',
      course.global_rank?.toString() || '',
      course.website_url || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `golf-courses-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Export Complete', { description: `Exported ${selectedCourses.length} courses to CSV` });
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    
    try {
      const ids = selectedCourses.map(c => c.id);
      const { error } = await supabase
        .from('golf_courses')
        .delete()
        .in('id', ids);

      if (error) throw error;

      toast.success('Courses Deleted', { description: `Successfully deleted ${selectedCourses.length} courses` });

      onClearSelection();
      queryClient.invalidateQueries({ queryKey: ['admin-golf-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-golf-courses-stats'] });
      onSuccess?.();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Delete Failed', { description: 'Failed to delete courses. Please try again.' });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (selectedCourses.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {selectedCourses.length} selected
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background">
              <DropdownMenuItem onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCourses.length} Courses?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected 
              golf courses and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
