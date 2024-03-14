import { MeshFetchRequestInit } from "@graphql-mesh/types";
import { FetchFn, buildHTTPExecutor } from "@graphql-tools/executor-http";
import type { Executor } from "@graphql-tools/utils";
import { GraphQLResolveInfo, GraphQLSchema } from "graphql";
import { createYoga } from "graphql-yoga";
import { OnRemoteRequestHeadersCallback, SubgraphService } from ".";

export interface CreateSupergraphOptions<T = unknown> {
	localSchema: GraphQLSchema;
	onRemoteRequestHeaders?: OnRemoteRequestHeadersCallback<T>;
}

function wrap(
	fetchFn: FetchFn,
	opts: CreateSupergraphOptions,
	subgraph: SubgraphService
) {
	const wrapped = async (
		url: string,
		options?: MeshFetchRequestInit | undefined,
		context?: any,
		info?: GraphQLResolveInfo | undefined
	) => {
		const headers = options?.headers ?? {};
		if (opts.onRemoteRequestHeaders) {
			const more = await opts.onRemoteRequestHeaders({
				context: {},
				endpoint: subgraph.endpoint,
				subgraphName: subgraph.subgraphName,
			});
			Object.assign(headers, more);
		}

		return fetchFn(
			url,
			{
				...options,
				headers,
			},
			context,
			info
		);
	};

	return wrapped;
}

export function executorFactory(
	opts: CreateSupergraphOptions,
	fetchFn: FetchFn = fetch
) {
	const localFetch = createYoga({
		schema: opts.localSchema,
		batching: true,
	}).fetch;

	function getFetch(subgraph: SubgraphService) {
		if (subgraph.endpoint === "local://graphql") {
			return localFetch;
		}

		return wrap(fetchFn, opts, subgraph);
	}

	function getExecutor(subgraph: SubgraphService): Executor {
		return buildHTTPExecutor({
			endpoint: subgraph.endpoint,
			fetch: getFetch(subgraph) as any,
		});
	}

	return {
		getFetch,
		getExecutor,
	};
}
