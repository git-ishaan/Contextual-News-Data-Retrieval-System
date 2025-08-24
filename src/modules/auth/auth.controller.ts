import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { LoginInput } from './auth.schema';
import { verifyPassword } from '../../utils/hash';
import { prisma } from '../../core/adapters/db/client';

// Handles user login and JWT token generation
export async function loginHandler(
  this: FastifyInstance,
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) {
  const { username, password } = request.body;

  try {
    // Find user by username
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return reply.code(401).send({ message: 'Invalid username or password' });
    }

    // Verify password
    const isPasswordCorrect = await verifyPassword(password, user.password);
    if (!isPasswordCorrect) {
      return reply.code(401).send({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = this.jwt.sign({ id: user.id, username: user.username });

    // Send access token in response
    return reply.code(200).send({ accessToken: token });

  } catch (error) {
    // Log and handle errors
    request.log.error(error, "Error during login");
    return reply.code(500).send({ message: "Internal Server Error" });
  }
}