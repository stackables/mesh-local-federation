import type { FetchFn } from "@graphql-tools/executor-http";

export interface MinimalYogaInstance {
	fetch: FetchFn;
}
