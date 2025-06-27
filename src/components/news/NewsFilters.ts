
interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pub_date: string;
  source: string;
  image_url?: string;
}

export const filterArticlesByTour = (articles: NewsArticle[], tour: string) => {
  if (!articles) return [];
  
  console.log(`Filtering ${articles.length} articles for tour: ${tour}`);
  
  switch (tour) {
    case 'pga':
      const pgaArticles = articles.filter(article => 
        article.title?.toLowerCase().includes('pga') ||
        article.title?.toLowerCase().includes('tour') ||
        article.title?.toLowerCase().includes('masters') ||
        article.title?.toLowerCase().includes('championship') ||
        article.title?.toLowerCase().includes('golf') ||
        article.description?.toLowerCase().includes('pga') ||
        article.description?.toLowerCase().includes('tour') ||
        article.description?.toLowerCase().includes('golf') ||
        article.source?.toLowerCase().includes('pga') ||
        article.source?.toLowerCase().includes('tour') ||
        article.source?.toLowerCase().includes('golf')
      );
      console.log(`Found ${pgaArticles.length} PGA articles`);
      return pgaArticles;
    case 'liv':
      const livArticles = articles.filter(article => 
        article.title?.toLowerCase().includes('liv') ||
        article.description?.toLowerCase().includes('liv')
      );
      console.log(`Found ${livArticles.length} LIV articles`);
      return livArticles;
    case 'dp':
      const dpArticles = articles.filter(article => 
        article.title?.toLowerCase().includes('dp world') ||
        article.title?.toLowerCase().includes('european') ||
        article.description?.toLowerCase().includes('dp world') ||
        article.description?.toLowerCase().includes('european')
      );
      console.log(`Found ${dpArticles.length} DP World articles`);
      return dpArticles;
    default:
      console.log(`Returning all ${articles.length} articles`);
      return articles;
  }
};
