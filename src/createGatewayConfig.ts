import { GraphQLSchema } from "graphql";

export interface SubgraphService {
	name: string;
	url: string;
}

export interface OnRemoteRequestHeadersOptions<T = unknown> {
	url: string;
	context: T;
}

export interface CreateGatewayConfigOptions<T = unknown> {
	subgraphs: SubgraphService[];
	localSchema: GraphQLSchema;
	supergraphSDL?: string;
	onRemoteRequestHeaders?: (
		opts: OnRemoteRequestHeadersOptions<T>
	) => HeadersInit | Promise<HeadersInit>;
}

export async function createGatewayConfig<T = unknown>(
	opts: CreateGatewayConfigOptions<T>
): Promise<any> {
	throw new Error("Implement me");
}
