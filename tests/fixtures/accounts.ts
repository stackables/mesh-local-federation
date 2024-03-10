import { buildSubgraphSchema } from "@graphql-tools/federation";
import { createYoga } from "graphql-yoga";
import { createServer } from "node:http";

const data = [
	{ id: "google", name: "Google" },
	{ id: "facebook", name: "Facebook" },
];

const schema = buildSubgraphSchema({
	typeDefs: /* GraphQL */ `
		type Account @key(fields: "id") {
			id: ID!
			name: String!
		}
	`,
	resolvers: {
		Account: {
			__resolveReference(p) {
				return data.find((x) => x.id === p.id);
			},
		},
	},
});

const yoga = createYoga({
	schema,
});

export const accountsServer = createServer(yoga);
