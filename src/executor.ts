import { MeshFetchRequestInit } from "@graphql-mesh/types";
import { FetchFn, buildHTTPExecutor } from "@graphql-tools/executor-http";
import type { Executor } from "@graphql-tools/utils";
import { readFile } from "fs/promises";
import { GraphQLResolveInfo, GraphQLSchema } from "graphql";
import { createYoga, type YogaServerOptions } from "graphql-yoga";
import { OnRemoteRequestHeadersCallback, SubgraphService } from "./index.js";

export interface CreateSupergraphOptions<T = unknown> {
	localSchema: GraphQLSchema;
	onRemoteRequestHeaders?: OnRemoteRequestHeadersCallback<T>;
	onLocalContext?: YogaServerOptions<{}, {}>["context"];
}

/**
 * @materialized
 */
async function getVersion() {
	const pkg = await readFile("./package.json");
	const parsed = JSON.parse(pkg.toString());
	return parsed.version;
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
				context: context ?? {},
				endpoint: subgraph.endpoint,
				subgraphName: subgraph.subgraphName,
			});
			Object.assign(headers, more);
		}

		headers["User-Agent"] = `mesh-local-federation / ${await getVersion()}`;

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

function wrapLocal(fetchFn: FetchFn) {
	const wrapped = async (
		url: string,
		options?: MeshFetchRequestInit | undefined,
		context?: { request?: Request; meshRequest?: Request },
		info?: GraphQLResolveInfo | undefined
	) => {
		const headers = options?.headers ?? {};
		if (context?.request) {
			context.request.headers.forEach((value, key) => {
				headers[key] = value;
			});

			context.meshRequest = context.request;
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
		context: opts.onLocalContext,
	}).fetch;

	function getFetch(subgraph: SubgraphService) {
		if (subgraph.endpoint === "local://graphql") {
			return wrapLocal(localFetch);
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
