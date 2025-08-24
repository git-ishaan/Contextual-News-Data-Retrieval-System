import { newsRepository } from '../../core/adapters/db/news.adapter';
import { llmProvider } from '../../core/adapters/llm/gemini.provider';
import { cacheProvider } from '../../core/adapters/cache/redis.adapter';
import { ArticleWithDistance, INewsRepository } from './news.repository';
import { Article, Prisma } from '@prisma/client';
import { EventRequest } from './news.schema';
import { prisma } from '../../core/adapters/db/client';
import { logger } from '../../core/logger';
import { getGeospatialCacheKey } from '../../utils/geo'; 

// Service layer for news-related business logic
class NewsService {
  constructor(private repository: INewsRepository) {}

  // Format articles for API response
  private formatArticles(articles: (Article | ArticleWithDistance)[]) {
    return articles.map(article => ({
      id: article.id,
      title: article.title,
      description: article.description,
      url: article.url,
      publication_date: article.publication_date.toISOString(),
      source_name: article.source_name,
      category: article.category,
      relevance_score: article.relevance_score,
      latitude: article.latitude,
      longitude: article.longitude,
    }));
  }

  // Get articles by category with pagination
  async getByCategory(category: string, page: number, limit: number) {
    const { articles, total } = await this.repository.findByCategory(category, page, limit);
    return { articles: this.formatArticles(articles), total };
  }

  // Get articles by minimum relevance score with pagination
  async getByScore(minScore: number, page: number, limit: number) {
    const { articles, total } = await this.repository.findByScore(minScore, page, limit);
    return { articles: this.formatArticles(articles), total };
  }

  // Get articles by search query with pagination
  async getBySearchQuery(query: string, page: number, limit: number) {
    const { articles, total } = await this.repository.findBySearchQuery(query, page, limit);
    return { articles: this.formatArticles(articles), total };
  }
  
  // Get articles by source with pagination
  async getBySource(source: string, page: number, limit: number) {
    const { articles, total } = await this.repository.findBySource(source, page, limit);
    return { articles: this.formatArticles(articles), total };
  }

  // Get nearby articles within a radius
  async getNearby(lat: number, lon: number, radiusInKm: number, page: number, limit: number) {
    const radiusInMeters = radiusInKm * 1000;
    const { articles, total } = await this.repository.findNearby({ lat, lon, radiusInMeters }, page, limit);
    return { articles: this.formatArticles(articles), total };
  }

  // Add LLM summaries to articles, using cache if available
  private async enrichArticlesWithSummaries(articles: any[]) {
    const enriched = await Promise.all(
      articles.map(async (article: any) => {
        const summaryCacheKey = `summary:${article.id}`;
        let summary = await cacheProvider.get<string>(summaryCacheKey);
        if (!summary) {
          summary = await llmProvider.summarizeText(article.description);
          await cacheProvider.set(summaryCacheKey, summary, 86400);
        }
        return { ...article, llm_summary: summary };
      })
    );
    return enriched;
  }

  // Process a natural language query using LLM and return enriched articles
  async processNaturalLanguageQuery(query: string, lat?: number, lon?: number) {
    const cacheKey = `query:final-v9:${query}:${lat}:${lon}`;
    const cachedResult = await cacheProvider.get<any[]>(cacheKey);
    if (cachedResult) {
      logger.info({ cacheKey }, "Serving AI query from cache");
      return cachedResult;
    }

    logger.info({ query }, "Processing new AI query");
    const analysis = await llmProvider.analyzeQuery(query);
    logger.info({ analysis }, "Received analysis from LLM");
    
    const keywords = analysis.keywords || [];
    let articles: Article[] = [];

    // Try keyword-based search first
    if (keywords.length > 0) {
        const searchConditions = keywords.map((keyword: string) => ([
            { title: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } }
        ])).flat();

        logger.info({ OR: searchConditions }, "Attempting search with extracted keywords.");
        articles = await prisma.article.findMany({
            where: {
                OR: searchConditions
            },
            orderBy: { relevance_score: 'desc' },
            take: 5,
        });
    }
    
    // Fallback to original query if no articles found
    if (articles.length === 0) {
        logger.warn("Keyword search failed or no keywords found. Falling back to original query search.");
        const { articles: searchArticles } = await this.repository.findBySearchQuery(query, 1, 5);
        articles = searchArticles;
    }
    
    // Return empty array if still no articles found
    if (articles.length === 0) {
        logger.warn({ query }, "No articles found after all strategies.");
        return [];
    }

    // Format and enrich articles with LLM summaries
    const formattedArticles = this.formatArticles(articles);
    const enrichedArticles = await this.enrichArticlesWithSummaries(formattedArticles);
    
    // Cache the result for future queries
    await cacheProvider.set(cacheKey, enrichedArticles, 3600);
    logger.info({ cacheKey, resultCount: enrichedArticles.length }, "AI query successful and cached.");
    return enrichedArticles;
  }
  
  // Log a user event (view/click)
  async createEvent(eventData: EventRequest) {
    await this.repository.logEvent({
      eventType: eventData.eventType,
      articleId: eventData.articleId,
      userId: eventData.userId,
      latitude: eventData.lat,
      longitude: eventData.lon,
    });
  }
  
  // Get trending articles by location, using geospatial cache key
  async getTrending(lat: number, lon: number, limit: number) {
    // 1. Generate the grid-based key instead of using precise coordinates.
    const geoKey = getGeospatialCacheKey(lat, lon);
    const cacheKey = `trending:${geoKey}`;
    
    const cachedResult = await cacheProvider.get<any[]>(cacheKey);
    if (cachedResult !== null) {
      logger.info({ cacheKey }, "Serving trending from cache");
      return cachedResult;
    }

    logger.info({ cacheKey }, "Cache miss for trending. Querying database.");
    const articles = await this.repository.findTrending(lat, lon, limit);
    const formattedArticles = this.formatArticles(articles);
    
    // Cache the result with a 5-minute TTL (trending news can change quickly)
    await cacheProvider.set(cacheKey, formattedArticles, 300);
    logger.info({ cacheKey, resultCount: formattedArticles.length }, "Trending query successful and cached.");
    return formattedArticles;
  }
}

// Export singleton instance of NewsService
export const newsService = new NewsService(newsRepository);

