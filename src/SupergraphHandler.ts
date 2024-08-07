import { GetMeshSourcePayload, MeshHandler } from "@graphql-mesh/types";
import { getStitchedSchemaFromSupergraphSdl } from "@graphql-tools/federation";
import { CreateMeshInstanceOptions } from "./createMeshInstance.js";
import { executorFactory } from "./executor.js";

export default class SupergraphHandler implements MeshHandler {
	constructor(private opts: CreateMeshInstanceOptions<any>) {}

	async getMeshSource({ fetchFn }: GetMeshSourcePayload) {
		const factory = executorFactory(this.opts, fetchFn);

		const schema = getStitchedSchemaFromSupergraphSdl({
			supergraphSdl: this.opts.supergraphSDL,
			onSubschemaConfig: (subschemaConfig) => {
				subschemaConfig.executor = factory.getExecutor({
					endpoint: subschemaConfig.endpoint,
					subgraphName: subschemaConfig.name,
				});
			},
			batch: true,
		});
		return {
			schema,
		};
	}
}
