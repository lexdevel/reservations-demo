import { buildFederatedSchema } from '@apollo/federation';
import { ApolloServer, gql } from 'apollo-server';
import { ApolloError } from 'apollo-server-errors';
import { Mutex } from 'async-mutex';
import { v4 as uuid } from 'uuid';
import { readFileSync } from 'fs';

const reservations = JSON.parse(readFileSync('./reservations.json').toString('utf-8'));
const lock = new Mutex();
const typeDefs = gql(readFileSync('./schema.graphql').toString('utf-8'));

const resolvers = {
  Query: {
    reservations: () => reservations,
  },
  Mutation: {
    createReservation: async (parent, args, context, info) => {
      const release = await lock.acquire(); // Simulate transaction
      try {
        const reservationsForDay = reservations.filter(reservation => reservation.date === args.date);
        const id = uuid();

        if (reservationsForDay.length > process.env.MAX_RESERVATIONS) {
          throw new ApolloError('Maximum reservations reached.', 'CONFLICT');
        }

        reservations.push({
          id: id,
          userId: args.userId,
          date: args.date,
        });

        return id;

      } finally {
        release();
      }
    },
    removeReservation: async (parent, args, context, info) => {
      const release = await lock.acquire(); // Simulate transaction
      try {
        const index = reservations.findIndex(reservation => reservation.id === args.id);
        if (index === -1) {
          throw new ApolloError(`Reservation '${args.id}' is not found.`, 'NOT_FOUND');
        }

        const reservation = reservations[index];
        reservations.splice(index, 1);

        return reservation;
      } finally {
        release();
      }
    },
  },
  Reservation: {
    __resolveReference: reference => reservations.find(reservation => reservation.id === reference.id),
    user: reservation => ({ __typename: "User", id: reservation.userId }),
  },
  User: {
    reservations: user => reservations.filter(reservation => reservation.userId === user.id),
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
