
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { normalizeError } from '../_shared/normalize-error.ts';

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
  };
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

    // Enhanced Firecrawl configuration for content-rich pages
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000, // Wait 3 seconds for content to load
        timeout: 45000, // Increase timeout to 45 seconds
        includeTags: ['h1', 'h2', 'h3', 'h4', 'p', 'a', 'div', 'span', 'li', 'ul', 'ol'],
        excludeTags: ['nav', 'footer', 'header', 'script', 'style', 'aside', 'advertisement', 'cookie'],
        removeBase64Images: true, // Reduce response size
      }),
    });

    console.log('Firecrawl response status:', firecrawlResponse.status);

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error('Firecrawl API error:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        return new Response(
          JSON.stringify({ 
            error: errorJson.error || 'Failed to scrape website',
            details: errorJson 
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
            details: errorText 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }
    }

    const scrapedData: FirecrawlResponse = await firecrawlResponse.json();
    console.log('Scraped content length:', scrapedData.data?.markdown?.length || 0);
    
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
    const markdown = scrapedData.data?.markdown || '';
    console.log('Processing markdown content of length:', markdown.length);
    
    const courses = parseGolfCourseData(markdown, url);
    console.log('Successfully parsed courses:', courses.length);
    
    if (courses.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No golf courses found',
          debug: {
            contentLength: markdown.length,
            contentPreview: markdown.substring(0, 500),
            url: url
          }
        }),
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
    const err = normalizeError(error);
    console.error('Error in scrape-golf-courses function:', err.message);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: err.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function parseGolfCourseData(markdown: string, sourceUrl: string): any[] {
  const courses: any[] = [];
  
  try {
    console.log('Parsing golf course data from:', sourceUrl);
    
    // Strategy 1: Look for golf course names in links and headings
    const coursePatterns = [
      // Links to golf courses: [Course Name](url)
      /\[([^\]]+(?:golf|club|links|course|cc|gc)[^\]]*)\]\([^)]+\)/gi,
      // Headings with golf course names
      /^#+\s*([^\n]*(?:golf|club|links|course|cc|gc)[^\n]*)/gim,
      // Text patterns that might be course names
      /([A-Z][a-zA-Z\s&'-]{10,80}(?:golf|club|links|course|country club|gc|cc))/gi
    ];

    const foundCourses = new Set<string>();

    // Apply all patterns
    coursePatterns.forEach(pattern => {
      const matches = markdown.matchAll(pattern);
      for (const match of matches) {
        const courseName = match[1]?.trim();
        if (courseName && courseName.length > 5 && courseName.length < 100) {
          // Clean up the course name
          const cleanName = courseName
            .replace(/^\d+\.?\s*/, '') // Remove leading numbers
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          if (cleanName && !foundCourses.has(cleanName.toLowerCase())) {
            foundCourses.add(cleanName.toLowerCase());
            courses.push(createCourse(cleanName, sourceUrl));
          }
        }
      }
    });

    // Strategy 2: Look for numbered lists that might be rankings
    const rankingMatches = markdown.matchAll(/^\s*(\d+)\.\s*([^\n]+)/gm);
    for (const match of rankingMatches) {
      const rank = parseInt(match[1]);
      const text = match[2].trim();
      
      if (rank <= 200 && text.length > 10 && text.length < 100) {
        // Check if this looks like a golf course
        if (text.match(/golf|club|links|course|cc|gc/i) || 
            text.match(/^[A-Z][a-zA-Z\s&'-]+$/)) {
          
          const cleanName = text
            .replace(/^\d+\.?\s*/, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (cleanName && !foundCourses.has(cleanName.toLowerCase())) {
            foundCourses.add(cleanName.toLowerCase());
            const course = createCourse(cleanName, sourceUrl);
            course.global_rank = rank;
            courses.push(course);
          }
        }
      }
    }

    // Strategy 3: Extract location information for existing courses
    const lines = markdown.split('\n');
    for (let i = 0; i < courses.length && i < lines.length; i++) {
      const course = courses[i];
      
      // Look for location patterns near the course name
      for (let j = Math.max(0, i - 3); j < Math.min(lines.length, i + 4); j++) {
        const line = lines[j];
        
        // Look for country patterns
        const countryMatch = line.match(/\b(United States|England|Scotland|Ireland|Wales|France|Spain|Germany|Australia|Canada|Japan|South Africa)\b/i);
        if (countryMatch && !course.country) {
          course.country = countryMatch[1];
          course.continent = getContinent(countryMatch[1]);
        }
        
        // Look for state/region patterns
        const regionMatch = line.match(/\b(California|New York|Pennsylvania|Florida|Texas|Nevada|Arizona)\b/i);
        if (regionMatch && !course.region) {
          course.region = regionMatch[1];
        }
      }
    }

  } catch (error) {
    console.error('Error parsing golf course data:', error);
  }
  
  console.log(`Parsed ${courses.length} courses from the content`);
  return courses.slice(0, 50); // Limit to 50 courses per scrape to avoid overwhelming the database
}

function createCourse(name: string, sourceUrl: string): any {
  return {
    name: name.trim(),
    country: 'Unknown',
    region: '',
    continent: 'Europe',
    description: '',
    global_rank: null,
    regional_rank: null,
    latitude: null,
    longitude: null,
    thumbnail_image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop',
    top100_url: sourceUrl
  };
}

function getContinent(country: string): string {
  const continentMap: { [key: string]: string } = {
    'United States': 'North America',
    'Canada': 'North America',
    'England': 'Europe',
    'Scotland': 'Europe',
    'Ireland': 'Europe',
    'Wales': 'Europe',
    'France': 'Europe',
    'Spain': 'Europe',
    'Germany': 'Europe',
    'Australia': 'Oceania',
    'Japan': 'Asia',
    'South Africa': 'Africa',
  };
  
  return continentMap[country] || 'Europe';
}
