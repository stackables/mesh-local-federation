import { GetMeshSourcePayload, MeshHandler } from "@graphql-mesh/types";
import { getStitchedSchemaFromSupergraphSdl } from "@graphql-tools/federation";
import { CreateMeshInstanceOptions } from "./createMeshInstance";
import { executorFactory } from "./executor";

export default class SupergraphHandler implements MeshHandler {
	constructor(private opts: CreateMeshInstanceOptions<any>) {}

	async getMeshSource({ fetchFn }: GetMeshSourcePayload) {
		const factory = executorFactory(this.opts, fetchFn);

		const schema = getStitchedSchemaFromSupergraphSdl({
			supergraphSdl: this.opts.supergraphSDL,
			onExecutor: (opts) => {
				return factory.getExecutor(opts);
			},
			batch: true,
		});
		return {
			schema,
		};
	}
}
