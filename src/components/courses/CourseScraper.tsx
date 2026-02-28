
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Globe, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const CourseScraper = () => {
  
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('https://www.top100golfcourses.com/');
  const [scrapeResult, setScrapeResult] = useState<any>(null);

  const scrapeMutation = useMutation({
    mutationFn: async (urlToScrape: string) => {
      console.log('Starting scrape for URL:', urlToScrape);
      
      const { data, error } = await supabase.functions.invoke('scrape-golf-courses', {
        body: { url: urlToScrape }
      });

      if (error) {
        console.error('Scraping error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Scraping successful:', data);
      setScrapeResult(data);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success(`Scraping Complete! Found ${data.coursesFound} courses, inserted ${data.coursesInserted} new courses.`);
    },
    onError: (error) => {
      console.error('Scraping failed:', error);
      toast.error("Failed to scrape golf course data. Please try again.");
    },
  });

  const handleScrape = () => {
    if (!url.trim()) {
      toast.error("Please enter a URL to scrape.");
      return;
    }
    setScrapeResult(null);
    scrapeMutation.mutate(url.trim());
  };

  const popularUrls = [
    'https://www.top100golfcourses.com/',
    'https://www.top100golfcourses.com/golf-courses/europe',
    'https://www.top100golfcourses.com/golf-courses/north-america',
    'https://www.top100golfcourses.com/golf-courses/asia',
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Import Golf Courses
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Scrape golf course data from websites to expand our database
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <label htmlFor="scrape-url" className="text-body-sm font-medium">
            Website URL
          </label>
          <div className="flex gap-2">
            <Input
              id="scrape-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.top100golfcourses.com/"
              disabled={scrapeMutation.isPending}
            />
            <Button
              onClick={handleScrape}
              disabled={scrapeMutation.isPending || !url.trim()}
              className="min-w-fit"
            >
              <Globe className="h-4 w-4 mr-2" />
              {scrapeMutation.isPending ? 'Scraping...' : 'Scrape'}
            </Button>
          </div>
        </div>

        {/* Popular URLs */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Popular Sources:</p>
          <div className="flex flex-wrap gap-2">
            {popularUrls.map((popularUrl) => (
              <Badge
                key={popularUrl}
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() => setUrl(popularUrl)}
              >
                {popularUrl.split('/').pop() || 'Homepage'}
              </Badge>
            ))}
          </div>
        </div>

        {/* Progress */}
        {scrapeMutation.isPending && (
          <div className="space-y-2">
            <Progress value={50} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Scraping website and parsing golf course data...
            </p>
          </div>
        )}

        {/* Results */}
        {scrapeResult && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-semibold">Scraping Results</h4>
                  <div className="space-y-1 text-sm">
                    <p>• Courses found: <strong>{scrapeResult.coursesFound}</strong></p>
                    <p>• New courses added: <strong>{scrapeResult.coursesInserted}</strong></p>
                    <p>• Duplicates skipped: <strong>{scrapeResult.coursesFound - scrapeResult.coursesInserted}</strong></p>
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
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">How it works</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  This tool scrapes golf course data from websites and automatically imports them into our database. 
                  Duplicate courses are automatically detected and skipped.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default CourseScraper;
