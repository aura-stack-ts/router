import z from "zod"
import { test } from "vitest"
import { createRouter } from "@/router.ts"
import { createEndpoint } from "@/endpoint.ts"
import type { EndpointConfig, EndpointMeta, RequestContext, RouteEndpoint, RoutePattern } from "@/@types/index.ts"

test("router benchmark", ({ bench }) => {
    const endpoints = Array.from({ length: 100 }).map<RouteEndpoint<any, any, any, any>>((_, idx) => ({
        method: "GET",
        route: `/endpoint-${idx}` as RoutePattern,
        handler: () => {
            return Response.json({ message: `Endpoint ${idx}` })
        },
        config: {} as EndpointConfig<`/endpoint-${number}`, "GET", Record<string, unknown>>,
    }))
    bench("build: createRouter (100 endpoints)", () => {
        createRouter(endpoints)
    }).run()
})

test("router benchmark making 100 requests", ({ bench }) => {
    const endpoints = Array.from({ length: 100 }).map<RouteEndpoint<any, any, any, any>>((_, idx) => ({
        method: "GET",
        route: `/endpoint-${idx}` as RoutePattern,
        handler: () => {
            return Response.json({ message: `Endpoint ${idx}` })
        },
        config: {} as EndpointConfig<`/endpoint-${number}`, "GET", Record<string, unknown>>,
    }))
    bench("match: createRouter (100 endpoints) - small representative lookup set", async () => {
        const { GET } = createRouter(endpoints)
        await GET(new Request("https://example.com/endpoint-42"))
        await GET(new Request("https://example.com/endpoint-99"))
        await GET(new Request("https://example.com/endpoint-1"))
        await GET(new Request("https://example.com/not-found"))
        await GET(new Request("https://example.com/endpoint/500"))
    }).run()
})

test("router benchmark making 1000 requests", ({ bench }) => {
    const endpoints = Array.from({ length: 1000 }).map<RouteEndpoint<any, any, any, any>>((_, idx) => ({
        method: "GET",
        route: `/endpoint-${idx}` as RoutePattern,
        handler: () => {
            return Response.json({ message: `Endpoint ${idx}` })
        },
        config: {} as EndpointConfig<`/endpoint-${number}`, "GET", Record<string, unknown>>,
    }))

    bench("match: createRouter (1000 endpoints) - small representative lookup set", async () => {
        const { GET } = createRouter(endpoints)
        await GET(new Request("https://example.com/endpoint-42"))
        await GET(new Request("https://example.com/endpoint-99"))
        await GET(new Request("https://example.com/endpoint-1"))
        await GET(new Request("https://example.com/not-found"))
        await GET(new Request("https://example.com/endpoint/500"))
    }).run()
})

test("router with dynamic routes without parsing benchmark", ({ bench }) => {
    const endpoints: RouteEndpoint<any, any, any, any>[] = [
        {
            method: "GET",
            route: "/users/:userId" as RoutePattern,
            handler: (ctx: RequestContext<EndpointMeta<any, any, any>>) => {
                return Response.json({ message: `User endpoint`, params: ctx.params })
            },
            config: {} as EndpointConfig<"/users/:userId", "GET", Record<string, unknown>>,
        },
        {
            method: "GET",
            route: "/posts/:postId/comments/:commentId" as RoutePattern,
            handler: (ctx: RequestContext<EndpointMeta<any, any, any>>) => {
                return Response.json({ message: `Post comment endpoint`, params: ctx.params })
            },
            config: {} as EndpointConfig<"/posts/:postId/comments/:commentId", "GET", Record<string, unknown>>,
        },
    ]

    bench("match: createRouter dynamic routes - 2 lookups (params only)", async () => {
        const { GET } = createRouter(endpoints)
        await GET(new Request("https://example.com/users/123"))
        await GET(new Request("https://example.com/posts/456/comments/789"))
    }).run()
})

test("router with dynamic routes with parsing benchmark", ({ bench }) => {
    const getUser = createEndpoint(
        "GET",
        "/users/:userId",
        (ctx) => {
            return Response.json({ message: `User endpoint`, params: ctx.params })
        },
        {
            schemas: {
                params: z.object({
                    userId: z.string().regex(/^\d+$/),
                }),
            },
        }
    )

    const getPostComment = createEndpoint(
        "GET",
        "/posts/:postId/comments/:commentId",
        (ctx) => {
            return Response.json({ message: `Post comment endpoint`, params: ctx.params })
        },
        {
            schemas: {
                params: z.object({
                    postId: z.string().regex(/^\d+$/),
                    commentId: z.string().regex(/^\d+$/),
                }),
            },
        }
    )

    const endpoints: RouteEndpoint<any, any, any, any>[] = [getUser, getPostComment]

    bench("match: createRouter dynamic routes + schema validation - 2 lookups", async () => {
        const { GET } = createRouter(endpoints)
        await GET(new Request("https://example.com/users/123"))
        await GET(new Request("https://example.com/posts/456/comments/789"))
    }).run()
})

test("router with body and without parsing benchmark", ({ bench }) => {
    const endpoints = createEndpoint("POST", "/submit", (ctx) => {
        const body = ctx.body
        return Response.json({ message: "Data received", body })
    })

    bench("match+parse: createRouter POST JSON body - 1 request", async () => {
        const { POST } = createRouter([endpoints])
        await POST(
            new Request("https://example.com/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "Test", value: 42 }),
            })
        )
    }).run()
})

test("router with body and parsing benchmark", ({ bench }) => {
    const endpoints = createEndpoint(
        "POST",
        "/submit",
        (ctx) => {
            const body = ctx.body
            return Response.json({ message: "Data received", body })
        },
        {
            schemas: {
                body: z.object({
                    username: z.string(),
                    password: z.string(),
                }),
            },
        }
    )
    bench("match+parse: createRouter POST JSON body with schema - 1 request", async () => {
        const { POST } = createRouter([endpoints])
        await POST(
            new Request("https://example.com/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: "Test", password: "1234" }),
            })
        )
    }).run()
})

test("router with params and without parsing benchmark", ({ bench }) => {
    const endpoints = createEndpoint("GET", "/users/:id", (ctx) => {
        const userId = ctx.params.id
        return Response.json({ message: "Data received", userId })
    })

    bench("match createRouter GET user by ID - 1 request", async () => {
        const { GET } = createRouter([endpoints])
        await GET(
            new Request("https://example.com/users/123", {
                method: "GET",
            })
        )
    }).run()
})

test("router with body and parsing benchmark", ({ bench }) => {
    const endpoints = createEndpoint(
        "GET",
        "/users/:id",
        (ctx) => {
            const userId = ctx.params.id
            return Response.json({ message: "Data received", userId })
        },
        {
            schemas: {
                params: z.object({
                    id: z.coerce.number(),
                }),
            },
        }
    )
    bench("match:parse createRouter GET user by ID - 1 request", async () => {
        const { GET } = createRouter([endpoints])
        await GET(
            new Request("https://example.com/users/123", {
                method: "GET",
            })
        )
    }).run()
})
