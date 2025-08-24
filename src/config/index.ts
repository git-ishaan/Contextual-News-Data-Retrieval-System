import dotenv from 'dotenv';
dotenv.config();

// Basic environment variable loading
export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  HOST: process.env.HOST || '0.0.0.0',
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
  JWT_SECRET: process.env.JWT_SECRET!,
};

// A check to ensure critical variables are loaded
if (!env.DATABASE_URL || !env.JWT_SECRET) {
  console.error("FATAL ERROR: DATABASE_URL and JWT_SECRET must be defined in .env");
  process.exit(1);
}