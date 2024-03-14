import {
	GetMeshSourcePayload,
	MeshFetchRequestInit,
	MeshHandler,
} from "@graphql-mesh/types";
import { buildHTTPExecutor } from "@graphql-tools/executor-http";
import { getStitchedSchemaFromSupergraphSdl } from "@graphql-tools/federation";
import { GraphQLResolveInfo } from "graphql";
import { createYoga } from "graphql-yoga";
import { CreateMeshInstanceOptions } from "./createMeshInstance";

export default class SupergraphHandler implements MeshHandler {
	constructor(private opts: CreateMeshInstanceOptions<any>) {}

	async getMeshSource({ fetchFn }: GetMeshSourcePayload) {
		const schema = getStitchedSchemaFromSupergraphSdl({
			supergraphSdl: this.opts.supergraphSDL,
			onExecutor: (opts) => {
				if (opts.subgraphName === "LOCAL") {
					return buildHTTPExecutor({
						endpoint: opts.endpoint,
						fetch: createYoga({ schema: this.opts.localSchema, batching: true })
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
					if (this.opts.onRemoteRequestHeaders) {
						const more = await this.opts.onRemoteRequestHeaders({
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
