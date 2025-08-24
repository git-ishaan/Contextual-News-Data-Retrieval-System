import { FastifyInstance } from 'fastify';
import {
    getNewsByCategoryHandler,
    getNewsByScoreHandler,
    getNewsBySearchHandler,
    getNewsBySourceHandler,
    getNewsNearbyHandler,
} from './news.controller';
import {
  ArticlesResponseSchema, CategoryQuerySchema, NearbyQuerySchema, ScoreQuerySchema, SearchQuerySchema, SourceQuerySchema,
  CategoryQuery, ScoreQuery, SearchQuery, SourceQuery, NearbyQuery,
  QueryRequestSchema, EnrichedArticlesResponseSchema, EventRequestSchema, EventResponseSchema, TrendingQuerySchema,
  QueryRequest, EventRequest, TrendingQuery
} from './news.schema';
import { newsService } from './news.service';

// Registers all news-related routes with validation and authentication
export async function newsRoutes(server: FastifyInstance) {
  // Global preHandler hook for the news routes to trim string parameters
  const trimStringParams = async (request: any) => {
    // Trim query parameters
    if (request.query) {
      Object.keys(request.query).forEach(key => {
        if (typeof request.query[key] === 'string') {
          request.query[key] = request.query[key].trim();
        }
      });
    }
    // Trim body parameters
    if (request.body && typeof request.body === 'object') {
      Object.keys(request.body).forEach(key => {
        if (typeof request.body[key] === 'string') {
          request.body[key] = request.body[key].trim();
        }
      });
    }
  };
  // Route: Get news by category
  server.get<{ Querystring: CategoryQuery }>(
    '/category',
    {
      schema: {
        tags: ['News'], summary: 'Get news by category', querystring: CategoryQuerySchema,
        security: [{ bearerAuth: [] }], response: { 200: ArticlesResponseSchema },
      },
      onRequest: [server.authenticate],
      preHandler: [trimStringParams],
    },
    getNewsByCategoryHandler
  );

  // Route: Get news by minimum relevance score
  server.get<{ Querystring: ScoreQuery }>(
    '/score',
    {
      schema: {
        tags: ['News'], summary: 'Get news above a minimum relevance score', querystring: ScoreQuerySchema,
        security: [{ bearerAuth: [] }], response: { 200: ArticlesResponseSchema },
      },
      onRequest: [server.authenticate],
      preHandler: [trimStringParams],
    },
    getNewsByScoreHandler
  );

  // Route: Search news by query string
  server.get<{ Querystring: SearchQuery }>(
    '/search',
    {
      schema: {
        tags: ['News'], summary: 'Search for news by a query string', querystring: SearchQuerySchema,
        security: [{ bearerAuth: [] }], response: { 200: ArticlesResponseSchema },
      },
      onRequest: [server.authenticate],
      preHandler: [trimStringParams],
    },
    getNewsBySearchHandler
  );

  // Route: Get news by source name
  server.get<{ Querystring: SourceQuery }>(
    '/source',
    {
      schema: {
        tags: ['News'], summary: 'Get news by source name', querystring: SourceQuerySchema,
        security: [{ bearerAuth: [] }], response: { 200: ArticlesResponseSchema },
      },
      onRequest: [server.authenticate],
      preHandler: [trimStringParams],
    },
    getNewsBySourceHandler
  );

  // Route: Get news within a radius of a location
  server.get<{ Querystring: NearbyQuery }>(
    '/nearby',
    {
      schema: {
        tags: ['News'], summary: 'Get news within a radius of a location', querystring: NearbyQuerySchema,
        security: [{ bearerAuth: [] }], response: { 200: ArticlesResponseSchema },
      },
      onRequest: [server.authenticate],
      preHandler: [trimStringParams],
    },
    getNewsNearbyHandler
  );

  // Route: AI-powered natural language news query
  server.post<{ Body: QueryRequest }>(
    '/query',
    {
      schema: {
        tags: ['News (AI-Powered)'], summary: 'Process a natural language query for news', body: QueryRequestSchema,
        security: [{ bearerAuth: [] }], response: { 200: EnrichedArticlesResponseSchema },
      },
      onRequest: [server.authenticate],
      preHandler: [trimStringParams],
    },
    async (req, reply) => {
      const { query, lat, lon } = req.body;
      const articles = await newsService.processNaturalLanguageQuery(query, lat, lon);
      
      if (!articles || articles.length === 0) {
        return reply.code(404).send({
          message: "No data found for current input, try again with different input parameters",
          query
        });
      }

      // Responds with articles (no metadata for this endpoint)
      return reply.send({ articles });
    }
  );

  // Route: Get trending news by location
  server.get<{ Querystring: TrendingQuery }>(
    '/trending',
    {
      schema: {
        tags: ['News (AI-Powered)'], summary: 'Get trending news by location', querystring: TrendingQuerySchema,
        security: [{ bearerAuth: [] }], response: { 200: ArticlesResponseSchema },
      },
      onRequest: [server.authenticate],
      preHandler: [trimStringParams],
    },
    async (req, reply) => {
      const { lat, lon, limit = 5 } = req.query;
      const articles = await newsService.getTrending(lat, lon, limit);
      
      if (!articles || articles.length === 0) {
        return reply.code(404).send({
          message: "No trending articles found for the current location, try again with different coordinates or by simulating few user events",
          metadata: {
            query: req.query,
            total: 0,
            page: 1,
            limit: Number(limit),
            totalPages: 0
          }
        });
      }

      // Build metadata for response to match schema
      const metadata = {
        query: req.query,
        total: articles.length,
        page: 1, // No pagination for trending
        limit: articles.length,
        totalPages: 1,
      };
      return reply.send({ metadata, articles });
    }
  );

  // Route: Simulate a user event (view/click)
  server.post<{ Body: EventRequest }>(
    '/events',
    {
      schema: {
        tags: ['Events (Trending Simulation)'], summary: 'Simulate a user event (view/click)', body: EventRequestSchema,
        security: [{ bearerAuth: [] }], response: { 201: EventResponseSchema },
      },
      onRequest: [server.authenticate],
      preHandler: [trimStringParams],
    },
    async (req, reply) => {
      await newsService.createEvent(req.body);
      return reply.code(201).send({ message: 'Event logged' });
    }
  );
}