// News repository implementation for Article queries

import { Article, Prisma } from '@prisma/client';
import { FindNearbyParams, INewsRepository, ArticleWithDistance } from '../../../modules/news/news.repository';
import { prisma } from './client';

// Implements news-related database operations
class NewsRepository implements INewsRepository {
  // Find articles by category with pagination
  async findByCategory(category: string, page: number, limit: number): Promise<{ articles: Article[], total: number }> {
    const skip = (page - 1) * limit;
    const [articles, total] = await prisma.$transaction([
      prisma.article.findMany({
        where: { category: { has: category } },
        orderBy: { publication_date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.article.count({ where: { category: { has: category } } })
    ]);
    return { articles, total };
  }

  // Find articles by minimum relevance score with pagination
  async findByScore(minScore: number, page: number, limit: number): Promise<{ articles: Article[], total: number }> {
    const skip = (page - 1) * limit;
    const [articles, total] = await prisma.$transaction([
      prisma.article.findMany({
        where: { relevance_score: { gte: minScore } },
        orderBy: { relevance_score: 'desc' },
        skip,
        take: limit,
      }),
      prisma.article.count({ where: { relevance_score: { gte: minScore } } })
    ]);
    return { articles, total };
  }

  // Full-text search for articles using keywords
  async findBySearchQuery(query: string, page: number, limit: number): Promise<{ articles: Article[], total: number }> {
    const processedQuery = query.trim().split(/\s+/).join(' & ');
    const skip = (page - 1) * limit;

    const articles = await prisma.$queryRaw<Article[]>`
      SELECT id, title, description, url, publication_date, source_name, category, relevance_score, latitude, longitude
      FROM "Article"
      WHERE search_vector @@ to_tsquery('english', ${processedQuery})
      ORDER BY ts_rank(search_vector, to_tsquery('english', ${processedQuery})) DESC, relevance_score DESC
      OFFSET ${skip}
      LIMIT ${limit};
    `;
    
    const totalResult = await prisma.$queryRaw<[{ count: BigInt }]>`
        SELECT COUNT(*)
        FROM "Article"
        WHERE search_vector @@ to_tsquery('english', ${processedQuery});
    `;
    const total = Number(totalResult[0].count);

    return { articles, total };
  }

  // Find articles by source name with pagination
  async findBySource(source: string, page: number, limit: number): Promise<{ articles: Article[], total: number }> {
    const skip = (page - 1) * limit;
    const [articles, total] = await prisma.$transaction([
        prisma.article.findMany({
            where: { source_name: { equals: source, mode: 'insensitive' } },
            orderBy: { publication_date: 'desc' },
            skip,
            take: limit,
        }),
        prisma.article.count({ where: { source_name: { equals: source, mode: 'insensitive' } } })
    ]);
    return { articles, total };
  }
  
  // Find nearby articles within a radius, sorted by distance
  async findNearby({ lat, lon, radiusInMeters }: FindNearbyParams, page: number, limit: number): Promise<{ articles: ArticleWithDistance[], total: number }> {
    const skip = (page - 1) * limit;
    
    const articles = await prisma.$queryRaw<ArticleWithDistance[]>`
      SELECT 
        id, title, description, url, publication_date, source_name, category, relevance_score, latitude, longitude,
        ST_Distance(location, ST_MakePoint(${lon}, ${lat})::geography) as distance
      FROM "Article"
      WHERE ST_DWithin(location, ST_MakePoint(${lon}, ${lat})::geography, ${radiusInMeters})
      ORDER BY distance ASC
      OFFSET ${skip}
      LIMIT ${limit};
    `;

    const totalResult = await prisma.$queryRaw<[{ count: BigInt }]>`
        SELECT COUNT(*)
        FROM "Article"
        WHERE ST_DWithin(location, ST_MakePoint(${lon}, ${lat})::geography, ${radiusInMeters});
    `;
    const total = Number(totalResult[0].count);

    return { articles, total };
  }
  
  // Get trending articles, using a blended score of popularity and distance
async findTrending(lat: number, lon: number, limit: number): Promise<Article[]> {
  return prisma.$queryRaw<Article[]>`
    WITH user_location AS (
      SELECT ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography AS point
    )
    SELECT
      id, title, description, url, publication_date, source_name, category, relevance_score, latitude, longitude
    FROM "TrendingArticles", user_location
    ORDER BY
      -- The Blended Score Calculation:
      trending_score * EXP(-ST_Distance(location, user_location.point) / 50000) DESC
    LIMIT ${limit};
  `;
}

  // Find nearby articles matching keywords
  async findNearbyWithKeywords({ lat, lon, radiusInMeters }: FindNearbyParams, keywords: string[]): Promise<Article[]> {
    if (keywords.length === 0) {
      // Fallback to normal nearby search if no keywords
      const { articles } = await this.findNearby({ lat, lon, radiusInMeters }, 1, 5);
      return articles;
    }

    const processedQuery = keywords.join(' & ');

    return prisma.$queryRaw<Article[]>`
      SELECT id, title, description, url, publication_date, source_name, category, relevance_score, latitude, longitude
      FROM "Article" a
      WHERE 
        ST_DWithin(a.location, ST_MakePoint(${lon}, ${lat})::geography, ${radiusInMeters})
        AND a.search_vector @@ to_tsquery('english', ${processedQuery})
      ORDER BY ST_Distance(a.location, ST_MakePoint(${lon}, ${lat})::geography) ASC
      LIMIT 5;
    `;
  }

  // Log user events (view/click) for analytics
  async logEvent(event: {
    eventType: string;
    articleId: string;
    userId: string;
    latitude: number;
    longitude: number;
  }): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO "UserEvent" (id, "eventType", "articleId", "userId", latitude, longitude, location)
      VALUES (
        gen_random_uuid(),
        ${event.eventType},
        ${event.articleId}::uuid,
        ${event.userId},
        ${event.latitude},
        ${event.longitude},
        ST_SetSRID(ST_MakePoint(${event.longitude}, ${event.latitude}), 4326)::geography
      );
    `;
  }
}

export const newsRepository = new NewsRepository();