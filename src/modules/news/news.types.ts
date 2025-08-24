// src/modules/news/news.types.ts

import { FastifyReply, FastifyRequest } from 'fastify';
import {
  CategoryQuery,
  ScoreQuery,
  SearchQuery,
  SourceQuery,
  NearbyQuery,
} from './news.schema';

// Define explicit types for each request handler
export type GetNewsByCategoryRequest = FastifyRequest<{ Querystring: CategoryQuery }>;
export type GetNewsByScoreRequest = FastifyRequest<{ Querystring: ScoreQuery }>;
export type GetNewsBySearchRequest = FastifyRequest<{ Querystring: SearchQuery }>;
export type GetNewsBySourceRequest = FastifyRequest<{ Querystring: SourceQuery }>;
export type GetNewsNearbyRequest = FastifyRequest<{ Querystring: NearbyQuery }>;

// A generic type for the reply object for consistency
export type NewsReply = FastifyReply;