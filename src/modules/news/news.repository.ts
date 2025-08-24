import { Article, UserEvent } from '@prisma/client';

// Parameters for finding nearby articles
export interface FindNearbyParams {
  lat: number;
  lon: number;
  radiusInMeters: number;
}

// Article type extended with distance property
export type ArticleWithDistance = Article & { distance: number };

// News repository interface defining all data access methods
export interface INewsRepository {
  findByCategory(category: string, page: number, limit: number): Promise<{ articles: Article[], total: number }>;
  findByScore(minScore: number, page: number, limit: number): Promise<{ articles: Article[], total: number }>;
  findBySearchQuery(query: string, page: number, limit: number): Promise<{ articles: Article[], total: number }>;
  findBySource(source: string, page: number, limit: number): Promise<{ articles: Article[], total: number }>;
  findNearby(params: FindNearbyParams, page: number, limit: number): Promise<{ articles: ArticleWithDistance[], total: number }>;
  logEvent(event: Omit<UserEvent, 'id' | 'createdAt' | 'location'>): Promise<void>;
  findTrending(lat: number, lon: number, limit: number): Promise<Article[]>;
  findNearbyWithKeywords(params: FindNearbyParams, keywords: string[]): Promise<Article[]>;
}