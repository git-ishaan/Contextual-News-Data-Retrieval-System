import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { pinoConfig } from './core/logger'; // Import the config, not the logger instance
import { newsRoutes } from './modules/news/news.routes';
import { authRoutes } from './modules/auth/auth.routes';
import fastifyJwt from '@fastify/jwt';
import { env } from './config';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';

// Augment Fastify types for JWT
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      username: string;
    };
  }
}

export async function buildServer() {
  // Correctly initialize with logger config and TypeBox provider
  const app = Fastify({
    logger: pinoConfig,
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Swagger registration
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Building a Contextual News Data Retrieval System',
        description: 'API for fetching and enriching news data.',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  app.register(fastifySwaggerUI, {
    routePrefix: '/docs',
  });

  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  // Authentication decorator
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ message: 'Authentication required' });
    }
  });

  app.register(fastifyCors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // Register routes
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(newsRoutes, { prefix: '/api/v1/news' });

  return app;
}