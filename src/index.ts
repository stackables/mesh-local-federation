export interface SubgraphService {
	name: string;
	url: string;
}

export interface OnRemoteRequestHeadersOptions<T = unknown> {
	url: string;
	name: string;
	context: T;
}

export type OnRemoteRequestHeadersCallback<T> = (
	opts: OnRemoteRequestHeadersOptions<T>
) => HeadersInit | Promise<HeadersInit>;

export { createGatewayConfig } from "./createGatewayConfig.js";
