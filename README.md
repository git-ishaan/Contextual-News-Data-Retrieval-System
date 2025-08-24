# InShort News Backend

A modern, high-performance news aggregation and personalization backend service built with TypeScript, Fastify, and Prisma. The architecture is language-agnostic and can be implemented in any backend stack.

## 🚀 Tech Stack

Current Implementation:
- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify (chosen for its high performance and low overhead)
- **Database**: PostgreSQL with PostGIS extension
- **ORM**: Prisma
- **Caching**: Redis with Geospatial Clustering
- **AI Integration**: Google Gemini
- **API Documentation**: Swagger/OpenAPI
- **Authentication**: JWT
- **Containerization**: Docker

Note: While this implementation uses Fastify and TypeScript, the architecture is designed to be stack-agnostic. The same project structure, layers, and patterns can be implemented using:
- Java with Spring Boot
- Go with Gin/Echo
- Python with FastAPI
- Any other modern backend stack

The core architectural principles, folder structure, and separation of concerns remain the same regardless of the implementation language.

## 📁 Project Structure

```
backend/
├── prisma/              # Database schema and migrations
├── src/
│   ├── app.ts          # Main application setup
│   ├── server.ts       # Server initialization
│   ├── config/         # Configuration management
│   ├── core/           # Core functionality
│   │   ├── adapters/   # External service adapters
│   │   ├── logger/     # Logging setup
│   │   └── plugins/    # Fastify plugins
│   ├── modules/        # Feature modules
│   │   ├── auth/       # Authentication
│   │   └── news/       # News management
│   ├── scripts/        # Utility scripts
│   └── utils/          # Helper functions
```

## 🔑 Key Features

1. **Geo-Spatial News**: Location-based news filtering using PostGIS
2. **AI-Powered**: Integration with Google Gemini for content enhancement
3. **User Authentication**: Secure JWT-based authentication
4. **Caching**: Redis-based caching for improved performance
5. **API Documentation**: Auto-generated Swagger documentation
6. **Event Tracking**: User interaction tracking with geographical data

## 🛠️ Installation & Setup

### Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd inshortbackend
   ```

2. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

3. Configure your environment variables in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   DIRECT_URL="postgresql://user:password@localhost:5432/dbname"
   REDIS_URL="redis://localhost:6379"
   JWT_SECRET="your-secret-key"
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. Run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

### Manual Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Seed the database:
   ```bash
   npm run seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 📚 API Documentation

Once the server is running, access the Swagger documentation at:
- http://localhost:3000/docs

## 📄 Key Files Description

- `src/app.ts`: Main application configuration, middleware setup, and plugin registration
- `src/server.ts`: Server initialization and startup logic
- `prisma/schema.prisma`: Database schema definition with PostGIS extensions
- `src/modules/news/news.service.ts`: Core news service logic including geo-spatial queries
- `src/modules/auth/auth.controller.ts`: Authentication and user management
- `src/core/adapters/llm/gemini.provider.ts`: Google Gemini AI integration
- `src/core/adapters/cache/redis.adapter.ts`: Redis caching implementation
- `src/scripts/seed.ts`: Database seeding script for initial data

## 🔄 Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build the TypeScript project
- `npm start`: Start production server
- `npm run seed`: Run database seeding script

## 🚀 Production Deployment

The project includes a `render.yaml` configuration for easy deployment on Render.com. Make sure to:

1. Set up all required environment variables in your production environment
2. Ensure PostgreSQL instance has PostGIS extension enabled
3. Configure Redis instance for caching
4. Set up proper security measures (rate limiting, CORS, etc.)

## 📝 Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_URL`: Direct PostgreSQL connection (for Prisma)
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `GEMINI_API_KEY`: Google Gemini API key
- `PORT`: Server port (default: 3000)

## 📈 Features in Detail

### Database Optimizations
- Vector-based search implementation instead of traditional LIKE queries for superior performance
- Heavy calculations offloaded to database using materialized views and pg_cron
- PostGIS spatial indexing for location-based queries
- Automated view refreshes using pg_cron for maintaining data freshness

### Geo-Spatial Capabilities
- News articles are tagged with geographical coordinates
- User events are tracked with location data
- Proximity-based news recommendations
- PostGIS spatial queries for efficient location-based filtering
- Geospatial clustering for optimized caching and content delivery

### Caching Strategy
- Geospatial cluster-based caching for location-aware content delivery
- Redis caching with spatial index support
- Cached user preferences and authentication tokens
- Optimized query results caching
- Hierarchical caching based on geographical regions

### AI Integration
- Google Gemini for content analysis
- Smart news categorization
- Relevance scoring for articles

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting and CORS protection

