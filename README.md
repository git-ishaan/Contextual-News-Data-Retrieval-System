# InShort News Backend - On-Premise Docker Solution

A modern, high-performance news aggregation and personalization backend service built with TypeScript, Fastify, and Prisma. This version provides a complete **on-premise solution** with containerized PostgreSQL (with PostGIS and pg_cron) and Redis, requiring minimal external dependencies.

## 🚀 Tech Stack

**Complete Docker-Based Architecture:**
- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify (high performance, low overhead)
- **Database**: PostgreSQL 17 with PostGIS 3.5 and pg_cron (containerized)
- **ORM**: Prisma with automatic schema deployment
- **Caching**: Redis with geospatial clustering (containerized)
- **AI Integration**: Google Gemini API
- **API Documentation**: Swagger/OpenAPI
- **Authentication**: JWT
- **Containerization**: Full Docker Compose orchestration

## 📁 Project Structure

```
backend/
├── docker-compose.yml      # Complete multi-service orchestration
├── Dockerfile             # Backend service container
├── Dockerfile.db          # Custom PostgreSQL + PostGIS + pg_cron
├── init-extensions.sql    # Database extensions initialization
├── news_data.json         # Sample news data for seeding
├── prisma/
│   └── schema.prisma      # Database schema with PostGIS types
├── src/
│   ├── app.ts            # Main application setup
│   ├── server.ts         # Server initialization
│   ├── config/
│   │   └── index.ts      # Configuration management
│   ├── core/
│   │   ├── adapters/     # External service adapters
│   │   │   ├── cache/    # Redis adapter with geospatial support
│   │   │   ├── db/       # Database adapters and Prisma client
│   │   │   └── llm/      # Google Gemini integration
│   │   ├── logger/       # Structured logging
│   │   └── plugins/      # Fastify plugins (Swagger, etc.)
│   ├── modules/          # Feature modules
│   │   ├── auth/         # JWT authentication
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.schema.ts
│   │   └── news/         # News management with geospatial queries
│   │       ├── news.controller.ts
│   │       ├── news.repository.ts
│   │       ├── news.routes.ts
│   │       ├── news.schema.ts
│   │       ├── news.service.ts
│   │       └── news.types.ts
│   ├── scripts/
│   │   └── seed.ts       # Database seeding with news data
│   └── utils/
│       ├── geo.ts        # Geospatial utilities
│       └── hash.ts       # Password hashing utilities
└── .env.example          # Environment template
```

## 🔑 Key Features

### 🌍 **Complete On-Premise Solution**
- **Zero external database dependencies** - PostgreSQL with PostGIS runs in Docker
- **Integrated caching** - Redis container included
- **One-command deployment** - Complete stack with `docker-compose up`
- **Data persistence** - Volumes for database and cache data

### 🗺️ **Advanced Geospatial Capabilities**
- **PostGIS-powered** location-based news filtering
- **Spatial indexing** with GIST indexes for fast geo queries
- **User event tracking** with geographical coordinates
- **Proximity-based** content recommendations

### 🤖 **AI Integration**
- **Google Gemini** for content analysis and categorization
- **Automated relevance scoring** for articles
- **Smart content enhancement** and summarization

### ⚡ **Performance Optimizations**
- **Vector-based search** instead of traditional LIKE queries
- **pg_cron scheduled jobs** for automated database maintenance
- **Geospatial clustering** for optimized caching
- **Redis caching** with spatial indexing support


## Advanced Features

This project incorporates several advanced features to deliver relevant, real-time news with high performance and efficiency.

### Sophisticated Ranking Algorithm

The system utilizes a sophisticated ranking algorithm to surface the most relevant and trending news articles. The core of this algorithm is a **blended score** that combines an article's intrinsic popularity with its proximity to the user.

-   **Trending Score**: A pre-calculated `trending_score` reflects the overall popularity of an article based on user engagement metrics like views and clicks.
-   **Distance Decay**: To personalize the trending results, an exponential decay function is applied based on the user's location. This ensures that articles closer to the user are given a higher weight, providing localized and relevant content.

The final ranking is determined by the following formula, which elegantly balances global popularity with local relevance:

`blended_score = trending_score * EXP(-distance / 50000)`

### Performance Optimization

To handle the demanding database queries required for real-time news ranking, the system employs several optimization strategies:

-   **Materialized Views**: The complex calculation of the `trending_score` is pre-computed and stored in a **materialized view** named `TrendingArticles`. This avoids costly computations on every request, dramatically speeding up query times.
-   **Automated Refresh with pg_cron**: The materialized view is automatically refreshed every 5 minutes using **pg_cron**, a cron-based job scheduler for PostgreSQL. This ensures that the trending data remains fresh and up-to-date without manual intervention.

### Caching Strategy

To further enhance performance and reduce database load, the system implements a multi-layered caching strategy:

