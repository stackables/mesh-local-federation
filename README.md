[![npm](https://img.shields.io/npm/v/mesh-local-federation?label=mesh-local-federation&logo=npm)](https://www.npmjs.com/package/mesh-local-federation)
[![codecov](https://codecov.io/gh/stackables/mesh-local-federation/branch/main/graph/badge.svg?token=x1DmWF8EId)](https://codecov.io/gh/stackables/mesh-local-federation)

# GraphQL mesh gateway with local federation

Disclaimer: This is 99% glue around the the following excellent packages:

- [@graphql-mesh/\*](https://the-guild.dev/graphql/mesh/docs)
- [@theguild/federation-composition](https://github.com/the-guild-org/federation)

But for a specific workflow is sets up things in a simple and clean way to remove un-needed boilerplate. The package exposes only 2 functions:

1. `createSupergraph` - Takes external services and the local schema to produce the supergraph definition
1. `createMeshInstance` - Takes the supergraph definition from createSupergraph and local schema to build a executable gateway configuration that can be used with [graphql-yoga](https://github.com/dotansimha/graphql-yoga)

## Workflow

```mermaid
graph LR;
    subgraph Instance
        gateway(/graphql)-->local(Local executable schema)
        db(Supergraph\ndefinition)<-->gateway
    end
    gateway--->federated1(External service);
    gateway--->federated2(External service);
```

#### Define external services

```typescript
import type { SubgraphService } from "mesh-local-federation";

const subgraphs: SubgraphService[] = [
	{
		subgraphName: "users",
		endpoint: "https://federated.users.service.endpoint/graphql",
	},
	{
		subgraphName: "orders",
		endpoint: "https://federated.orders.service.endpoint/graphql",
	},
	// ...
];
```

#### Create local executable schema

```typescript
import { buildSubgraphSchema } from "@graphql-tools/federation";

export const localSchema = buildSubgraphSchema({
	typeDefs: /* GraphQL */ `
		type Query {
			hello: String
		}
	`,
	resolvers: {
		Query: {
			hello: () => {
				return "world";
			},
		},
	},
});
```

#### Build supergraph definition

```typescript
import { createSupergraph } from "mesh-local-federation";

const supergraphSDL = await createSupergraph({
	subgraphs,
	localSchema,
	onRemoteRequestHeaders: ({ endpoint }) => {
		return {
			Authorization: `Bearer ${await getToken(endpoint)}`,
		};
	},
});
```

Result of this step can be cached and the resulting schema definition can be used for the next steps to speed up the precess significantly.

[materialize-ts-function](https://www.npmjs.com/package/materialize-ts-function) is a simple way to do this during build process.

#### Create server

```typescript
import { createServer } from "node:http";
import { createMeshInstance } from "mesh-local-federation";
import { createYoga } from "graphql-yoga";

const config = await createMeshInstance({
	supergraphSDL,
	localSchema: harness.localSchema,
	onRemoteRequestHeaders: ({ endpoint }) => {
		return {
			Authorization: `Bearer ${await getToken(endpoint)}`,
		};
	},
});

const yoga = createYoga({
	...config,
	context: ({ request }) => {
		// context will be available in onRemoteRequestHeaders
		// and will be passed to local graph
	},
});

const server = createServer(yoga);

server.listen(4000, () => {
	console.info("Server is running on http://localhost:4000/graphql");
});
```
