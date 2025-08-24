import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import { hashPassword } from '../utils/hash';
import { logger } from '../core/logger';

// Initialize Prisma client for DB operations
const prisma = new PrismaClient();

// Type definition for news article JSON structure
interface NewsArticleJson {
  id: string;
  title: string;
  description: string;
  url: string;
  publication_date: string;
  source_name: string;
  category: string[];
  relevance_score: number;
  latitude: number;
  longitude: number;
}

// Main seeding function
async function main() {
  logger.info('Seeding database...');
  
  // Seed admin user if not present
  const adminUsername = 'admin';
  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    const hashedPassword = await hashPassword('admin@123');
    await prisma.user.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
      },
    });
    logger.info('Admin user created.');
  } else {
    logger.info('Admin user already exists.');
  }

  // Seed articles if table is empty
  const articlesCount = await prisma.article.count();
  if (articlesCount > 0) {
    logger.info(`Articles table already has ${articlesCount} records. Skipping seeding.`);
  } else {
    // Read articles from JSON file
    const filePath = path.join(process.cwd(), 'news_data.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const articles: NewsArticleJson[] = JSON.parse(fileContent);

    // Prepare articles for insertion
    const articlesToCreate = articles.map(article => ({
      ...article,
      publication_date: new Date(article.publication_date),
    }));
    
    logger.info(`Preparing to seed ${articlesToCreate.length} articles...`);
    await prisma.article.createMany({
      data: articlesToCreate,
      skipDuplicates: true,
    });

    logger.info('Updating geospatial data...');
    // Update location column using PostGIS for all articles
    await prisma.$executeRaw`
      UPDATE "Article"
      SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
      WHERE location IS NULL;
    `;

    logger.info(`Seeded ${articles.length} articles and updated locations.`);
  }
}

// Run the seeding script and handle errors/cleanup
main()
  .catch((e) => {
    logger.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    logger.info('Database seeding finished.');
  });
