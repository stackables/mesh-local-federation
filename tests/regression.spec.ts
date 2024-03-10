import { createYoga } from "graphql-yoga";
import { createSupergraph } from "../src/createSupergraph.js";
import { createGatewayConfig } from "../src/index.js";
import { TestHarness, createFixture } from "./fixtures/index.js";

describe("Federation", () => {
	let harness: TestHarness;

	beforeEach(async () => {
		harness = await createFixture();
	});

	afterEach(async () => {
		await harness.stop();
	});

	test("supergraph is constructed correctly", async () => {
		const response = await createSupergraph({
			subgraphs: harness.subgraphs,
			localSchema: harness.localSchema,
			onRemoteRequestHeaders: ({ name }) => {
				return {
					authorization: name,
				};
			},
		});

		expect(response).toMatchSnapshot();
	});

	test("run basic query", async () => {
		const supergraphSDL = await createSupergraph({
			subgraphs: harness.subgraphs,
			localSchema: harness.localSchema,
			onRemoteRequestHeaders: ({ name }) => {
				return {
					authorization: name,
				};
			},
		});

		const yoga = await createGatewayConfig({
			supergraphSDL,
			localSchema: harness.localSchema,
			onRemoteRequestHeaders: ({ name }) => {
				return {
					authorization: name,
				};
			},
		});

		const fetch = createYoga({
			...yoga,
			context: ({ request }) => {
				return {
					user: request.headers.get("user-id"),
				};
			},
		}).fetch;

		const response = await fetch("/graphql", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"user-id": "aarne",
			},
			body: JSON.stringify({
				query: `{ 
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
				}`,
			}),
		});
		if (!response.ok) {
			throw new Error("service sdl call failed");
		}
		const body = await response.json();
		expect(body).toMatchSnapshot();
	});
});
