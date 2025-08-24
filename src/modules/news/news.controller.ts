// Controller for news-related endpoints

import { FastifyRequest, FastifyReply } from 'fastify';
import { newsService } from './news.service';
import {
  GetNewsByCategoryRequest,
  GetNewsByScoreRequest,
  GetNewsBySearchRequest,
  GetNewsBySourceRequest,
  GetNewsNearbyRequest,
  NewsReply,
} from './news.types';

// Generic handler for processing news service calls and formatting responses
async function handleRequest(req: FastifyRequest, reply: FastifyReply, serviceCall: Promise<any>, action: string) {
  try {
    const { articles, total } = await serviceCall;
    const { page = 1, limit = 5 } = req.query as any;

    if (!articles || articles.length === 0) {
      return reply.code(404).send({
        message: "No data found for current input, try again with different input parameters",
        metadata: {
          query: req.query,
          total: 0,
          page: Number(page),
          limit: Number(limit),
          totalPages: 0
        }
      });
    }

    const metadata = {
      query: req.query,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
    
    return reply.send({ metadata, articles });
  } catch (e) {
    req.log.error(e, `Error getting news by ${action}`);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

// Handler for fetching news by category
export async function getNewsByCategoryHandler(req: GetNewsByCategoryRequest, reply: NewsReply) {
    const { category, page, limit } = req.query;
    const safePage = page !== undefined ? Number(page) : 1;
    const safeLimit = limit !== undefined ? Number(limit) : 5;
    return handleRequest(req, reply, newsService.getByCategory(category, safePage, safeLimit), 'category');
}

// Handler for fetching news by minimum relevance score
export async function getNewsByScoreHandler(req: GetNewsByScoreRequest, reply: NewsReply) {
    const { min_score, page, limit } = req.query;
    const safePage = page !== undefined ? Number(page) : 1;
    const safeLimit = limit !== undefined ? Number(limit) : 5;
    return handleRequest(req, reply, newsService.getByScore(min_score, safePage, safeLimit), 'score');
}

// Handler for fetching news by search query
export async function getNewsBySearchHandler(req: GetNewsBySearchRequest, reply: NewsReply) {
    const { q, page, limit } = req.query;
    const safePage = page !== undefined ? Number(page) : 1;
    const safeLimit = limit !== undefined ? Number(limit) : 5;
    return handleRequest(req, reply, newsService.getBySearchQuery(q, safePage, safeLimit), 'search');
}

// Handler for fetching news by source
export async function getNewsBySourceHandler(req: GetNewsBySourceRequest, reply: NewsReply) {
    const { source, page, limit } = req.query;
    const safePage = page !== undefined ? Number(page) : 1;
    const safeLimit = limit !== undefined ? Number(limit) : 5;
    return handleRequest(req, reply, newsService.getBySource(source, safePage, safeLimit), 'source');
}

// Handler for fetching nearby news articles
export async function getNewsNearbyHandler(req: GetNewsNearbyRequest, reply: NewsReply) {
  const { lat, lon, radius = 10, page, limit } = req.query;
  const safePage = page !== undefined ? Number(page) : 1;
  const safeLimit = limit !== undefined ? Number(limit) : 5;
  return handleRequest(req, reply, newsService.getNearby(lat, lon, radius, safePage, safeLimit), 'nearby');
}