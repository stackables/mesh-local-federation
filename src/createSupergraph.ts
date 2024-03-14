import {
	composeServices,
	compositionHasErrors,
} from "@theguild/federation-composition";
import { ExecutionResult, GraphQLSchema, parse } from "graphql";
import { executorFactory } from "./executor.js";
import { OnRemoteRequestHeadersCallback, SubgraphService } from "./index.js";

export interface CreateSupergraphOptions<T = unknown> {
	subgraphs: SubgraphService[];
	localSchema: GraphQLSchema;
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
	const subgraphsWithTypes = Promise.all(
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
			const body = (await response.json()) as ExecutionResult<any>;
			if (body.errors) {
				throw new Error(JSON.stringify(body.errors, null, 2));
			}
			const federationSDL = body.data._service.sdl;

			return {
				typeDefs: parse(federationSDL),
				name: sub.subgraphName,
				url: sub.endpoint,
			};
		})
	);

	const result = composeServices(await subgraphsWithTypes);
	if (compositionHasErrors(result)) {
		throw new Error(JSON.stringify(result.errors, null, 2));
	}
	return result.supergraphSdl.replaceAll("{", " {");
}
