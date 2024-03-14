import {
	composeServices,
	compositionHasErrors,
} from "@theguild/federation-composition";
import { ExecutionResult, GraphQLSchema, parse } from "graphql";
import { createYoga } from "graphql-yoga";
import { OnRemoteRequestHeadersCallback, SubgraphService } from "./index.js";

export interface CreateSupergraphOptions<T = unknown> {
	subgraphs: SubgraphService[];
	localSchema: GraphQLSchema;
	onRemoteRequestHeaders?: OnRemoteRequestHeadersCallback<T>;
}

export async function createSupergraph(opts: CreateSupergraphOptions) {
	const subgraphs = opts.subgraphs.map((s) => ({
		...s,
		fetch,
	}));

	// insert local to list
	subgraphs.push({
		name: "local",
		url: "http://localhost/graphql",
		fetch: createYoga({ schema: opts.localSchema, batching: true })
			.fetch as any,
	});

	// fetch all remotes
	const subgraphsWithTypes = Promise.all(
		subgraphs.map(async (sub) => {
			const headers: Record<string, string> = {
				"content-type": "application/json",
			};
			if (opts.onRemoteRequestHeaders) {
				const more = await opts.onRemoteRequestHeaders({
					context: {},
					url: sub.url,
					name: sub.name,
				});
				Object.assign(headers, more);
			}
			const response = await sub.fetch(sub.url, {
				method: "POST",
				headers,
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
				name: sub.name,
				url: sub.url,
			};
		})
	);

	const result = composeServices(await subgraphsWithTypes);
	if (compositionHasErrors(result)) {
		throw new Error(JSON.stringify(result.errors, null, 2));
	}
	return result.supergraphSdl.replaceAll("{", " {");
}
