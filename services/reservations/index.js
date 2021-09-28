import { buildFederatedSchema } from '@apollo/federation';
import { ApolloServer, gql } from 'apollo-server';
import { ApolloError } from 'apollo-server-errors';
import { Mutex } from 'async-mutex';
import { readFileSync } from 'fs';

const typeDefs = gql(readFileSync('./schema.graphql').toString('utf-8'));
const resolvers = {
  Query: {
    reservations: () => reservations,
  },
  Mutation: {
    postReservation: async (parent, args, context, info) => {
      const release = await mutex.acquire(); // Simulate transaction
      try {
        const id = reservations.length + 1;

        if (id > process.env.MAX_RESERVATIONS) {
          throw new ApolloError('Maximum reservations reached.', 'CONFLICT');
        }

        reservations.push({
          id: id,
          date: args.reservation.date,
          user: args.reservation.user,
        });

        return id;

      } finally {
        release();
      }
    },
  },
  Reservation: {
    __resolveReference: reference => reservations.find(reservation => reservation.id === reference.id),
    user: reservation => ({ __typename: "User", id: reservation.user }),
  },
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
const reservations = [
  {
    id: '1',
    user: '1',
    date: '2021-09-28',
  },
  {
    id: '2',
    user: '2',
    date: '2021-09-28',
  },
  {
    id: '3',
    user: '1',
    date: '2021-09-28',
  },
  {
    id: '4',
    user: '2',
    date: '2021-09-28',
  },
];

// Transaction simulation...
const mutex = new Mutex();