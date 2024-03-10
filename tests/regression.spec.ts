import { buildSubgraphSchema } from "@graphql-tools/federation";
import { createGatewayConfig } from "../src/index.js";

const localSchema = buildSubgraphSchema({
	typeDefs: /* GraphQL */ `
		type Query {
			hello: String
		}
	`,
	resolvers: {
		Query: {
			hello: () => {
				return "world";
			},
		},
	},
});

test("it works", async () => {
	const response = createGatewayConfig({
		subgraphs: [],
		localSchema,
	});

	await expect(response).rejects.toThrow("Implement me");
});
