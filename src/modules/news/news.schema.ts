import { Type, Static } from '@sinclair/typebox';

// Article schema definition for validation and docs
const ArticleSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    title: Type.String(),
    description: Type.String(),
    url: Type.String({ format: 'uri' }),
    publication_date: Type.String({ format: 'date-time' }),
    source_name: Type.String(),
    category: Type.Array(Type.String()),
    relevance_score: Type.Number(),
    latitude: Type.Number(),
    longitude: Type.Number(),
});

// Pagination query schema for consistent paging
const PaginationQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 5 })),
});

// Metadata schema for paginated responses
const MetadataSchema = Type.Object({
    query: Type.Any(),
    total: Type.Integer(),
    page: Type.Integer(),
    limit: Type.Integer(),
    totalPages: Type.Integer(),
});

// Response schema for articles with metadata
export const ArticlesResponseSchema = Type.Object({
    metadata: MetadataSchema,
    articles: Type.Array(ArticleSchema),
});

// --- Query Schemas with Validation ---

// Query schema for category-based news
export const CategoryQuerySchema = Type.Intersect([
    PaginationQuerySchema,
    Type.Object({
        category: Type.String({ minLength: 1 }),
    })
]);
export type CategoryQuery = Static<typeof CategoryQuerySchema>;

// Query schema for minimum relevance score
export const ScoreQuerySchema = Type.Intersect([
    PaginationQuerySchema,
    Type.Object({
        min_score: Type.Number({ minimum: 0, maximum: 1 }),
    })
]);
export type ScoreQuery = Static<typeof ScoreQuerySchema>;

// Query schema for search by keyword
export const SearchQuerySchema = Type.Intersect([
    PaginationQuerySchema,
    Type.Object({
        q: Type.String({ minLength: 1 }),
    })
]);
export type SearchQuery = Static<typeof SearchQuerySchema>;

// Query schema for source-based news
export const SourceQuerySchema = Type.Intersect([
    PaginationQuerySchema,
    Type.Object({
        source: Type.String({ minLength: 1 }),
    })
]);
export type SourceQuery = Static<typeof SourceQuerySchema>;

// Query schema for nearby news search
export const NearbyQuerySchema = Type.Intersect([
    PaginationQuerySchema,
    Type.Object({
        lat: Type.Number({ minimum: -90, maximum: 90 }),
        lon: Type.Number({ minimum: -180, maximum: 180 }),
        radius: Type.Optional(Type.Integer({ minimum: 1, default: 10 })),
    })
]);
export type NearbyQuery = Static<typeof NearbyQuerySchema>;

// --- AI/Natural Language Query Schemas ---

// Schema for AI-powered news query request
export const QueryRequestSchema = Type.Object({
  query: Type.String({ minLength: 1 }),
  lat: Type.Optional(Type.Number({ minimum: -90, maximum: 90 })),
  lon: Type.Optional(Type.Number({ minimum: -180, maximum: 180 })),
});
export type QueryRequest = Static<typeof QueryRequestSchema>;

// Article schema with LLM summary for enriched responses
const ArticleWithSummarySchema = Type.Intersect([
  ArticleSchema,
  Type.Object({
    llm_summary: Type.String(),
  }),
]);

// Response schema for enriched articles (AI summaries)
export const EnrichedArticlesResponseSchema = Type.Object({
  articles: Type.Array(ArticleWithSummarySchema),
});

// --- Event and Trending Schemas ---

// Schema for logging user events (view/click)
export const EventRequestSchema = Type.Object({
  eventType: Type.Union([Type.Literal('view'), Type.Literal('click')]),
  articleId: Type.String({ format: 'uuid' }),
  userId: Type.String(),
  lat: Type.Number({ minimum: -90, maximum: 90 }),
  lon: Type.Number({ minimum: -180, maximum: 180 }),
});
export type EventRequest = Static<typeof EventRequestSchema>;

// Response schema for event logging
export const EventResponseSchema = Type.Object({
  message: Type.String(),
});

// Query schema for trending news by location
export const TrendingQuerySchema = Type.Object({
  lat: Type.Number({ minimum: -90, maximum: 90 }),
  lon: Type.Number({ minimum: -180, maximum: 180 }),
  limit: Type.Optional(Type.Integer({ minimum: 1, default: 5 })),
});
export type TrendingQuery = Static<typeof TrendingQuerySchema>;