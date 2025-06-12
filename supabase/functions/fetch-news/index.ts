
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsArticle {
  title: string
  description: string
  link: string
  pub_date: string
  source: string
  image_url?: string
}

async function parseRSSFeed(url: string, source: string): Promise<NewsArticle[]> {
  try {
    const response = await fetch(url)
    const text = await response.text()
    
    // Parse XML manually for RSS feeds
    const articles: NewsArticle[] = []
    const itemMatches = text.match(/<item[^>]*>([\s\S]*?)<\/item>/gi)
    
    if (itemMatches) {
      for (const item of itemMatches.slice(0, 10)) { // Limit to 10 articles per source
        const title = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim()
        const description = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim()
        const link = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim()
        const pubDate = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim()
        
        // Try to extract image from media:content or enclosure
        let imageUrl = item.match(/<media:content[^>]*url="([^"]*)"[^>]*>/i)?.[1]
        if (!imageUrl) {
          imageUrl = item.match(/<enclosure[^>]*url="([^"]*)"[^>]*type="image/i)?.[1]
        }
        
        if (title && link) {
          articles.push({
            title,
            description: description || '',
            link,
            pub_date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            source,
            image_url: imageUrl
          })
        }
      }
    }
    
    return articles
  } catch (error) {
    console.error(`Error parsing RSS feed from ${source}:`, error)
    return []
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting news fetch...')

    // RSS feed URLs
    const feeds = [
      { url: 'https://golfnews.co.uk/feed/', source: 'Golf News UK' },
      { url: 'https://www.pgatour.com/news.rss', source: 'PGA Tour' }
    ]

    const allArticles: NewsArticle[] = []

    // Fetch from each RSS feed
    for (const feed of feeds) {
      console.log(`Fetching from ${feed.source}...`)
      const articles = await parseRSSFeed(feed.url, feed.source)
      allArticles.push(...articles)
      console.log(`Found ${articles.length} articles from ${feed.source}`)
    }

    if (allArticles.length > 0) {
      // Clear existing articles and insert new ones
      await supabaseClient.from('news_articles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      
      const { error: insertError } = await supabaseClient
        .from('news_articles')
        .insert(allArticles)

      if (insertError) {
        console.error('Error inserting articles:', insertError)
        throw insertError
      }

      console.log(`Successfully inserted ${allArticles.length} articles`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        articlesCount: allArticles.length,
        message: `Fetched ${allArticles.length} articles from golf news sources`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in fetch-news function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
