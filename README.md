# InShort News Backend - Cloud-Native Solution

A modern, high-performance news aggregation and personalization backend service built with TypeScript, Fastify, and Prisma. This version provides a **cloud-native solution** using managed services like Supabase PostgreSQL and Upstash Redis, optimized for production deployment on platforms like Render.com.

## 🚀 Tech Stack

**Cloud-Native Architecture:**
- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify (high performance, low overhead)
- **Database**: Supabase PostgreSQL with PostGIS extension (managed)
- **ORM**: Prisma with automatic migrations
- **Caching**: Upstash Redis with geospatial clustering (managed)
- **AI Integration**: Google Gemini API
- **API Documentation**: Swagger/OpenAPI
- **Authentication**: JWT
- **Deployment**: Docker with cloud platform integration (Render.com ready)


Note: While this implementation uses Fastify and TypeScript, the architecture is designed to be stack-agnostic. The same project structure, layers, and patterns can be implemented using:
- Java with Spring Boot
- Go with Gin/Echo
- Python with FastAPI
- Any other modern backend stack

The core architectural principles, folder structure, and separation of concerns remain the same regardless of the implementation language.



## 📁 Project Structure

```
backend/
├── render.yaml            # Cloud deployment configuration
├── Dockerfile            # Production container build
├── news_data.json        # Sample news data for seeding
├── prisma/
│   └── schema.prisma     # Database schema with PostGIS types
├── src/
│   ├── app.ts           # Main application setup
│   ├── server.ts        # Server initialization
│   ├── config/
│   │   └── index.ts     # Configuration management
│   ├── core/
│   │   ├── adapters/    # External service adapters
│   │   │   ├── cache/   # Redis adapter with geospatial support
│   │   │   ├── db/      # Database adapters and Prisma client
│   │   │   └── llm/     # Google Gemini integration
│   │   ├── logger/      # Structured logging
│   │   └── plugins/     # Fastify plugins (Swagger, etc.)
│   ├── modules/         # Feature modules
│   │   ├── auth/        # JWT authentication
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.schema.ts
│   │   └── news/        # News management with geospatial queries
│   │       ├── news.controller.ts
│   │       ├── news.repository.ts
│   │       ├── news.routes.ts
│   │       ├── news.schema.ts
│   │       ├── news.service.ts
│   │       └── news.types.ts
│   ├── scripts/
│   │   └── seed.ts      # Database seeding with news data
│   └── utils/
│       ├── geo.ts       # Geospatial utilities
│       └── hash.ts      # Password hashing utilities
└── .env.example         # Environment template
```

## 🔑 Key Features

### ☁️ **Cloud-Native Solution**
- **Managed PostgreSQL** - Supabase with built-in PostGIS support
- **Managed Redis** - Upstash Redis with global edge locations
- **Auto-scaling** - Cloud platform handles scaling automatically
- **Zero infrastructure management** - Focus on code, not servers

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
- Node.js 18+ installed
- Access to Supabase (for PostgreSQL)
- Access to Upstash (for Redis)
- Google Gemini API key

### Quick Start (Local Development)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd inshortbackendfinal/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure your environment variables in `.env`:**
   ```env
   # Database - Get from Supabase project settings
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[SUPABASE-HOST]:5432/postgres"
   DIRECT_URL="postgresql://postgres.[SUPABASE-HOST]:[PASSWORD]@[POOLER-HOST]:5432/postgres"
   
   # Cache - Get from Upstash Redis dashboard
   REDIS_URL="rediss://default:[PASSWORD]@[UPSTASH-HOST]:6379"
   
   # Required API keys
   GEMINI_API_KEY="your-google-gemini-api-key"
   JWT_SECRET="your-super-secret-jwt-key"
   
   # Server configuration
   PORT=3000
   HOST=0.0.0.0
   ```

5. **Set up the database:**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Deploy schema to Supabase
   npx prisma db push
   
   # Seed with sample data
   npm run seed
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

The API will be running at:
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs

## ☁️ Cloud Services Setup

