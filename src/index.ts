export interface SubgraphService {
	subgraphName: string;
	endpoint: string;
}

export interface OnRemoteRequestHeadersOptions<T = unknown> {
	endpoint: string;
	subgraphName: string;
	context: T;
}

export type OnRemoteRequestHeadersCallback<T> = (
	opts: OnRemoteRequestHeadersOptions<T>
) => HeadersInit | Promise<HeadersInit>;

export { createMeshInstance } from "./createMeshInstance.js";
export { createSupergraph } from "./createSupergraph.js";
