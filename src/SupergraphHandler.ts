import { GetMeshSourcePayload, MeshHandler } from "@graphql-mesh/types";
import { buildHTTPExecutor } from "@graphql-tools/executor-http";
import { getStitchedSchemaFromSupergraphSdl } from "@graphql-tools/federation";
import { GraphQLSchema } from "graphql";
import { createYoga } from "graphql-yoga";

export default class SupergraphHandler implements MeshHandler {
	constructor(
		private supergraphSdl: string,
		private localSchema: GraphQLSchema
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
				return buildHTTPExecutor({
					endpoint: opts.endpoint,
					fetch: fetchFn,
				});
			},
			batch: true,
		});
		return {
			schema,
		};
	}
}
