import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { GraphQLError } from 'graphql';

dotenv.config();

interface JwtPayload {
  _id: unknown;
  username: string;
  email: string;
}

// Updated authenticateToken for GraphQL context
export const authenticateToken = (authHeader: string | undefined): JwtPayload | null => {
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const secretKey = process.env.JWT_SECRET_KEY || '';

    try {
      const decoded = jwt.verify(token, secretKey) as JwtPayload;
      return decoded;
    } catch (err) {
      return null;
    }
  }
  return null;
};

// Express middleware wrapper for authenticateToken, if needed for REST endpoints.
export const authenticateTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    const user = authenticateToken(authHeader);

    if (user) {
        req.user = user;
        return next();
    } else {
        return res.sendStatus(401);
    }
};

// Function for GraphQL resolvers to get user from context.
export const getUserFromContext = (context: { req: Request }): JwtPayload | null => {
  const authHeader = context.req.headers.authorization;
  return authenticateToken(authHeader);
};

// Function to throw GraphQL errors based on authentication status.
export const ensureAuthenticated = (context: { req: Request }) => {
  const user = getUserFromContext(context);
  if (!user) {
    throw new GraphQLError('Unauthenticated', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }
  return user;
};

export const signToken = (username: string, email: string, _id: unknown) => {
  const payload = { username, email, _id };
  const secretKey = process.env.JWT_SECRET_KEY || '';

  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};