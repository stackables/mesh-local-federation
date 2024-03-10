import { buildSubgraphSchema } from "@graphql-tools/federation";
import { createYoga } from "graphql-yoga";
import { createServer } from "node:http";
import { useAuth } from ".";

const data = [
	{ id: "aarne", name: "Aarne Laur", account: { id: "google" } },
	{ id: "robert", name: "Robert F. Robinson", account: { id: "google" } },
];

const schema = buildSubgraphSchema({
	typeDefs: /* GraphQL */ `
		type Account @key(fields: "id") {
			id: ID!
		}
		type User @key(fields: "id") {
			id: ID!
			name: String!
			account: Account
		}
		type Query {
			users: [User!]
		}
	`,
	resolvers: {
		Query: {
			users: () => {
				return data;
			},
		},
		User: {
			__resolveReference(p) {
				return data.find((x) => x.id === p.id);
			},
		},
	},
});

const yoga = createYoga({
	schema,
	plugins: [useAuth("users")],
});

export const usersServer = createServer(yoga);
