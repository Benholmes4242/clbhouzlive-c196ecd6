import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
    };
  }[];
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('Firecrawl API key not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Firecrawl API key not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    console.log('Starting to scrape URL:', url);
    console.log('Using Firecrawl API key:', firecrawlApiKey.substring(0, 10) + '...');

    // Use Firecrawl to scrape the website
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      }),
    });

    console.log('Firecrawl response status:', firecrawlResponse.status);
    console.log('Firecrawl response headers:', Object.fromEntries(firecrawlResponse.headers.entries()));

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error('Firecrawl API error response:', errorText);
      console.error('Firecrawl API status:', firecrawlResponse.status);
      console.error('Firecrawl API status text:', firecrawlResponse.statusText);
      
      // Try to parse error as JSON for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Firecrawl API error details:', errorJson);
        return new Response(
          JSON.stringify({ 
            error: errorJson.error || errorJson.message || 'Failed to scrape website',
            details: errorJson,
            status: firecrawlResponse.status 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      } catch (parseError) {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to scrape website', 
            details: errorText,
            status: firecrawlResponse.status 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }
    }

    const scrapedData: FirecrawlResponse = await firecrawlResponse.json();
    console.log('Firecrawl response data:', JSON.stringify(scrapedData, null, 2));
    
    if (!scrapedData.success) {
      console.error('Firecrawl scraping failed:', scrapedData.error);
      return new Response(
        JSON.stringify({ error: scrapedData.error || 'Scraping failed' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Parse golf course data from the scraped content
    const courses = parseGolfCourseData(scrapedData.data?.[0]?.markdown || '');
    console.log('Parsed courses:', courses.length);
    
    if (courses.length === 0) {
      console.log('No golf courses found in scraped content');
      console.log('Scraped markdown preview:', scrapedData.data?.[0]?.markdown?.substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'No golf courses found in the scraped data' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert courses into database
    const insertedCourses = [];
    for (const course of courses) {
      try {
        // Check if course already exists
        const { data: existingCourse } = await supabase
          .from('golf_courses')
          .select('id')
          .eq('name', course.name)
          .eq('country', course.country)
          .maybeSingle();

        if (!existingCourse) {
          const { data, error } = await supabase
            .from('golf_courses')
            .insert(course)
            .select()
            .single();

          if (error) {
            console.error('Error inserting course:', course.name, error);
          } else {
            insertedCourses.push(data);
            console.log('Inserted course:', course.name);
          }
        } else {
          console.log('Course already exists:', course.name);
        }
      } catch (error) {
        console.error('Error processing course:', course.name, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        coursesFound: courses.length,
        coursesInserted: insertedCourses.length,
        courses: insertedCourses
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in scrape-golf-courses function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function parseGolfCourseData(markdown: string): any[] {
  const courses: any[] = [];
  
  try {
    // Split content by lines and look for course patterns
    const lines = markdown.split('\n');
    let currentCourse: any = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for course names (usually in headers or strong text)
      if (line.match(/^#|^\*\*.*\*\*$/) && line.includes('Golf')) {
        if (currentCourse && currentCourse.name) {
          courses.push(processCourse(currentCourse));
        }
        
        currentCourse = {
          name: line.replace(/^#+\s*|\*\*/g, '').trim(),
          country: '',
          region: '',
          continent: 'Europe', // Default, will be updated based on country
          description: '',
          global_rank: null,
          regional_rank: null,
          latitude: null,
          longitude: null,
          thumbnail_image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
        };
      }
      
      // Look for country/location information
      if (currentCourse && line.includes('Country:')) {
        currentCourse.country = line.replace('Country:', '').trim();
      }
      
      // Look for ranking information
      if (currentCourse && line.match(/rank|#\d+/i)) {
        const rankMatch = line.match(/\#?(\d+)/);
        if (rankMatch) {
          currentCourse.global_rank = parseInt(rankMatch[1]);
        }
      }
      
      // Collect description text
      if (currentCourse && line.length > 20 && !line.includes(':') && !line.startsWith('#')) {
        if (currentCourse.description) {
          currentCourse.description += ' ' + line;
        } else {
          currentCourse.description = line;
        }
      }
    }
    
    // Add the last course
    if (currentCourse && currentCourse.name) {
      courses.push(processCourse(currentCourse));
    }
    
  } catch (error) {
    console.error('Error parsing golf course data:', error);
  }
  
  return courses;
}

function processCourse(course: any): any {
  // Set continent based on country
  const continentMap: { [key: string]: string } = {
    'United States': 'North America',
    'Canada': 'North America',
    'Mexico': 'North America',
    'England': 'Europe',
    'Scotland': 'Europe',
    'Ireland': 'Europe',
    'Wales': 'Europe',
    'France': 'Europe',
    'Spain': 'Europe',
    'Germany': 'Europe',
    'Italy': 'Europe',
    'Australia': 'Oceania',
    'New Zealand': 'Oceania',
    'South Africa': 'Africa',
    'Japan': 'Asia',
    'China': 'Asia',
    'South Korea': 'Asia',
    'Argentina': 'South America',
    'Brazil': 'South America',
  };
  
  course.continent = continentMap[course.country] || 'Europe';
  
  // Clean up description
  if (course.description && course.description.length > 500) {
    course.description = course.description.substring(0, 497) + '...';
  }
  
  // Ensure required fields are not empty
  if (!course.country) course.country = 'Unknown';
  if (!course.name) return null;
  
  return course;
}
