import LocalforageCache from "@graphql-mesh/cache-localforage";
import BareMerger from "@graphql-mesh/merger-bare";
import { getMesh } from "@graphql-mesh/runtime";
import { InMemoryStoreStorageAdapter, MeshStore } from "@graphql-mesh/store";
import { DefaultLogger, PubSub } from "@graphql-mesh/utils";
import { GraphQLSchema } from "graphql";
import SupergraphHandler from "./SupergraphHandler.js";
import { createSupergraph } from "./createSupergraph.js";
import { OnRemoteRequestHeadersCallback, SubgraphService } from "./index.js";

export interface OnRemoteRequestHeadersOptions<T = unknown> {
	url: string;
	context: T;
}

export interface CreateGatewayConfigOptions<T = unknown> {
	subgraphs: SubgraphService[];
	localSchema: GraphQLSchema;
	supergraphSDL?: string;
	onRemoteRequestHeaders?: OnRemoteRequestHeadersCallback<T>;
}

export async function createGatewayConfig<T = unknown>(
	opts: CreateGatewayConfigOptions<T>
): Promise<any> {
	const store = new MeshStore("main", new InMemoryStoreStorageAdapter(), {
		readonly: true,
		validate: false,
	});

	const cache = new LocalforageCache();
	const pubsub = new PubSub();
	const logger = new DefaultLogger("Supergraph");
	const merger = new BareMerger({
		cache,
		logger,
		pubsub,
		store: store.child("BareMerger"),
	});

	const supergraphSdl =
		opts.supergraphSDL ?? (await createSupergraph(opts as any));

	return getMesh({
		cache,
		logger,
		pubsub,
		merger,
		sources: [
			{
				name: "Supergraph",
				handler: new SupergraphHandler(
					supergraphSdl,
					opts.localSchema,
					opts.onRemoteRequestHeaders
				),
			},
		],
	});
}
