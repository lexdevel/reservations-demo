import { buildSubgraphSchema } from '@apollo/federation';
import { ApolloServer, gql } from 'apollo-server';;
import { readFileSync } from 'fs';

const users = JSON.parse(readFileSync('./users.json').toString('utf-8'));
const typeDefs = gql(readFileSync('./schema.graphql').toString('utf-8'));

const resolvers = {
  Query: {
    users: (parent, args, context, info) => users,
  },
  User: {
    __resolveReference: reference => users.find(user => user.id === reference.id),
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([
    {
      typeDefs,
      resolvers
    }
  ])
});

(async () => {
  const { url } = await server.listen({ port: process.env.PORT });
  console.log(`🚀 Server is ready at ${url}...`);
})();
