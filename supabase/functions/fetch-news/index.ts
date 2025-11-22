
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { normalizeError } from '../_shared/normalize-error.ts';

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

async function fetchFromNewsAPI(query: string, sources?: string): Promise<NewsArticle[]> {
  const newsApiKey = Deno.env.get('NEWS_API_KEY')
  if (!newsApiKey) {
    console.error('NEWS_API_KEY not found')
    return []
  }

  try {
    const params = new URLSearchParams({
      q: query,
      sortBy: 'publishedAt',
      pageSize: '20',
      language: 'en',
      apiKey: newsApiKey
    })

    if (sources) {
      params.append('sources', sources)
    }

    const url = `https://newsapi.org/v2/everything?${params.toString()}`
    
    console.log(`Fetching from NewsAPI: ${query}`)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Golf-News-App/1.0',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`NewsAPI error: ${response.status} ${response.statusText}`)
      return []
    }

    const data = await response.json()
    
    if (data.status !== 'ok') {
      console.error('NewsAPI returned error:', data.message)
      return []
    }

    const articles: NewsArticle[] = data.articles.map((article: any) => ({
      title: article.title || 'Untitled',
      description: article.description || article.content || '',
      link: article.url || '',
      pub_date: new Date(article.publishedAt || new Date()).toISOString(),
      source: article.source?.name || 'Unknown Source',
      image_url: article.urlToImage || null
    }))

    console.log(`Successfully fetched ${articles.length} articles from NewsAPI for query: ${query}`)
    return articles
  } catch (error) {
    console.error(`Error fetching from NewsAPI for query "${query}":`, error)
    return []
  }
}

async function parseRSSFeed(url: string, source: string): Promise<NewsArticle[]> {
  try {
    console.log(`Fetching RSS feed from: ${url}`)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    })
    
    if (!response.ok) {
      console.error(`HTTP error for ${source}: ${response.status} ${response.statusText}`)
      return []
    }
    
    const text = await response.text()
    console.log(`RSS content length for ${source}: ${text.length}`)
    
    // Parse XML manually for RSS feeds
    const articles: NewsArticle[] = []
    const itemMatches = text.match(/<item[^>]*>([\s\S]*?)<\/item>/gi)
    
    console.log(`Found ${itemMatches?.length || 0} items for ${source}`)
    
    if (itemMatches) {
      for (const item of itemMatches.slice(0, 10)) {
        const title = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim()
        const description = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim()
        const link = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim()
        let pubDate = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim()
        
        // Also try dc:date for some feeds
        if (!pubDate) {
          pubDate = item.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i)?.[1]?.trim()
        }
        
        // Enhanced image extraction
        let imageUrl = null
        imageUrl = item.match(/<media:content[^>]*url="([^"]*)"[^>]*>/i)?.[1]
        if (!imageUrl) {
          imageUrl = item.match(/<media:thumbnail[^>]*url="([^"]*)"[^>]*>/i)?.[1]
        }
        if (!imageUrl) {
          imageUrl = item.match(/<enclosure[^>]*url="([^"]*)"[^>]*type="image[^"]*"[^>]*>/i)?.[1]
        }
        
        if (imageUrl) {
          imageUrl = imageUrl.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        }
        
        if (title && link) {
          const parsedDate = pubDate ? new Date(pubDate) : new Date()
          const finalDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate
          
          articles.push({
            title: title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
            description: description ? description.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").substring(0, 300) : '',
            link: link.replace(/&amp;/g, '&'),
            pub_date: finalDate.toISOString(),
            source,
            image_url: imageUrl
          })
        }
      }
    }
    
    console.log(`Successfully parsed ${articles.length} articles from ${source}`)
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

    console.log('Starting enhanced news fetch...')

    const allArticles: NewsArticle[] = []

    // Fetch PGA Tour news from NewsAPI with specific sources
    console.log('Fetching PGA Tour news from NewsAPI...')
    const pgaArticles = await fetchFromNewsAPI(
      'PGA Tour OR "PGA Championship" OR "Masters Tournament" OR "golf tournament"',
      'espn,bbc-sport,cnn,the-washington-post,reuters,associated-press,fox-sports'
    )
    allArticles.push(...pgaArticles)

    // Fetch LIV Golf news
    console.log('Fetching LIV Golf news from NewsAPI...')
    const livArticles = await fetchFromNewsAPI('LIV Golf OR "LIV tournament"')
    allArticles.push(...livArticles)

    // Fetch DP World Tour news
    console.log('Fetching DP World Tour news from NewsAPI...')
    const dpArticles = await fetchFromNewsAPI('"DP World Tour" OR "European Tour"')
    allArticles.push(...dpArticles)

    // Supplement with RSS feeds for additional coverage
    const rssFeeds = [
      { url: 'https://golfnews.co.uk/feed/', source: 'Golf News UK' },
      { url: 'https://www.pgatour.com/news.rss', source: 'PGA Tour' }
    ]

    for (const feed of rssFeeds) {
      console.log(`Fetching from RSS: ${feed.source}...`)
      try {
        const articles = await Promise.race([
          parseRSSFeed(feed.url, feed.source),
          new Promise<NewsArticle[]>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 10000)
          )
        ])
        
        if (articles.length > 0) {
          allArticles.push(...articles)
          console.log(`Successfully fetched ${articles.length} articles from ${feed.source}`)
        }
      } catch (error) {
        const err = normalizeError(error);
        console.error(`Failed to fetch from ${feed.source}:`, err.message)
      }
    }

    // Remove duplicates based on title and link
    const uniqueArticles = allArticles.filter((article, index, self) => 
      index === self.findIndex(a => 
        (a.title === article.title && a.title.length > 10) || 
        (a.link === article.link && a.link.length > 10)
      )
    )

    console.log(`Total unique articles: ${uniqueArticles.length}`)

    if (uniqueArticles.length > 0) {
      // Clear existing articles and insert new ones
      const { error: deleteError } = await supabaseClient
        .from('news_articles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      
      if (deleteError) {
        console.error('Error deleting existing articles:', deleteError)
      }
      
      const { error: insertError } = await supabaseClient
        .from('news_articles')
        .insert(uniqueArticles)

      if (insertError) {
        console.error('Error inserting articles:', insertError)
        throw insertError
      }

      console.log(`Successfully inserted ${uniqueArticles.length} articles`)
      
      // Log source breakdown
      const sourceBreakdown = uniqueArticles.reduce((acc, article) => {
        acc[article.source] = (acc[article.source] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      console.log('Articles by source:', sourceBreakdown)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        articlesCount: uniqueArticles.length,
        articlesWithImages: uniqueArticles.filter(a => a.image_url).length,
        sourceBreakdown: uniqueArticles.reduce((acc, article) => {
          acc[article.source] = (acc[article.source] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        message: `Fetched ${uniqueArticles.length} unique articles from enhanced news sources`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in enhanced fetch-news function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: normalizeError(error).message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
