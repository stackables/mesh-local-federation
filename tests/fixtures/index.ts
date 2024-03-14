import { Plugin } from "graphql-yoga";
import { SubgraphService } from "../../src";
import { accountsServer } from "./accounts";
import { localSchema } from "./local";
import { usersServer } from "./users";

export function useAuth(requiredToken: string): Plugin {
	return {
		onRequest({ request, fetchAPI, endResponse }) {
			const gatewayToken = request.headers.get("authorization");
			if (gatewayToken?.toLowerCase() !== requiredToken.toLowerCase()) {
				console.log(
					"Fake authorization failed",
					gatewayToken,
					"but required",
					requiredToken
				);
				endResponse(
					new fetchAPI.Response(null, {
						status: 401,
						headers: {
							"Content-Type": "application/json",
						},
					})
				);
			}
		},
	};
}

export type TestHarness = Awaited<ReturnType<typeof createFixture>>;

export async function createFixture() {
	await new Promise((resolve) => usersServer.listen(4005, () => resolve(null)));
	await new Promise((resolve) =>
		accountsServer.listen(4006, () => resolve(null))
	);

	return {
		subgraphs: [
			{
				name: "users",
				url: "http://localhost:4005/graphql",
			},
			{
				name: "accounts",
				url: "http://localhost:4006/graphql",
			},
		] as SubgraphService[],
		localSchema,
		async stop() {
			await new Promise((resolve) => usersServer.close(() => resolve(null)));
			await new Promise((resolve) => accountsServer.close(() => resolve(null)));
		},
	};
}
