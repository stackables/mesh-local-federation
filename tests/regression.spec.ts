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
			onRemoteRequestHeaders: () => {
				return {};
			},
		});

		expect(response).toMatchSnapshot();
	});

	test("run basic query", async () => {
		const yoga = await createGatewayConfig({
			subgraphs: harness.subgraphs,
			localSchema: harness.localSchema,
			onRemoteRequestHeaders: () => {
				return {};
			},
		});

		const fetch = createYoga(yoga).fetch;
		const response = await fetch("/graphql", {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				query: `{ 
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
