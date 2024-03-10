import { accountsServer } from "./accounts";
import { localSchema } from "./local";
import { usersServer } from "./users";

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
		],
		localSchema,
		async stop() {
			await new Promise((resolve) => usersServer.close(() => resolve(null)));
			await new Promise((resolve) => accountsServer.close(() => resolve(null)));
		},
	};
}
