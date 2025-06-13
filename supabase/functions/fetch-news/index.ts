
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
      for (const item of itemMatches.slice(0, 15)) { // Increased to 15 articles per source
        const title = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim()
        const description = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim()
        const link = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim()
        let pubDate = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim()
        
        // Also try dc:date for some feeds
        if (!pubDate) {
          pubDate = item.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i)?.[1]?.trim()
        }
        
        // Enhanced image extraction with multiple fallback methods
        let imageUrl = null
        
        // Method 1: Try media:content (most common)
        imageUrl = item.match(/<media:content[^>]*url="([^"]*)"[^>]*>/i)?.[1]
        
        // Method 2: Try media:thumbnail
        if (!imageUrl) {
          imageUrl = item.match(/<media:thumbnail[^>]*url="([^"]*)"[^>]*>/i)?.[1]
        }
        
        // Method 3: Try enclosure with image type
        if (!imageUrl) {
          imageUrl = item.match(/<enclosure[^>]*url="([^"]*)"[^>]*type="image[^"]*"[^>]*>/i)?.[1]
        }
        
        // Method 4: Try content:encoded and look for img tags
        if (!imageUrl) {
          const contentEncoded = item.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i)?.[1]
          if (contentEncoded) {
            const imgMatch = contentEncoded.match(/<img[^>]*src="([^"]*)"[^>]*>/i)
            if (imgMatch) {
              imageUrl = imgMatch[1].replace(/&amp;/g, '&')
            }
          }
        }
        
        // Method 5: Look for img tags in description
        if (!imageUrl && description) {
          const imgInDesc = description.match(/<img[^>]*src="([^"]*)"[^>]*>/i)
          if (imgInDesc) {
            imageUrl = imgInDesc[1].replace(/&amp;/g, '&')
          }
        }
        
        // Clean up the image URL if found
        if (imageUrl) {
          imageUrl = imageUrl.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          
          // Basic validation for image URLs
          if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) && 
              !imageUrl.includes('unsplash') && 
              !imageUrl.includes('imgur') && 
              !imageUrl.includes('pgatour') &&
              !imageUrl.includes('golfnews')) {
            imageUrl = null
          }
        }
        
        if (title && link) {
          const parsedDate = pubDate ? new Date(pubDate) : new Date()
          
          // Validate the date
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

    console.log('Starting news fetch...')

    // RSS feed URLs with improved configurations
    const feeds = [
      { url: 'https://golfnews.co.uk/feed/', source: 'Golf News UK' },
      { url: 'https://www.pgatour.com/news.rss', source: 'PGA Tour' },
      // Adding backup PGA Tour feeds
      { url: 'https://feeds.pgatour.com/pgatour/news', source: 'PGA Tour' }
    ]

    const allArticles: NewsArticle[] = []

    // Fetch from each RSS feed with timeout
    for (const feed of feeds) {
      console.log(`Fetching from ${feed.source} at ${feed.url}...`)
      
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
          
          // Log image extraction results for debugging
          const articlesWithImages = articles.filter(a => a.image_url)
          console.log(`${articlesWithImages.length} articles have images from ${feed.source}`)
        } else {
          console.log(`No articles found for ${feed.source}`)
        }
      } catch (error) {
        console.error(`Failed to fetch from ${feed.source}:`, error.message)
      }
    }

    // Remove duplicates based on title and link
    const uniqueArticles = allArticles.filter((article, index, self) => 
      index === self.findIndex(a => a.title === article.title || a.link === article.link)
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
      
      const withImages = uniqueArticles.filter(a => a.image_url).length
      console.log(`${withImages} articles have images out of ${uniqueArticles.length} total`)
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
        message: `Fetched ${uniqueArticles.length} unique articles from golf news sources`
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
