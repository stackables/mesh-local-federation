import {
	composeServices,
	compositionHasErrors,
} from "@theguild/federation-composition";
import { ExecutionResult, parse } from "graphql";
import type { YogaServerInstance } from "graphql-yoga";
import { executorFactory } from "./executor.js";
import { OnRemoteRequestHeadersCallback, SubgraphService } from "./index.js";

export interface CreateSupergraphOptions<T = unknown> {
	subgraphs: SubgraphService[];
	localSchema: YogaServerInstance<{}, any>;
	onRemoteRequestHeaders?: OnRemoteRequestHeadersCallback<T>;
}

export async function createSupergraph(opts: CreateSupergraphOptions) {
	const subgraphs = [...opts.subgraphs];

	// insert local to list
	subgraphs.push({
		subgraphName: "local://graphql",
		endpoint: "local://graphql",
	});

	const factory = executorFactory(opts);

	// fetch all remotes
	const subgraphsWithTypes = await Promise.all(
		subgraphs.map(async (sub) => {
			const fetch = factory.getFetch(sub);

			const response = await fetch(sub.endpoint, {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					query: `{ _service { sdl } }`,
				}),
			});

			if (!response.ok) {
				throw new Error("service sdl call failed");
			}

			const body: ExecutionResult<any> = await response.json();
			if (body.errors) {
				throw new AggregateError(body.errors);
			}

			const federationSDL = body.data._service.sdl;

			return {
				typeDefs: parse(federationSDL),
				name: sub.subgraphName,
				url: sub.endpoint,
			};
		})
	);

	const result = composeServices(subgraphsWithTypes);
	if (compositionHasErrors(result)) {
		throw new AggregateError(result.errors);
	}
	return result.supergraphSdl.replaceAll("{", " {");
}
