import { FastifyInstance } from 'fastify';
import { loginHandler } from './auth.controller';
import { LoginSchema, LoginResponseSchema } from './auth.schema';
import { Type } from '@sinclair/typebox';

// Registers authentication routes
export async function authRoutes(server: FastifyInstance) {
  server.post(
    '/login',
    {
      schema: {
        tags: ['Auth'], // OpenAPI tag for grouping
        summary: 'Login to get a JWT token', // Route summary for docs
        body: LoginSchema, // Request body validation schema
        response: {
          200: LoginResponseSchema, // Success response schema
          401: Type.Object({ message: Type.String() }), // Unauthorized response schema
        },
      },
    },
    loginHandler // Handler for login
  );
}