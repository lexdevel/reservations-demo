import { buildFederatedSchema } from '@apollo/federation';
import { ApolloServer, gql } from 'apollo-server';
import { readFileSync } from 'fs';

const typeDefs = gql(readFileSync('./schema.graphql').toString('utf-8'));
const resolvers = {
  Query: {
    users: () => users,
  },
  User: {
    __resolveReference: reference => users.find(user => user.id === reference.id),
  }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([
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

// Demo data...
const users = [
  {
    id: '1',
    username: 'jdoe_m',
    fullname: 'John Doe'
  },
  {
    id: '2',
    username: 'jdoe_f',
    fullname: 'Jane Doe'
  }
];
