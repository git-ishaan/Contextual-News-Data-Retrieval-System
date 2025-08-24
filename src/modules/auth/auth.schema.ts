import { Static, Type } from '@sinclair/typebox';

// Schema for login request body validation
export const LoginSchema = Type.Object(
  {
    username: Type.String(),
    password: Type.String(),
  },
  { $id: 'LoginSchema' }
);

// Schema for login response validation
export const LoginResponseSchema = Type.Object(
  {
    accessToken: Type.String(),
  },
  { $id: 'LoginResponseSchema' }
);

// Type for login input derived from schema
export type LoginInput = Static<typeof LoginSchema>;