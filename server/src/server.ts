import express from 'express';
import path from 'node:path';
import db from './config/connection.js';
//import routes from './routes/index.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { typeDefs, resolvers } from './schemas/index.js'; // Import your GraphQL schema and resolvers

const app = express();
const PORT = process.env.PORT || 3001;
const httpServer = http.createServer(app);

// Apollo Server setup
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

async function startApolloServer() {
  await server.start();
  await db(); // Connect to the database

  app.use(
    '/graphql',
    cors({
      origin: 'http://localhost:3000', // Allow requests from the client
      credentials: true}),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ req }), // Provide the request to the context
    })
  );

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // if we're in production, serve client/build as static assets
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    app.get('*', (_, res) => {
      res.sendFile(path.join(__dirname, '../client/build/index.html'));
    });
  }

  //app.use(routes);

    httpServer.listen(PORT, () => {
      console.log(`🌍 Now listening on localhost:${PORT}`);
      console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    });
  
}

startApolloServer();