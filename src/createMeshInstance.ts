import LocalforageCache from "@graphql-mesh/cache-localforage";
import BareMerger from "@graphql-mesh/merger-bare";
import { getMesh } from "@graphql-mesh/runtime";
import { InMemoryStoreStorageAdapter, MeshStore } from "@graphql-mesh/store";
import { DefaultLogger, PubSub } from "@graphql-mesh/utils";
import { GraphQLSchema } from "graphql";
import SupergraphHandler from "./SupergraphHandler.js";
import { OnRemoteRequestHeadersCallback } from "./index.js";

export interface CreateMeshInstanceOptions<T = unknown> {
	supergraphSDL: string;
	localSchema: GraphQLSchema;
	onRemoteRequestHeaders?: OnRemoteRequestHeadersCallback<T>;
}

export async function createMeshInstance<T = unknown>(
	opts: CreateMeshInstanceOptions<T>
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

	return getMesh({
		cache,
		logger,
		pubsub,
		merger,
		sources: [
			{
				name: "Supergraph",
				handler: new SupergraphHandler(opts),
			},
		],
	});
}
