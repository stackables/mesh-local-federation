import { ServerAdapterObject } from "@whatwg-node/server";
import { ExecutionResult } from "graphql";

interface CreateGraphqlExecutorOptions {
	headers?: Record<string, string>;
}

interface GraphqlExecutorOptions {
	query: string;
	variables?: Record<string, any>;
	headers?: Record<string, string>;
}

export type GraphqlExecutor = (
	request: GraphqlExecutorOptions
) => Promise<ExecutionResult>;

export function createGraphqlExecutor(
	server: ServerAdapterObject<any>,
	opts: CreateGraphqlExecutorOptions = {}
): GraphqlExecutor {
	const executor: GraphqlExecutor = async (request: GraphqlExecutorOptions) => {
		const response = await server.fetch("/graphql", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				...opts.headers,
				...request.headers,
			},
			body: JSON.stringify({
				query: request.query,
				variables: request.variables,
			}),
		});

		if (!response.ok) {
			throw new Error("Server call failed");
		}
		const body = await response.json();

		return body as ExecutionResult;
	};

	return executor;
}
