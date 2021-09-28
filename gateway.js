import { ApolloServer } from 'apollo-server';
import { ApolloGateway } from '@apollo/gateway';

const gateway = new ApolloGateway({
  serviceList: [
    { name: "reservations", url: process.env.RESERVATIONS_URL },
    { name: "users", url: process.env.USERS_URL },
  ],
  __exposeQueryPlanExperimental: false,
});

const server = new ApolloServer({
  gateway,
  engine: false,
  subscriptions: false,
});

(async () => {
  const { url } = await server.listen({ port: process.env.PORT });
  console.log(`🚀 Server is ready at ${url}...`);
})();
