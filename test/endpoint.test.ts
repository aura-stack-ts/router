import z from "zod"
import { describe, test } from "vitest"
import { createRouter } from "@/router.ts"
import { createEndpoint, createEndpointConfig } from "@/endpoint.ts"
import type { HTTPMethod, RoutePattern } from "@/types.ts"

describe("createEndpoint", () => {
    describe("With valid configuration", () => {
        const testCases = [
            {
                description: "Create GET endpoint with route",
                method: "GET",
                route: "/users/:userId",
                expected: {
                    method: "GET",
                    route: "/users/:userId",
                    config: {},
                },
            },
            {
                description: "Create POST endpoint with route",
                method: "POST",
                route: "/users",
                expected: {
                    method: "POST",
                    route: "/users",
                    config: {},
                },
            },
            {
                description: "Create DELETE endpoint with route",
                method: "DELETE",
                route: "/users/:userId",
                expected: {
                    method: "DELETE",
                    route: "/users/:userId",
                    config: {},
                },
            },
        ]

        for (const { description, method, route, expected } of testCases) {
            test.concurrent(description, ({ expect }) => {
                const handler: any = () => {}
                const endpoint = createEndpoint(method as HTTPMethod, route as Lowercase<RoutePattern>, handler)
                expect(endpoint).toEqual({ ...expected, handler })
            })
        }
    })

    describe("With invalid configuration", () => {
        const testCases = [
            {
                description: "Throws error for unsupported HTTP method",
                method: "FETCH",
                route: "/users",
                expected: /Unsupported HTTP method: FETCH/,
            },
            {
                description: "Throws error for invalid route format",
                method: "GET",
                route: "invalid-route",
                expected: /Invalid route format: invalid-route/,
            },
        ]

        for (const { description, method, route, expected } of testCases) {
            test.concurrent(description, ({ expect }) => {
                const handler: any = () => {}
                expect(() => createEndpoint(method as HTTPMethod, route as Lowercase<RoutePattern>, handler, {})).toThrowError(
                    expected
                )
            })
        }
    })

    describe("With schemas", () => {
        describe("With body schema", () => {
            const endpoint = createEndpoint(
                "POST",
                "/auth/credentials",
                (ctx) => {
                    return Response.json({ body: ctx.body })
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
            const { POST } = createRouter([endpoint])

            test("With valid body", async ({ expect }) => {
                const post = await POST(
                    new Request("https://example.com/auth/credentials", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username: "John", password: "secret" }),
                    })
                )
                expect(post.ok).toBe(true)
                expect(await post.json()).toEqual({
                    body: { username: "John", password: "secret" },
                })
            })

            test("With invalid body", async ({ expect }) => {
                const post = await POST(
                    new Request("https://example.com/auth/credentials", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username: "John" }),
                    })
                )
                expect(post.status).toBe(422)
                expect(await post.json()).toMatchObject({ error: "validation_error", details: {} })
                expect(post.statusText).toBe("UNPROCESSABLE_ENTITY")
            })
        })

        describe("With searchParams schema", () => {
            const endpoint = createEndpoint(
                "GET",
                "/auth/:oauth",
                (ctx) => {
                    return Response.json({ searchParams: ctx.searchParams })
                },
                {
                    schemas: {
                        searchParams: z.object({
                            state: z.string(),
                            code: z.string(),
                        }),
                    },
                }
            )

            const { GET } = createRouter([endpoint])

            test("With valid searchParams", async ({ expect }) => {
                const get = await GET(new Request("https://example.com/auth/google?state=123abc&code=123"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({
                    searchParams: { state: "123abc", code: "123" },
                })
            })

            test("With invalid searchParams", async ({ expect }) => {
                const get = await GET(new Request("https://example.com/auth/google?state=123abc", { method: "GET" }))
                expect(await get.json()).toMatchObject({ error: "validation_error", details: {} })
                expect(get.status).toBe(422)
                expect(get.statusText).toBe("UNPROCESSABLE_ENTITY")
            })
        })

        describe("With params schema", () => {
            const config = createEndpointConfig("/signIn/:oauth", {
                schemas: {
                    params: z.object({
                        oauth: z.enum(["google", "github"]),
                    }),
                },
            })

            const inferConfig = createEndpointConfig("/type/:typeId", {
                schemas: {
                    params: z.object({
                        typeId: z.enum(["token", "code"]),
                    }),
                },
            })

            const endpoint = createEndpoint(
                "GET",
                "/signIn/:oauth",
                async (ctx) => {
                    const oauth = ctx.params.oauth
                    return Response.json({ oauth })
                },
                config
            )

            const inferEndpoint = createEndpoint(
                "GET",
                "/type/:typeId",
                async (ctx) => {
                    return Response.json({ typeId: ctx.params.typeId })
                },
                inferConfig
            )

            const { GET } = createRouter([endpoint, inferEndpoint])

            test("With valid params", async ({ expect }) => {
                const get = await GET(new Request("https://example.com/signIn/google"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({ oauth: "google" })
            })

            test("With invalid params", async ({ expect }) => {
                const get = await GET(new Request("https://example.com/signIn/facebook"))
                expect(get.status).toBe(422)
                expect(get.statusText).toBe("UNPROCESSABLE_ENTITY")
                expect(await get.json()).toMatchObject({ error: "validation_error", details: {} })
            })

            test("With inferred params", async ({ expect }) => {
                const get = await GET(new Request("https://example.com/type/token"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({ typeId: "token" })
            })

            test("With invalid inferred params", async ({ expect }) => {
                const get = await GET(new Request("https://example.com/type/invalid"))
                expect(get.status).toBe(422)
                expect(get.statusText).toBe("UNPROCESSABLE_ENTITY")
                expect(await get.json()).toMatchObject({ error: "validation_error", details: {} })
            })
        })
    })

    describe("With middlewares", () => {
        test("Update params context in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/auth/:oauth",
                (ctx) => {
                    const oauth = ctx.params.oauth
                    return Response.json({ oauth })
                },
                {
                    middlewares: [
                        (ctx) => {
                            ctx.params = { oauth: "google" }
                            return ctx
                        },
                    ],
                }
            )
            const { GET } = createRouter([endpoint])
            const get = await GET(new Request("https://example.com/auth/github"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({ oauth: "google" })
        })

        test("Update searchParams context in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/auth/google",
                (ctx) => {
                    const searchParams = Object.fromEntries(ctx.searchParams.entries())
                    return Response.json({ searchParams })
                },
                {
                    middlewares: [
                        (ctx) => {
                            ctx.searchParams.set("state", "123abc")
                            ctx.searchParams.set("code", "123")
                            return ctx
                        },
                    ],
                }
            )
            const { GET } = createRouter([endpoint])
            const get = await GET(new Request("https://example.com/auth/google"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({
                searchParams: { state: "123abc", code: "123" },
            })
        })

        test("Update headers context in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/headers",
                (ctx) => {
                    const headers = Object.fromEntries(ctx.headers.toHeaders().entries())
                    return Response.json({ headers })
                },
                {
                    middlewares: [
                        (ctx) => {
                            ctx.headers.setHeader("Authorization", "Bearer token")
                            return ctx
                        },
                    ],
                }
            )
            const { GET } = createRouter([endpoint])
            const get = await GET(new Request("https://example.com/headers"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({
                headers: { authorization: "Bearer token" },
            })
        })
    })

    describe("With schemas and middlewares", () => {
        test("Override body in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "POST",
                "/auth/credentials",
                (ctx) => {
                    return Response.json({ body: ctx.body })
                },
                {
                    schemas: {
                        body: z.object({
                            username: z.string(),
                            password: z.string(),
                        }),
                    },
                    middlewares: [
                        (ctx) => {
                            ctx.body.username = "John Doe"
                            return ctx
                        },
                    ],
                }
            )
            const { POST } = createRouter([endpoint])

            const post = await POST(
                new Request("https://example.com/auth/credentials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: "John", password: "secret" }),
                })
            )
            expect(post.ok).toBe(true)
            expect(await post.json()).toEqual({
                body: { username: "John Doe", password: "secret" },
            })
        })

        test("Override searchParams in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/auth/google",
                (ctx) => {
                    return Response.json({ searchParams: ctx.searchParams })
                },
                {
                    schemas: {
                        searchParams: z.object({
                            redirect_uri: z.string(),
                        }),
                    },
                    middlewares: [
                        (ctx) => {
                            const searchParams = ctx.searchParams as any
                            searchParams.state = "123abc"
                            searchParams.code = "123"
                            return ctx
                        },
                    ],
                }
            )
            const { GET } = createRouter([endpoint])
            const get = await GET(new Request("https://example.com/auth/google?redirect_uri=https://app.com/callback"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({
                searchParams: {
                    state: "123abc",
                    code: "123",
                    redirect_uri: "https://app.com/callback",
                },
            })
        })

        test("Override params in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/auth/:oauth",
                (ctx) => {
                    return Response.json({ params: ctx.params })
                },
                {
                    schemas: {},
                    middlewares: [
                        (ctx) => {
                            ctx.params.oauth = "google"
                            return ctx
                        },
                    ],
                }
            )

            const { GET } = createRouter([endpoint])
            const get = await GET(new Request("https://example.com/auth/github"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({
                params: { oauth: "google" },
            })
        })
    })

    describe("With method, route, and url", () => {
        const endpont = createEndpoint("GET", "/users", async (ctx) => {
            return Response.json({ method: ctx.method, route: ctx.route, url: ctx.url })
        })

        const { GET } = createRouter([endpont])

        test("Access method, route, and url from context", async ({ expect }) => {
            const get = await GET(new Request("https://example.com/users?id=123"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({
                method: "GET",
                route: "/users",
                url: "https://example.com/users?id=123",
            })
        })
    })
})
