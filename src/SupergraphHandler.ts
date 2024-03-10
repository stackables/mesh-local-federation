import {
	GetMeshSourcePayload,
	MeshFetchRequestInit,
	MeshHandler,
} from "@graphql-mesh/types";
import { buildHTTPExecutor } from "@graphql-tools/executor-http";
import { getStitchedSchemaFromSupergraphSdl } from "@graphql-tools/federation";
import { GraphQLResolveInfo, GraphQLSchema } from "graphql";
import { createYoga } from "graphql-yoga";
import { OnRemoteRequestHeadersCallback } from ".";

export default class SupergraphHandler implements MeshHandler {
	constructor(
		private supergraphSdl: string,
		private localSchema: GraphQLSchema,
		private onRemoteRequestHeaders?: OnRemoteRequestHeadersCallback<any>
	) {}

	async getMeshSource({ fetchFn }: GetMeshSourcePayload) {
		const schema = getStitchedSchemaFromSupergraphSdl({
			supergraphSdl: this.supergraphSdl,
			onExecutor: (opts) => {
				if (opts.subgraphName === "LOCAL") {
					return buildHTTPExecutor({
						endpoint: opts.endpoint,
						fetch: createYoga({ schema: this.localSchema, batching: true })
							.fetch as any,
					});
				}

				const wrapped = async (
					url: string,
					options?: MeshFetchRequestInit | undefined,
					context?: any,
					info?: GraphQLResolveInfo | undefined
				) => {
					const headers = options?.headers ?? {};
					if (this.onRemoteRequestHeaders) {
						const more = await this.onRemoteRequestHeaders({
							context: {},
							url: opts.endpoint,
							name: opts.subgraphName,
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

				return buildHTTPExecutor({
					endpoint: opts.endpoint,
					fetch: wrapped,
				});
			},
			batch: true,
		});
		return {
			schema,
		};
	}
}
