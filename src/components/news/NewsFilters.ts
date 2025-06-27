
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
  
  switch (tour) {
    case 'pga':
      return articles.filter(article => 
        article.title?.toLowerCase().includes('pga') ||
        article.description?.toLowerCase().includes('pga') ||
        article.source?.toLowerCase().includes('pga')
      );
    case 'liv':
      return articles.filter(article => 
        article.title?.toLowerCase().includes('liv') ||
        article.description?.toLowerCase().includes('liv')
      );
    case 'dp':
      return articles.filter(article => 
        article.title?.toLowerCase().includes('dp world') ||
        article.title?.toLowerCase().includes('european') ||
        article.description?.toLowerCase().includes('dp world') ||
        article.description?.toLowerCase().includes('european')
      );
    default:
      return articles;
  }
};
