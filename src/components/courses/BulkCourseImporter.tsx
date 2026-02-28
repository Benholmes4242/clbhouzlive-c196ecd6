
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Continent = Database['public']['Enums']['continent'];

const BulkCourseImporter = () => {
  
  const queryClient = useQueryClient();
  const [importResult, setImportResult] = useState<any>(null);

  const britishIrishTop30 = [
    { name: "Royal County Down (Championship)", world_rank: 3, gbi_rank: 1, county: "Down", country: "United Kingdom", region: "Northern Ireland", description: "Royal County Down Golf Club is at Newcastle, a little holiday town nestling at the feet of the majestic Mountains of Mourne. It's an exhilarating location for a classic links golf course..." },
    { name: "St Andrews Links (Old)", world_rank: 7, gbi_rank: 2, county: "Fife", country: "United Kingdom", region: "Scotland", description: "No other course has hosted more Opens than the Old Course at St Andrews. Its 29th Open and the 144th Open Championship returned \"to the Home of Golf\" in 2015." },
    { name: "Royal Portrush Golf Club (Dunluce)", world_rank: 9, gbi_rank: 3, county: "Antrim", country: "United Kingdom", region: "Northern Ireland", description: "The Dunluce links at Royal Portrush Golf Club is named after the ruined Dunluce castle that overlooks the course..." },
    { name: "Muirfield - Honourable Company of Edinburgh Golfers", world_rank: 10, gbi_rank: 4, county: "Lothians", country: "United Kingdom", region: "Scotland", description: "Muirfield is the course of \"The Honourable Company of Edinburgh Golfers\" (HCEG), the world's oldest golf club – according to direct written evidence – formed in 1744." },
    { name: "Trump Turnberry Resort - Ailsa", world_rank: 12, gbi_rank: 5, county: "Ayrshire & Arran", country: "United Kingdom", region: "Scotland", description: "The Ailsa course at the Turnberry Resort is probably the most scenic Open Championship golf course. Located right next to the Firth of Clyde..." },
    { name: "Royal Dornoch Golf Club (Championship)", world_rank: 15, gbi_rank: 6, county: "North Scotland", country: "United Kingdom", region: "Scotland", description: "Royal Dornoch Golf Club is spellbinding. It seems to mesmerise amateur and professional golfers from all over the world..." },
    { name: "Royal St George's Golf Club", world_rank: 19, gbi_rank: 7, county: "Kent", country: "United Kingdom", region: "England", description: "There's nothing artificial about Royal St George's Golf Club; there's a natural look and feel to the course..." },
    { name: "Sunningdale Golf Club (Old)", world_rank: 22, gbi_rank: 8, county: "Surrey", country: "United Kingdom", region: "England", description: "The Old course at Sunningdale is one of the British Isles' most aesthetically pleasing inland courses..." },
    { name: "Ballybunion Golf Club (Old)", world_rank: 29, gbi_rank: 9, county: "Kerry", country: "Ireland", region: "Ireland", description: "As you drive from Ballybunion to the club, your eyes feast upon the most spectacular links land imaginable." },
    { name: "Lahinch Golf Club (Old)", world_rank: 32, gbi_rank: 10, county: "Clare", country: "Ireland", region: "Ireland", description: "Lahinch Golf Club is situated next to the beach of Liscannor Bay. It's an enchanting, rugged, and entertaining place to play golf." },
    { name: "Carnoustie Golf Links (Championship)", world_rank: 34, gbi_rank: 11, county: "Angus & Dundee", country: "United Kingdom", region: "Scotland", description: "Carnoustie is a big natural seaside links and one of the most difficult courses in the British Isles." },
    { name: "Rosapenna Golf Resort - St Patrick's Links", world_rank: 37, gbi_rank: 12, county: "Donegal", country: "Ireland", region: "Ireland", description: "Tom Doak's team completed this stunning coastal links in 2020 — a standout in the modern golf world." },
    { name: "Sunningdale Golf Club (New)", world_rank: 41, gbi_rank: 13, county: "Surrey", country: "United Kingdom", region: "England", description: "Taken together, the New and Old courses at Sunningdale represent the finest 36 holes of golf in the British Isles." },
    { name: "North Berwick Golf Club (West Links)", world_rank: 42, gbi_rank: 14, county: "Lothians", country: "United Kingdom", region: "Scotland", description: "A highly enjoyable course on the Firth of Forth with sea views to Craigleith Island and Bass Rock." },
    { name: "Kingsbarns Golf Links", world_rank: 43, gbi_rank: 15, county: "Fife", country: "United Kingdom", region: "Scotland", description: "At Kingsbarns, you can see the North Sea from nearly every hole — a spectacular modern links." },
    { name: "Ardfin", world_rank: 44, gbi_rank: 16, county: "Argyll & Bute", country: "United Kingdom", region: "Scotland", description: "Laid across Jura's rugged cliffs, Ardfin is one of the most dramatic golf landscapes in the world." },
    { name: "St Enodoc Golf Club (Church)", world_rank: 49, gbi_rank: 17, county: "Cornwall", country: "United Kingdom", region: "England", description: "A quirky and hilly links course among sand dunes, with a distinctly Cornish character." },
    { name: "Swinley Forest Golf Club", world_rank: 52, gbi_rank: 18, county: "Berkshire", country: "United Kingdom", region: "England", description: "An exclusive, charming course on the famous sand belt — frozen in time and rich in character." },
    { name: "Cabot Highlands Castle Stuart", world_rank: 54, gbi_rank: 19, county: "North Scotland", country: "United Kingdom", region: "Scotland", description: "Castle Stuart competes with Royal Dornoch and Nairn for Highlands golf glory." },
    { name: "Royal Lytham & St Annes Golf Club", world_rank: 61, gbi_rank: 20, county: "Lancashire", country: "United Kingdom", region: "England", description: "The most northerly English championship course, 10 miles from Royal Birkdale." },
    { name: "Royal Porthcawl Golf Club", world_rank: 65, gbi_rank: 21, county: "South Wales", country: "United Kingdom", region: "Wales", description: "Wales' top-ranked course remains a hidden gem despite its championship pedigree." },
    { name: "Cruden Bay Golf Club (Championship)", world_rank: 70, gbi_rank: 22, county: "North East Scotland", country: "United Kingdom", region: "Scotland", description: "Quirky, dramatic, and natural — Cruden Bay is considered a masterpiece by many." },
    { name: "Ganton Golf Club", world_rank: 72, gbi_rank: 23, county: "Yorkshire", country: "United Kingdom", region: "England", description: "A sandy inland site with links and heathland features, once a North Sea inlet." },
    { name: "Portmarnock Golf Club (Championship)", world_rank: 74, gbi_rank: 24, county: "Dublin", country: "Ireland", region: "Ireland", description: "\"No greater finish in the world than Portmarnock's last five holes,\" said Bernard Darwin." },
    { name: "Trump International Golf Links Scotland - Old Course", world_rank: 77, gbi_rank: 25, county: "North East Scotland", country: "United Kingdom", region: "Scotland", description: "Occupying three miles of North Sea coast, this modern course is bold and breathtaking." },
    { name: "Royal Birkdale Golf Club", world_rank: 82, gbi_rank: 26, county: "Lancashire", country: "United Kingdom", region: "England", description: "A fan-favourite on the Open rota, Birkdale is revered for its consistency and charm." },
    { name: "St George's Hill Golf Club (Red & Blue)", world_rank: 85, gbi_rank: 27, county: "Surrey", country: "United Kingdom", region: "England", description: "From the clubhouse, you're greeted by a golfing panorama that stirs the soul." },
    { name: "Royal Aberdeen Golf Club (Balgownie)", world_rank: 88, gbi_rank: 28, county: "North East Scotland", country: "United Kingdom", region: "Scotland", description: "A traditional links with a spectacular outward nine, hugging the North Sea shore." },
    { name: "Royal Cinque Ports Golf Club", world_rank: 90, gbi_rank: 29, county: "Kent", country: "United Kingdom", region: "England", description: "Also known as Deal, this course is a punishing but exhilarating coastal test." },
    { name: "Prestwick Golf Club", world_rank: 93, gbi_rank: 30, county: "Ayrshire & Arran", country: "United Kingdom", region: "Scotland", description: "Prestwick's rugged fairways and dunes deliver a deeply traditional golf experience." }
  ];

  const getContinent = (country: string): Continent => {
    if (country === 'Ireland') return 'Europe';
    if (country === 'United Kingdom') return 'Europe';
    return 'Europe';
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting bulk import of British & Irish courses');
      
      const coursesToInsert = britishIrishTop30.map(course => ({
        name: course.name,
        country: course.country,
        region: course.region,
        continent: getContinent(course.country),
        global_rank: course.world_rank,
        regional_rank: course.gbi_rank,
        description: course.description,
        thumbnail_image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
      }));

      const insertedCourses = [];
      const skippedCourses = [];

      for (const course of coursesToInsert) {
        try {
          // Check if course already exists
          const { data: existingCourse } = await supabase
            .from('golf_courses')
            .select('id, name')
            .eq('name', course.name)
            .maybeSingle();

          if (!existingCourse) {
            const { data, error } = await supabase
              .from('golf_courses')
              .insert([course])
              .select()
              .single();

            if (error) {
              console.error('Error inserting course:', course.name, error);
            } else {
              insertedCourses.push(data);
              console.log('Inserted course:', course.name);
            }
          } else {
            skippedCourses.push(existingCourse);
            console.log('Course already exists:', course.name);
          }
        } catch (error) {
          console.error('Error processing course:', course.name, error);
        }
      }

      return {
        totalCourses: britishIrishTop30.length,
        insertedCourses: insertedCourses.length,
        skippedCourses: skippedCourses.length,
        inserted: insertedCourses,
        skipped: skippedCourses
      };
    },
    onSuccess: (data) => {
      console.log('Bulk import successful:', data);
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success("Import complete", { description: `${data.insertedCourses} added, ${data.skippedCourses} skipped` });
    },
    onError: (error) => {
      console.error('Bulk import failed:', error);
      toast.error("Couldn't import courses", { description: "Please try again" });
    },
  });

  const handleImport = () => {
    setImportResult(null);
    importMutation.mutate();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Top 30 British & Irish Courses
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Add the top 30 golf courses from Britain & Ireland to the database
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm">
            This will import 30 prestigious golf courses including Royal County Down, St Andrews Old Course, 
            Royal Portrush, Muirfield, and many others from the official British & Irish rankings.
          </p>
          
          <Button
            onClick={handleImport}
            disabled={importMutation.isPending}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {importMutation.isPending ? 'Importing...' : 'Import Courses'}
          </Button>
        </div>

        {/* Progress */}
        {importMutation.isPending && (
          <div className="space-y-2">
            <Progress value={50} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Processing course data and checking for duplicates...
            </p>
          </div>
        )}

        {/* Results */}
        {importResult && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-semibold">Import Results</h4>
                  <div className="space-y-1 text-sm">
                    <p>• Total courses processed: <strong>{importResult.totalCourses}</strong></p>
                    <p>• New courses added: <strong>{importResult.insertedCourses}</strong></p>
                    <p>• Duplicates skipped: <strong>{importResult.skippedCourses}</strong></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Course Details</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  These courses include world rankings, regional rankings, detailed descriptions, 
                  and proper location data for Britain, Ireland, Scotland, Wales, and England.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default BulkCourseImporter;
