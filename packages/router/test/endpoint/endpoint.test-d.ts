import { describe, test, expectTypeOf } from "vitest"
import { z } from "zod/v4"
import { createEndpoint, createEndpointConfig } from "@/endpoint.ts"
import type { EndpointMeta, EndpointSchemas, JsonResponse, RequestContext, RouteEndpoint } from "@/index.ts"

describe("Endpoint Types", () => {
    test("Infers endpoint types without a config", () => {
        expectTypeOf(createEndpoint("GET", "/users", (ctx) => ctx.json({ users: [] }))).toEqualTypeOf<
            RouteEndpoint<
                "/users",
                "GET",
                {
                    schemas?: EndpointSchemas | undefined
                },
                (ctx: RequestContext<EndpointMeta<"/users", "GET", EndpointSchemas>>) => JsonResponse<{
                    users: never[]
                }>
            >
        >()
    })

    test("Infers endpoint types when config includes lifecycle hooks", () => {
        const config = createEndpointConfig({
            hooks: {
                onHeaders: () => {},
                onError: (ctx) => {
                    return ctx.json({})
                },
            },
        })

        expectTypeOf(createEndpoint("GET", "/users", (ctx) => ctx.json({ users: [] }), config)).toEqualTypeOf<
            RouteEndpoint<
                "/users",
                "GET",
                {
                    schemas?: EndpointSchemas | undefined
                },
                (ctx: RequestContext<EndpointMeta<"/users", "GET", EndpointSchemas>>) => JsonResponse<{
                    users: never[]
                }>
            >
        >()
    })

    test("Infers endpoint types when config includes middleware", () => {
        const config = createEndpointConfig({
            use: [(ctx) => ctx],
        })

        expectTypeOf(createEndpoint("GET", "/users", (ctx) => ctx.json({ users: [] }), config)).toEqualTypeOf<
            RouteEndpoint<
                "/users",
                "GET",
                {
                    schemas?: EndpointSchemas | undefined
                },
                (ctx: RequestContext<EndpointMeta<"/users", "GET", EndpointSchemas>>) => JsonResponse<{
                    users: never[]
                }>
            >
        >()
    })

    test("Infers endpoint types with inline middleware using context and responses", () => {
        expectTypeOf(
            createEndpoint("GET", "/users", (ctx) => ctx.json({ users: [] }), {
                use: [
                    (ctx) => ctx,
                    (ctx) => {
                        ctx.headers.append("x-header", "1")
                        ctx.searchParams.append("page", "1")
                        return ctx
                    },
                    (ctx) => {
                        if (ctx.searchParams.has("limit")) {
                            return ctx.json({ message: "built-in" })
                        }
                        return Response.json({ message: "native" })
                    },
                ],
            })
        ).toEqualTypeOf<
            RouteEndpoint<
                "/users",
                "GET",
                {
                    schemas?: EndpointSchemas | undefined
                },
                (ctx: RequestContext<EndpointMeta<"/users", "GET", EndpointSchemas>>) => JsonResponse<{
                    users: never[]
                }>
            >
        >()
    })

    test("Preserves endpoint types when a response schema is configured", () => {
        const response = z.object({
            users: z.array(z.object()),
        })
        type ZodType = typeof response

        const config = createEndpointConfig({
            schemas: {
                response,
            },
        })

        expectTypeOf(createEndpoint("GET", "/users", (ctx) => ctx.json({ users: [] }), config)).toEqualTypeOf<
            RouteEndpoint<
                "/users",
                "GET",
                {
                    schemas?: { response: ZodType } | undefined
                },
                (ctx: RequestContext<EndpointMeta<"/users", "GET", { response: ZodType }>>) => JsonResponse<{
                    users: never[]
                }>
            >
        >()
    })

    test("Infers the validated body type with middleware and lifecycle hooks", () => {
        const body = z.object({
            name: z.string(),
            age: z.number(),
        })
        type ZodType = typeof body

        const config = createEndpointConfig({
            use: [(ctx) => ctx],
            schemas: {
                body,
            },
            hooks: {
                onHeaders: () => {},
                onError: (ctx) => {
                    return ctx.json({})
                },
            },
        })

        expectTypeOf(createEndpoint("GET", "/users", (ctx) => ctx.json({ users: [ctx.body] }), config)).toEqualTypeOf<
            RouteEndpoint<
                "/users",
                "GET",
                {
                    schemas?: { body: ZodType } | undefined
                },
                (ctx: RequestContext<EndpointMeta<"/users", "GET", { body: ZodType }>>) => JsonResponse<{
                    users: { name: string; age: number }[]
                }>
            >
        >()
    })
})
