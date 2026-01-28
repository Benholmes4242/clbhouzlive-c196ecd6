import React from 'react';
import { 
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Trophy, Edit, ExternalLink, Globe, Eye } from 'lucide-react';
import { GolfCourse, Top100ListKey } from './types';
import { DataQualityIndicator } from './DataQualityIndicator';
import GolfCoursesMobileCard from './GolfCoursesMobileCard';

interface GolfCoursesTableProps {
  courses: GolfCourse[];
  onEdit: (course: GolfCourse) => void;
  onViewDetails: (course: GolfCourse) => void;
  activeTop100Filter?: Top100ListKey | null;
  // Selection props
  isSelectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (courseId: string) => void;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
  isSomeSelected?: boolean;
}

// Helper function to format location display
const formatLocation = (course: GolfCourse) => {
  const parts = [];
  
  if (course.sub_country) {
    parts.push(course.sub_country);
  }
  
  if (course.region && course.region !== course.country) {
    parts.push(course.region);
  }
  
  return parts.join(', ') || course.country;
};

// Helper function to get rank badges with limit
const getRankBadges = (course: GolfCourse, activeFilter?: Top100ListKey | null) => {
  const badges = [];
  
  // If a specific Top 100 filter is active, show only that rank prominently
  if (activeFilter) {
    let rank = null;
    let label = '';
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
    
    switch (activeFilter) {
      case 'worldwide':
        rank = course.global_rank;
        label = 'Global';
        variant = 'default';
        break;
      case 'usa':
        rank = course.usa_rank;
        label = 'USA';
        variant = 'destructive';
        break;
      case 'britain-ireland':
        rank = course.regional_rank;
        label = 'GB&I';
        variant = 'secondary';
        break;
      case 'europe':
        rank = course.regional_rank;
        label = 'Europe';
        variant = 'outline';
        break;
    }
    
    if (rank && rank <= 100) {
      badges.push({ rank, label, variant, key: activeFilter });
    }
  } else {
    // Show up to 2 most important ranks
    if (course.global_rank && course.global_rank <= 100) {
      badges.push({ 
        rank: course.global_rank, 
        label: 'Global', 
        variant: 'default' as const, 
        key: 'global' 
      });
    }
    
    if (course.usa_rank && course.usa_rank <= 100) {
      badges.push({ 
        rank: course.usa_rank, 
        label: 'USA', 
        variant: 'destructive' as const, 
        key: 'usa' 
      });
    }
    
    if (course.regional_rank && course.regional_rank <= 100 && badges.length < 2) {
      const isGB = course.country === 'Britain & Ireland';
      const isEurope = course.country === 'Continental Europe';
      
      if (isGB) {
        badges.push({ 
          rank: course.regional_rank, 
          label: 'GB&I', 
          variant: 'secondary' as const, 
          key: 'regional-gb' 
        });
      } else if (isEurope) {
        badges.push({ 
          rank: course.regional_rank, 
          label: 'Europe', 
          variant: 'outline' as const, 
          key: 'regional-europe' 
        });
      }
    }
  }
  
  return badges.slice(0, 2); // Limit to 2 badges for compact display
};

const GolfCoursesTable: React.FC<GolfCoursesTableProps> = ({ 
  courses, 
  onEdit,
  onViewDetails,
  activeTop100Filter,
  isSelectMode = false,
  selectedIds = new Set(),
  onToggleSelection,
  onSelectAll,
  isAllSelected = false,
  isSomeSelected = false,
}) => {
  const columns: ColumnDef<GolfCourse>[] = [
    // Checkbox column (only in select mode)
    ...(isSelectMode ? [{
      id: 'select',
      header: () => (
        <Checkbox
          checked={isAllSelected}
          ref={(el) => {
            if (el) {
              (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = isSomeSelected;
            }
          }}
          onCheckedChange={() => onSelectAll?.()}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: { row: { original: GolfCourse } }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => onToggleSelection?.(row.original.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${row.original.name}`}
        />
      ),
    }] as ColumnDef<GolfCourse>[] : []),
    {
      id: 'course',
      accessorFn: (row) => row.name,
      header: 'Course',
      cell: ({ row }) => {
        const course = row.original;
        const rankBadges = getRankBadges(course, activeTop100Filter);
        
        return (
          <div className="flex items-center gap-3 min-w-0">
            {/* Thumbnail */}
            <div className="flex-shrink-0 relative">
              {course.thumbnail_image ? (
                <img
                  src={course.thumbnail_image}
                  alt={course.name}
                  className="w-14 h-14 rounded-md object-cover border"
                  loading="lazy"
                />
              ) : (
                <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center border">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Course Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">{course.name}</h3>
                <DataQualityIndicator course={course} />
                {rankBadges.map((badge) => (
                  <Badge 
                    key={badge.key} 
                    variant={badge.variant} 
                    className="text-xs px-1.5 py-0.5 flex items-center gap-1"
                  >
                    <Trophy className="h-2.5 w-2.5" />
                    #{badge.rank} {badge.label}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {formatLocation(course)}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'location',
      accessorFn: (row) => row.region,
      header: 'Region',
      cell: ({ row }) => {
        const course = row.original;
        return (
          <div className="text-sm">
            <div className="font-medium">{course.region || course.sub_country}</div>
            <div className="text-xs text-muted-foreground">{course.country}</div>
          </div>
        );
      },
    },
    {
      id: 'updated',
      accessorFn: (row) => row.updated_at,
      header: 'Updated',
      cell: ({ row }) => {
        const course = row.original;
        const updatedDate = new Date(course.updated_at);
        
        return (
          <div className="text-xs text-muted-foreground">
            {updatedDate.toLocaleDateString('en-US', { 
              day: 'numeric',
              month: 'long', 
              year: 'numeric'
            })}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const course = row.original;
        const hasCoordinates = course.latitude && course.longitude;
        
        return (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(course);
              }}
              title="View Details"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(course);
              }}
              title="Edit Course"
            >
              <Edit className="h-3 w-3" />
            </Button>
            {hasCoordinates && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(
                    `https://www.google.com/maps?q=${course.latitude},${course.longitude}`,
                    '_blank'
                  );
                }}
                title="View on Map"
              >
                <Globe className="h-3 w-3" />
              </Button>
            )}
            {course.website_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(course.website_url, '_blank');
                }}
                title="Visit Website"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: courses,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      {/* Mobile: Card layout */}
      <div className="block md:hidden space-y-2">
        {courses.length > 0 ? (
          courses.map((course) => (
            <GolfCoursesMobileCard
              key={course.id}
              course={course}
              onEdit={onEdit}
              activeTop100Filter={activeTop100Filter}
              isSelectMode={isSelectMode}
              isSelected={selectedIds.has(course.id)}
              onToggleSelection={onToggleSelection}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No results.
          </div>
        )}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block rounded-md border bg-background">
        <Table>
          <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-10">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.original.id}
                  className={`group cursor-pointer hover:bg-muted/50 h-16 ${
                    selectedIds.has(row.original.id) ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    if (isSelectMode) {
                      onToggleSelection?.(row.original.id);
                    } else {
                      onViewDetails(row.original);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default GolfCoursesTable;