-   **Geospatial Caching**: Trending news and Large Language Model (LLM) queries are cached based on a **geospatial key**. This key is generated by rounding the latitude and longitude to create grid cells of approximately 1.1km, which is an effective "neighborhood" level for caching. This ensures that users in the same geographical area receive cached results, reducing redundant computations.
-   **Configurable TTL**: All cached data has a configurable Time-To-Live (TTL), allowing for fine-tuned control over how long data is stored before being refreshed.



## 🛠️ Installation & Setup

### Prerequisites
- Docker and Docker Compose installed
- Git for cloning the repository

### Quick Start (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd inshortbackendfinal/backend
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure your environment variables in `.env`:**
   ```env
   # Only these two keys need to be configured:
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   GEMINI_API_KEY="your-google-gemini-api-key"
   
   # Database and Redis are automatically configured via Docker Compose
   # No need to modify these unless you want custom credentials:
   # DATABASE_URL and REDIS_URL are set automatically in docker-compose.yml
   ```

4. **Start the complete stack:**
   ```bash
   docker-compose up --build
   ```

That's it! 🎉 The entire system will be running with:
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs
- **PostgreSQL**: localhost:5432 (user: myuser, password: mypassword, db: mydatabase)
- **Redis**: localhost:6379

## 🐳 Docker Services

The `docker-compose.yml` orchestrates three services:

### 1. **Database Service (`db`)**
- **Custom PostgreSQL 17** with PostGIS 3.5 and pg_cron
- **Automated extensions** installation on first run
- **Health checks** to ensure proper startup sequence
- **Persistent data** via Docker volumes

### 2. **Cache Service (`cache`)**
- **Redis 8.2** with additional modules (RedisBloom, RedisSearch, etc.)
- **Ready for geospatial** clustering and advanced caching
- **High-performance** in-memory operations

### 3. **Backend Service (`backend`)**
- **TypeScript/Node.js** application
- **Automatic Prisma** client generation and schema deployment
- **Database seeding** with sample news data
- **Health-dependent startup** (waits for database to be ready)

## 📚 API Documentation

Once the system is running, access the interactive Swagger documentation:
- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI Spec**: http://localhost:3000/docs/json

## � Available Commands

### Docker Commands (Primary)
```bash
# Start the complete stack
docker-compose up --build

# Start in background (detached mode)
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# View logs
docker-compose logs -f backend
```

### Development Commands (Optional)
If you want to develop without Docker:
```bash
npm install          # Install dependencies
npm run dev          # Development with hot reload
npm run build        # Build TypeScript
npm start           # Production start
npm run seed        # Manual database seeding
```

## � Database Features

### **Automatic Setup**
- **Schema deployment** via Prisma on container startup
- **Extensions installation** (PostGIS, pg_cron) automatically
- **Sample data seeding** from `news_data.json`
- **No manual migration** required

### **Advanced Capabilities**
```sql
-- Geospatial queries supported out of the box
SELECT * FROM "Article" 
WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, 1000);

-- Automated jobs via pg_cron
SELECT cron.schedule('cleanup-old-events', '0 2 * * *', 
  'DELETE FROM "UserEvent" WHERE "createdAt" < NOW() - INTERVAL ''30 days'';');
```

### **Data Models**
- **Users**: Authentication with hashed passwords
- **Articles**: News with geospatial coordinates and full-text search
- **UserEvents**: Interaction tracking with location data

## � Configuration

### **Environment Variables**
Only two variables need manual configuration:

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT token signing | ✅ Yes |
| `GEMINI_API_KEY` | Google Gemini API key for AI features | ✅ Yes |

All other variables (database, Redis URLs) are automatically configured via Docker Compose.

### **Docker Compose Configuration**
The system automatically configures:
- **Database connection**: `postgresql://myuser:mypassword@db:5432/mydatabase`
- **Redis connection**: `redis://cache:6379`
- **Service dependencies**: Backend waits for healthy database
- **Port mapping**: API on 3000, DB on 5432, Redis on 6379

## 🚀 Production Deployment

For production deployment:

1. **Update credentials** in docker-compose.yml (database passwords, etc.)
2. **Set strong JWT_SECRET** in .env file
3. **Configure reverse proxy** (nginx, Traefik) for HTTPS
4. **Set up backups** for the postgres_data volume
5. **Monitor logs** and set up log rotation

## ✨ Key Advantages

### **🏠 Complete On-Premise Solution**
- No external database or cache services required
- Full control over your data and infrastructure
- Reduced operational costs and dependencies

### **🔧 Zero Configuration**
- Pre-configured database with all required extensions
- Automatic service orchestration and health checks
- Sample data included for immediate testing

### **📈 Production Ready**
- Optimized PostgreSQL with PostGIS for geospatial queries
- Redis caching with advanced modules
- Comprehensive logging and health monitoring
- Scalable architecture with container orchestration

### **🛠️ Developer Friendly**
- Hot reload for development
- Interactive API documentation
- Comprehensive error handling and logging
- Type-safe development with TypeScript and Prisma


