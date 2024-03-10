import { buildSubgraphSchema } from "@graphql-tools/federation";

export const localSchema = buildSubgraphSchema({
	typeDefs: /* GraphQL */ `
		type User @key(fields: "id") {
			id: ID!
			identity: String
		}
		type Query {
			me: User
		}
	`,
	resolvers: {
		Query: {
			me: () => {
				return {
					id: "aarne",
					identity: "google",
				};
			},
		},
	},
});
