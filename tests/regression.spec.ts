import { createYoga } from "graphql-yoga";
import { createSupergraph } from "../src/createSupergraph.js";
import { createMeshInstance } from "../src/index.js";
import { TestHarness, createFixture } from "./fixtures/index.js";
import {
	GraphqlExecutor,
	createGraphqlExecutor,
} from "./utils/graphql-server.js";

describe("Federation", () => {
	let harness: TestHarness;
	let supergraphSDL: string;
	let executor: GraphqlExecutor;

	beforeAll(async () => {
		harness = await createFixture();

		supergraphSDL = await createSupergraph({
			subgraphs: harness.subgraphs,
			localSchema: harness.localSchema,
			onRemoteRequestHeaders: ({ name }) => {
				return {
					authorization: name,
				};
			},
		});

		const yoga = await createMeshInstance({
			supergraphSDL,
			localSchema: harness.localSchema,
			onRemoteRequestHeaders: ({ name }) => {
				return {
					authorization: name,
				};
			},
		});

		const server = createYoga({
			...yoga,
			context: ({ request }) => {
				return {
					user: request.headers.get("user-id"),
				};
			},
		});

		executor = createGraphqlExecutor(server);
	});

	afterAll(async () => {
		await harness.stop();
	});

	test("supergraph is constructed correctly", async () => {
		expect(supergraphSDL).toMatchSnapshot();
	});

	test("run basic query", async () => {
		const response = await executor({
			headers: {
				"user-id": "aarne",
			},
			query: /* GraphQL */ `
				{
					users {
						id
						identity
						account {
							name
						}
					}
					me {
						id
						identity
						name
						account {
							id
							name
						}
					}
				}
			`,
		});
		expect(response).toMatchSnapshot();
	});
});