### **1. Supabase PostgreSQL Setup**

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **Database**
3. Find your connection string and add it to `.env`
4. **Enable PostGIS extension**:
   ```sql
   -- Run in Supabase SQL Editor
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

### **2. Upstash Redis Setup**

1. Create a database at [upstash.com](https://upstash.com)
2. Copy the **Redis URL** to your `.env` file
3. Optionally enable **global replication** for better performance

### **3. Google Gemini API**

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `GEMINI_API_KEY`

## 🚀 Production Deployment

### **Deploy to Render.com (Recommended)**

This project includes a `render.yaml` configuration for one-click deployment:

1. **Fork this repository** to your GitHub account

2. **Connect to Render.com:**
   - Link your GitHub repository
   - Render will auto-detect the `render.yaml` configuration

3. **Configure environment variables** in Render dashboard:
   ```env
   DATABASE_URL=<your-supabase-connection-string>
   DIRECT_URL=<your-supabase-direct-connection>
   REDIS_URL=<your-upstash-redis-url>
   GEMINI_API_KEY=<your-gemini-api-key>
   JWT_SECRET=<your-production-jwt-secret>
   NODE_ENV=production
   ```

4. **Deploy** - Render will automatically build and deploy your application

### **Manual Docker Deployment**

```bash
# Build production image
docker build -t news-backend .

# Run with environment variables
docker run -d -p 3000:3000 \
  -e DATABASE_URL="your-supabase-url" \
  -e REDIS_URL="your-upstash-url" \
  -e GEMINI_API_KEY="your-api-key" \
  -e JWT_SECRET="your-jwt-secret" \
  news-backend
```

## 📚 API Documentation

Once the system is running, access the interactive Swagger documentation:
- **Swagger UI**: http://localhost:3000/docs (or your deployed URL)
- **OpenAPI Spec**: http://localhost:3000/docs/json

## 🔄 Available Commands

### Development Commands
```bash
npm run dev          # Development with hot reload
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server
npm run seed        # Seed database with sample data

# Prisma commands
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma studio    # Open Prisma Studio (database browser)
```

## 📊 Database Features

### **Automatic Setup**
- **Prisma migrations** automatically applied
- **PostGIS extensions** enabled in Supabase
- **Sample data seeding** from `news_data.json`
- **Connection pooling** via Supabase built-in pooler

### **Advanced Capabilities**
```sql
-- Geospatial queries supported out of the box
SELECT * FROM "Article" 
WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, 1000);

-- Full-text search with vector indexing
SELECT * FROM "Article" 
WHERE search_vector @@ to_tsquery('english', 'technology & news');

-- Automated jobs via pg_cron (enabled in Supabase)
SELECT cron.schedule('cleanup-old-events', '0 2 * * *', 
  'DELETE FROM "UserEvent" WHERE "createdAt" < NOW() - INTERVAL ''30 days'';');
```

### **Data Models**
- **Users**: Authentication with hashed passwords
- **Articles**: News with geospatial coordinates and full-text search
- **UserEvents**: Interaction tracking with location data

## 🔧 Configuration

### **Environment Variables**

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | ✅ Yes | `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres` |
| `DIRECT_URL` | Direct database connection for migrations | ✅ Yes | `postgresql://postgres.[PROJECT]:[PASSWORD]@[HOST]:5432/postgres` |
| `REDIS_URL` | Upstash Redis connection string | ✅ Yes | `rediss://default:[PASSWORD]@[HOST]:6379` |
| `GEMINI_API_KEY` | Google Gemini API key | ✅ Yes | `AIzaSy...` |
| `JWT_SECRET` | Secret key for JWT token signing | ✅ Yes | `your-secret-key` |
| `PORT` | Server port | ❌ No | `3000` (default) |
| `HOST` | Server host | ❌ No | `0.0.0.0` (default) |

## ✨ Key Advantages

### **☁️ Cloud-Native Benefits**
- **Managed infrastructure** - No server maintenance required
- **Global edge locations** - Upstash Redis provides worldwide performance
- **Auto-scaling** - Supabase and cloud platforms handle traffic spikes
- **Built-in monitoring** - Cloud services provide metrics and alerts

### **🔧 Zero Infrastructure Management**
- **Supabase** handles database backups, updates, and scaling
- **Upstash** manages Redis clusters and replication
- **Render.com** provides auto-deployment and SSL certificates
- **Focus on features** instead of DevOps

### **📈 Production Ready**
- **Connection pooling** with Supabase built-in pooler
- **Redis clustering** with Upstash global replication
- **Comprehensive logging** and error tracking
- **Health checks** and monitoring endpoints
- **CORS and security** headers configured

### **💰 Cost Effective**
- **Pay-as-you-scale** pricing model
- **Free tiers available** for development and small projects
- **No infrastructure overhead** costs
- **Predictable billing** with managed services

### **🛠️ Developer Friendly**
- **Hot reload** for development
- **Interactive API documentation** with Swagger
- **Type-safe development** with TypeScript and Prisma
- **One-click deployment** with Render.com integration

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
- CORS protection



