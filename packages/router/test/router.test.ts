import z from "zod"
import { describe, expect, expectTypeOf, test } from "vitest"
import { RouterError } from "@/error.ts"
import { createRouter } from "@/router.ts"
import { isRouterError } from "@/assert.ts"
import { createEndpoint, createEndpointConfig } from "@/endpoint.ts"
import { HeadersBuilder } from "@/headers.ts"
import type { Awaitable, GetHttpHandlers, HTTPMethod, RoutePattern } from "@/index.ts"

const endpoint = (method: HTTPMethod, route: RoutePattern, name: string) => {
    return createEndpoint(method, route, async (ctx) => ctx.json({ name, params: ctx.params }))
}

describe("createRouter", () => {
    describe("OAuth endpoints", () => {
        const signInConfig = createEndpointConfig("/auth/signin/:oauth", {
            schemas: {
                searchParams: z.object({
                    redirect_uri: z.string(),
                }),
            },
        })
        const sessionConfig = createEndpointConfig("/auth/session", {
            use: [
                (ctx) => {
                    ctx.headers.setCookie("session-token", "123abc-token")
                    return ctx
                },
            ],
        })

        const signIn = createEndpoint(
            "GET",
            "/auth/signin/:oauth",
            () => {
                return Response.json({ message: "Redirect to OAuth provider" }, { status: 302 })
            },
            signInConfig
        )

        const callback = createEndpoint("GET", "/auth/callback", () => {
            return Response.json({ message: "Handle OAuth callback" }, { status: 200 })
        })

        const session = createEndpoint(
            "GET",
            "/auth/session",
            (ctx) => {
                const headers = ctx.headers.toHeaders()
                return Response.json({ message: "Get user session" }, { status: 200, headers })
            },
            sessionConfig
        )

        const credentialsConfig = createEndpointConfig({
            schemas: {
                body: z.object({
                    username: z.string(),
                    password: z.string(),
                }),
            },
        })

        const credentials = createEndpoint(
            "POST",
            "/auth/credentials",
            (ctx) => {
                const body = ctx.body
                return Response.json({ message: "Sign in with credentials", credentials: body }, { status: 200 })
            },
            credentialsConfig
        )

        const router = createRouter([signIn, callback, credentials, session])

        test("Callback handler", async () => {
            const { GET } = router
            const get = await GET(new Request("https://example.com/auth/callback", { method: "GET" }))
            expect(get.status).toBe(200)
            expect(get.ok).toBeTruthy()
            expect(await get.json()).toEqual({ message: "Handle OAuth callback" })
        })

        test("Sign-in handler", async () => {
            const { GET } = router
            const get = await GET(
                new Request("https://example.com/auth/signin/google?redirect_uri=url_to_redirect", { method: "GET" })
            )
            expect(get.status).toBe(302)
            expect(await get.json()).toEqual({
                message: "Redirect to OAuth provider",
            })
        })

        test("Sign-in handler with missing search params", async () => {
            const { GET } = router
            const get = await GET(
                new Request("https://example.com/auth/signin/google", {
                    method: "GET",
                })
            )
            expect(get.status).toBe(422)
            expect(await get.json()).toEqual({
                type: "VALIDATION",
                code: "UNPROCESSABLE_ENTITY",
                message: "The request body or parameter schema layout contains input format errors.",
                details: {
                    redirect_uri: {
                        code: "invalid_type",
                        message: "Invalid input: expected string, received undefined",
                    },
                },
            })
        })

        test("Sign-in handler with missing route param", async () => {
            const { GET } = router
            const get = await GET(new Request("https://example.com/auth/signin?redirect_uri=url_to_redirect", { method: "GET" }))
            expect(get.status).toBe(404)
            expect(get.ok).toBeFalsy()
            expect(await get.json()).toEqual({
                type: "ROUTER_FLOW",
                code: "NOT_FOUND",
                message:
                    "The requested route address cannot be found or is unavailable on this application endpoint server context.",
            })
        })

        test("Session handler with middleware", async () => {
            const { GET } = router
            const get = await GET(new Request("https://example.com/auth/session", { method: "GET" }))
            expect(get.status).toBe(200)
            expect(get.ok).toBeTruthy()
            expect(await get.json()).toEqual({ message: "Get user session" })
            expect(new HeadersBuilder(get.headers).getSetCookie("session-token")).toBe("123abc-token")
        })

        test("Credentials handler", async () => {
            const { POST } = router
            const post = await POST(
                new Request("https://example.com/auth/credentials", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: "John",
                        password: "secret",
                    }),
                })
            )
            expect(post.status).toBe(200)
            expect(post.ok).toBeTruthy()
            expect(await post.json()).toEqual({
                message: "Sign in with credentials",
                credentials: { username: "John", password: "secret" },
            })
        })

        test("Credentials handler with missing content-type", async () => {
            const { POST } = router
            const body = {
                username: "John",
                password: "secret",
            }
            const post = await POST(
                new Request("https://example.com/auth/credentials", {
                    method: "POST",
                    body: JSON.stringify(body),
                    headers: { "Content-Type": "application/json" },
                })
            )
            expect(post.status).toBe(200)
            expect(post.ok).toBeTruthy()
            expect(await post.json()).toEqual({
                message: "Sign in with credentials",
                credentials: body,
            })
        })

        test("Credentials handler with invalid body", async () => {
            const { POST } = router
            const post = await POST(
                new Request("https://example.com/auth/credentials", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: "John",
                    }),
                })
            )
            expect(await post.json()).toEqual({
                type: "VALIDATION",
                code: "UNPROCESSABLE_ENTITY",
                message: "The request body or parameter schema layout contains input format errors.",
                details: {
                    password: {
                        code: "invalid_type",
                        message: "Invalid input: expected string, received undefined",
                    },
                },
            })
            expect(post.status).toBe(422)
        })

        test("Using handle method", async () => {
            const response = await router.handle(new Request("https://example.com/auth/session", { method: "GET" }))
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({ message: "Get user session" })
        })

        test("Types", () => {
            expectTypeOf<GetHttpHandlers<typeof router.__endpoints>>().toEqualTypeOf<{
                GET: (request: Request) => Awaitable<Response>
                POST: (request: Request) => Awaitable<Response>
                HEAD: (request: Request) => Awaitable<Response>
            }>()
        })
    })

    describe("Invalid endpoints", () => {
        test("No HTTP handlers defined", () => {
            const router = createRouter([])
            const cast = router as any
            expect(cast).not.toHaveProperty("POST")
            expect(cast).not.toHaveProperty("PUT")
        })

        test("No HTTP handlers defined but accessing GET", () => {
            const get = createEndpoint("GET", "/session", () => {
                return Response.json({ message: "Get user session" }, { status: 200 })
            })
            const router = createRouter([get])
            const cast = router as any
            expect(cast).not.toHaveProperty("POST")
            expect(cast).not.toHaveProperty("PUT")
            expect(cast.GET).toBeInstanceOf(Function)
            expect(router.GET).toBeInstanceOf(Function)
            expectTypeOf(router).toHaveProperty("GET")
            expectTypeOf(router).not.toHaveProperty("POST")
            expectTypeOf(router).not.toHaveProperty("PUT")
        })

        test("Unsupported HTTP method in route", async () => {
            const get = createEndpoint("GET", "/session", () => {
                return Response.json({ message: "Get user session" }, { status: 200 })
            })
            const { GET } = createRouter([get])
            const response = await GET(new Request("https://example.com/session", { method: "DELETE" }))
            expect(response.status).toBe(405)
            expect(response.headers.get("Allow")).toBe("GET, HEAD")
            expect(await response.json()).toEqual({
                type: "ROUTER_FLOW",
                code: "METHOD_NOT_ALLOWED",
                message: "The requested resource does not support the submitted HTTP execution method request verb.",
            })
        })

        test("Unsupported HTTP method and not found route", async () => {
            const get = createEndpoint("GET", "/session", () => Response.json({ status: 200 }))
            const { GET } = createRouter([get])

            const response = await GET(new Request("https://example.com/unknown-path", { method: "PURGE" }))
            expect(response.status).toBe(404)
            expect(await response.json()).toEqual({
                type: "ROUTER_FLOW",
                code: "NOT_FOUND",
                message:
                    "The requested route address cannot be found or is unavailable on this application endpoint server context.",
            })
        })

        test("Unsupported HTTP method and not found route using handle method", async () => {
            const get = createEndpoint("GET", "/session", () => Response.json({ status: 200 }))
            const { handle } = createRouter([get])

            const response = await handle(new Request("https://example.com/unknown-path", { method: "PURGE" }))
            expect(response.status).toBe(404)
            expect(await response.json()).toEqual({
                type: "ROUTER_FLOW",
                code: "NOT_FOUND",
                message:
                    "The requested route address cannot be found or is unavailable on this application endpoint server context.",
            })
        })

        test("Not found route with unsupported HTTP method", async () => {
            const get = createEndpoint("GET", "/session", () => Response.json({ status: 200 }))
            const { GET } = createRouter([get])

            const response = await GET(new Request("https://example.com/session/settings", { method: "GET" }))
            expect(response.status).toBe(404)
            expect(await response.json()).toEqual({
                type: "ROUTER_FLOW",
                code: "NOT_FOUND",
                message:
                    "The requested route address cannot be found or is unavailable on this application endpoint server context.",
            })
        })

        test("Not found route with unsupported HTTP method using handle method", async () => {
            const get = createEndpoint("GET", "/session", () => Response.json({ status: 200 }))
            const { handle } = createRouter([get])

            const response = await handle(new Request("https://example.com/session/settings", { method: "GET" }))
            expect(response.status).toBe(404)
            expect(await response.json()).toEqual({
                type: "ROUTER_FLOW",
                code: "NOT_FOUND",
                message:
                    "The requested route address cannot be found or is unavailable on this application endpoint server context.",
            })
        })

        test("Mismatched HTTP method", async () => {
            const get = createEndpoint("GET", "/session", () => Response.json({ status: 200 }))
            const { GET } = createRouter([get])

            const response = await GET(new Request("https://example.com/session", { method: "PATCH" }))
            expect(response.status).toBe(405)
            expect(response.headers.get("Allow")).toBe("GET, HEAD")
            expect(await response.json()).toEqual({
                type: "ROUTER_FLOW",
                code: "METHOD_NOT_ALLOWED",
                message: "The requested resource does not support the submitted HTTP execution method request verb.",
            })
        })

        test("Using handle method with unsupported HTTP method", async () => {
            const get = createEndpoint("GET", "/session", () => {
                return Response.json({ message: "Get user session" }, { status: 200 })
            })
            const router = createRouter([get])
            const response = await router.handle(new Request("https://example.com/session", { method: "DELETE" }))
            expect(response.status).toBe(405)
            expect(response.headers.get("Allow")).toBe("GET, HEAD")
            expect(await response.json()).toEqual({
                type: "ROUTER_FLOW",
                code: "METHOD_NOT_ALLOWED",
                message: "The requested resource does not support the submitted HTTP execution method request verb.",
            })
        })

        test("Includes allowed methods for a static route", async () => {
            const get = createEndpoint("GET", "/session", () => Response.json({ status: 200 }))
            const post = createEndpoint("POST", "/session", () => Response.json({ status: 200 }))
            const { handle } = createRouter([get, post])

            const response = await handle(new Request("https://example.com/session", { method: "DELETE" }))
            expect(response.status).toBe(405)
            expect(response.headers.get("Allow")).toBe("GET, HEAD, POST")
        })

        test("Includes allowed methods for a dynamic route", async () => {
            const get = createEndpoint("GET", "/users/:id", () => Response.json({ status: 200 }))
            const post = createEndpoint("POST", "/users/:id", () => Response.json({ status: 200 }))
            const remove = createEndpoint("DELETE", "/users/:id", () => Response.json({ status: 200 }))
            const { handle } = createRouter([get, post, remove])

            const response = await handle(new Request("https://example.com/users/123", { method: "PUT" }))
            expect(response.status).toBe(405)
            expect(response.headers.get("Allow")).toBe("GET, HEAD, POST, DELETE")
        })

        test("Not found route", async () => {
            const get = createEndpoint("GET", "/session", () => {
                return Response.json({ message: "Get user session" }, { status: 200 })
            })

            const { GET } = createRouter([get])

            const response = await GET(new Request("https://example.com/not-found", { method: "GET" }))

            expect(response.status).toBe(404)
            expect(await response.json()).toEqual({
                type: "ROUTER_FLOW",
                code: "NOT_FOUND",
                message:
                    "The requested route address cannot be found or is unavailable on this application endpoint server context.",
            })
        })

        test("Not found route using handle method", async () => {
            const get = createEndpoint("GET", "/session", () => {
                return Response.json({ message: "Get user session" }, { status: 200 })
            })

            const { handle } = createRouter([get])

            const response = await handle(new Request("https://example.com/not-found", { method: "GET" }))

            expect(response.status).toBe(404)
            expect(await response.json()).toEqual({
                type: "ROUTER_FLOW",
                code: "NOT_FOUND",
                message:
                    "The requested route address cannot be found or is unavailable on this application endpoint server context.",
            })
        })

        test("malformed dynamic param", async () => {
            const { handle } = createRouter([endpoint("GET", "/users/:id", "user")])
            const response = await handle(new Request("https://app.com/users/%ZZ"))

            expect(response.status).toBe(400)
            expect(await response.json()).toEqual({
                code: "BAD_REQUEST",
                type: "ROUTER_FLOW",
                message: "The request is invalid or malformed.",
            })
        })

        test("duplicated dynamic parameter name", async () => {
            expect(() => createRouter([endpoint("GET", "/p/:id/comments/:id/values/:id", "comment")])).toThrow(
                "Duplicate parameter 'id' found in route '/p/:id/comments/:id/values/:id'. Route parameters must have unique names."
            )
        })

        test("duplicated dynamic parameter name test regresion", async () => {
            expect(() => createRouter([endpoint("GET", "/:id/x", "first"), endpoint("GET", "/:id/:id", "second")])).toThrow(
                "Duplicate parameter 'id' found in route '/:id/:id'. Route parameters must have unique names."
            )
        })

        test("throws an error when registering a route pattern that exceeds 64 KB", async () => {
            const TARGET_BYTES = 64 * 1024
            const route = `/${"a".repeat(TARGET_BYTES + 1)}` as RoutePattern
            expect(() => createRouter([endpoint("GET", route, "too long")])).toThrow(
                "The registered route URI exceeds the maximum supported length and cannot be added to the router."
            )
        })

        test("returns 414 URI_TOO_LONG when incoming request URL exceeds 64 KB", async () => {
            const TARGET_BYTES = 64 * 1024
            const route = "a".repeat(TARGET_BYTES + 1) as RoutePattern

            const { handle } = createRouter([endpoint("GET", "/users/:id", "user")])
            const response = await handle(new Request(`https://app.com/${route}`))
            expect(response.status).toBe(414)
            expect(await response.json()).toEqual({
                type: "ROUTER_INIT",
                code: "URI_TOO_LONG",
                message: "The route URI is too long to be registered.",
            })
        })

        test("throws an error when registering a route pattern contains 33 segments", async () => {
            const route = `${"/a".repeat(32)}/:id` as RoutePattern
            expect(() => createRouter([endpoint("GET", route, "too long")])).toThrow(
                "The route definition contains more than the maximum supported 32 path segments."
            )
        })
    })

    describe("HEAD Method", () => {
        const { handle } = createRouter([
            createEndpoint("GET", "/home", (ctx) => {
                return ctx.json(
                    { message: "home" },
                    {
                        headers: { "x-method": ctx.method, "x-token": "123", "x-message": "home", cookie: "theme=light; Path=/" },
                    }
                )
            }),
            createEndpoint("POST", "/users", (ctx) => {
                return ctx.json({ message: "Created" })
            }),
        ])

        test("should return 200 response with body - GET /home", async () => {
            const response = await handle(new Request("https://app.com/home"))
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({ message: "home" })
            expect(Object.fromEntries(response.headers)).toEqual({
                "x-method": "GET",
                "x-token": "123",
                "x-message": "home",
                cookie: "theme=light; Path=/",
                "content-type": "application/json",
            })
        })

        test("should return 200 response without body - HEAD /home", async () => {
            const response = await handle(new Request("https://app.com/home", { method: "HEAD" }))
            expect(response.status).toBe(200)
            expect(response.body).toBeNull()
            expect(Object.fromEntries(response.headers)).toEqual({
                "x-method": "HEAD",
                "x-token": "123",
                "x-message": "home",
                cookie: "theme=light; Path=/",
                "content-type": "application/json",
            })
        })

        test("should return 405 response  - POST /users", async () => {
            const response = await handle(new Request("https://app.com/users", { method: "HEAD" }))
            expect(response.status).toBe(405)
            expect(await response.json()).toEqual({
                type: "ROUTER_FLOW",
                code: "METHOD_NOT_ALLOWED",
                message: "The requested resource does not support the submitted HTTP execution method request verb.",
            })
            expect(response.headers.get("Allow")).toBe("POST")
        })
    })

    describe("Backtrack", () => {
        test("Backtracks from a failed static route to a dynamic route", async () => {
            const { handle } = createRouter([
                endpoint("GET", "/p/new/:draft/edit", "newpost"),
                endpoint("GET", "/p/:id/comments/:cid", "comment"),
            ])
            const response = await handle(new Request("https://example.com/p/new/comments/3"))
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                name: "comment",
                params: { id: "new", cid: "3" },
            })
        })

        test("Matches a dynamic route when a static prefix has no matching endpoint", async () => {
            const { handle } = createRouter([
                endpoint("GET", "/users/profile/settings", "settings"),
                endpoint("GET", "/users/:username/posts", "posts"),
            ])
            const response = await handle(new Request("https://example.com/users/profile/posts"))
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                name: "posts",
                params: { username: "profile" },
            })
        })

        test("Falls back to a fully dynamic route after more specific branches fail", async () => {
            const { handle } = createRouter([
                endpoint("GET", "/org/engineering/teams/backend/lead", "lead"),
                endpoint("GET", "/org/engineering/teams/:team/members", "members"),
                endpoint("GET", "/org/:department/teams/backend/budget", "budget"),
                endpoint("GET", "/:entity/:department/:group/:subgroup/info", "info"),
            ])
            const response = await handle(new Request("https://example.com/org/engineering/teams/backend/info"))
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                name: "info",
                params: { entity: "org", department: "engineering", group: "teams", subgroup: "backend" },
            })
        })

        test("Backtracks to a dynamic route when the static endpoint suffix does not match", async () => {
            const { handle } = createRouter([
                endpoint("GET", "/v1/users/:userId/posts/:postId/comments/pinned", "pinned"),
                endpoint("GET", "/v1/:resourceType/:resourceId/posts/:otherId/comments/latest", "latest"),
            ])
            const response = await handle(new Request("https://example.com/v1/users/42/posts/99/comments/latest"))
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                name: "latest",
                params: {
                    resourceType: "users",
                    resourceId: "42",
                    otherId: "99",
                },
            })
        })

        test("repetitive segment trap", async () => {
            const { handle } = createRouter([
                endpoint("GET", "/a/a/a/a/a/b", "first"),
                endpoint("GET", "/a/a/a/:p1/a/c", "second"),
                endpoint("GET", "/a/:p1/a/:p2/a/d", "third"),
                endpoint("GET", "/:p1/:p2/:p3/:p4/:p5/e", "fourth"),
            ])
            const response = await handle(new Request("https://example.com/a/a/a/a/a/e"))
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                name: "fourth",
                params: { p1: "a", p2: "a", p3: "a", p4: "a", p5: "a" },
            })
        })

        test("depth mismatch", async () => {
            const { handle } = createRouter([
                endpoint("GET", "/api/v2/auth/login", "login"),
                endpoint("GET", "/api/v2/auth/login/oauth/callback", "callback"),
            ])
            const response = await handle(new Request("https://example.com/api/v2/auth/login/oauth/callback"))
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                name: "callback",
                params: {},
            })
        })

        test("zig-zag traversal", async () => {
            const { handle } = createRouter([
                endpoint("GET", "/shop/:category/shoes/:brand/sale", "sale"),
                endpoint("GET", "/shop/men/:sub/nike/:status", "status"),
                endpoint("GET", "/shop/men/shoes/nike/clearance", "clearance"),
            ])
            const response = await handle(new Request("https://example.com/shop/men/shoes/nike/sale"))
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                name: "status",
                params: { sub: "shoes", status: "sale" },
            })
        })

        test("http methods collision", async () => {
            const { handle } = createRouter([
                endpoint("POST", "/files/reports/annual/2026", "annual"),
                endpoint("GET", "/files/:folder/:subfolder/:year", "year"),
            ])
            const response = await handle(new Request("https://example.com/files/reports/annual/2026"))
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                name: "year",
                params: {
                    folder: "reports",
                    subfolder: "annual",
                    year: "2026",
                },
            })
        })

        test("dynamic params regresion", async () => {
            const { handle } = createRouter([
                endpoint("GET", "/:id/a/:item/no", "first"),
                endpoint("GET", "/:id/:section/:item", "second"),
            ])
            const response = await handle(new Request("https://example.com/outer/a/inner"))
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                name: "second",
                params: {
                    id: "outer",
                    section: "a",
                    item: "inner",
                },
            })
        })
    })

    describe("With base path", () => {
        const session = createEndpoint("GET", "/session", () => {
            return Response.json({ message: "Get user session" }, { status: 200 })
        })

        const router = createRouter([session], { basePath: "/api/auth" })

        test("Session handler with base path", async () => {
            const { GET } = router
            const get = await GET(
                new Request("https://example.com/api/auth/session", {
                    method: "GET",
                })
            )
            expect(get.status).toBe(200)
            expect(get.ok).toBeTruthy()
            expect(await get.json()).toEqual({ message: "Get user session" })
        })

        test("Session handler with missing base path", async () => {
            const { GET } = router
            const get = await GET(new Request("https://example.com/session", { method: "GET" }))
            expect(get.status).toBe(404)
            expect(get.ok).toBeFalsy()
            expect(await get.json()).toEqual({
                type: "ROUTER_FLOW",
                code: "NOT_FOUND",
                message:
                    "The requested route address cannot be found or is unavailable on this application endpoint server context.",
            })
        })

        test("Using handle method with base path", async () => {
            const response = await router.handle(new Request("https://example.com/api/auth/session", { method: "GET" }))
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({ message: "Get user session" })
        })

        test("Types", () => {
            expectTypeOf<GetHttpHandlers<typeof router.__endpoints>>().toEqualTypeOf<{
                GET: (request: Request) => Awaitable<Response>
                HEAD: (request: Request) => Awaitable<Response>
            }>()
        })
    })

    describe("With global middlewares", () => {
        const session = createEndpoint("GET", "/session", (ctx) => {
            return Response.json({ message: "Get user session" }, { status: 200, headers: ctx.headers.toHeaders() })
        })

        const signIn = createEndpoint("POST", "/auth/:oauth", (ctx) => {
            return Response.json({ message: "Sign in with OAuth" }, { status: 200, headers: ctx.headers.toHeaders() })
        })

        describe("Add headers middleware", () => {
            const router = createRouter([session, signIn], {
                use: [
                    (ctx) => {
                        ctx.request.headers.set("x-powered-by", "@aura-stack")
                        return ctx
                    },
                ],
            })
            const { GET, POST, handle } = router

            test("Add header in GET request", async () => {
                const get = await GET(new Request("https://example.com/session", { method: "GET" }))
                expect(get.status).toBe(200)
                expect(get.ok).toBeTruthy()
                expect(get.headers.get("x-powered-by")).toBe("@aura-stack")
                expect(await get.json()).toEqual({ message: "Get user session" })
            })

            test("Add header in POST request", async () => {
                const post = await POST(new Request("https://example.com/auth/google", { method: "POST" }))
                expect(post.status).toBe(200)
                expect(post.ok).toBeTruthy()
                expect(post.headers.get("x-powered-by")).toBe("@aura-stack")
                expect(await post.json()).toEqual({ message: "Sign in with OAuth" })
            })

            test("Add header in handle method", async () => {
                const response = await handle(new Request("https://example.com/session", { method: "GET" }))
                expect(response.status).toBe(200)
                expect(response.ok).toBeTruthy()
                expect(response.headers.get("x-powered-by")).toBe("@aura-stack")
                expect(await response.json()).toEqual({ message: "Get user session" })
            })

            test("Types", () => {
                expectTypeOf<GetHttpHandlers<typeof router.__endpoints>>().toEqualTypeOf<{
                    GET: (request: Request) => Awaitable<Response>
                    POST: (request: Request) => Awaitable<Response>
                    HEAD: (request: Request) => Awaitable<Response>
                }>()
            })
        })

        describe("Block request middleware", () => {
            const router = createRouter([session], {
                use: [
                    (ctx) => {
                        if (!ctx.request.headers.get("authorization")) {
                            return new Response(JSON.stringify({ message: "Forbidden" }), {
                                status: 403,
                            })
                        }
                        return ctx
                    },
                ],
            })
            const { GET, handle } = router

            test("Block request without authorization header", async () => {
                const get = await GET(new Request("https://example.com/session", { method: "GET" }))
                expect(get).toBeInstanceOf(Response)
                expect(get.status).toBe(403)
                expect(await get.json()).toEqual({ message: "Forbidden" })
            })

            test("Allow request with authorization header", async () => {
                const get = await handle(
                    new Request("https://example.com/session", { method: "GET", headers: { authorization: "Bearer token" } })
                )
                expect(get).toBeInstanceOf(Response)
                expect(get.status).toBe(200)
                expect(await get.json()).toEqual({ message: "Get user session" })
            })

            test("Types", () => {
                expectTypeOf<GetHttpHandlers<typeof router.__endpoints>>().toEqualTypeOf<{
                    GET: (request: Request) => Awaitable<Response>
                    HEAD: (request: Request) => Awaitable<Response>
                }>()
            })
        })
    })

    describe("Custom error handler", () => {
        const session = createEndpoint("GET", "/session", () => {
            throw new Error("Unexpected error in GET /session")
        })

        const getUsers = createEndpoint("GET", "/user/:userId", () => {
            throw new RouterError("BAD_REQUEST", "Invalid user ID")
        })

        test("Handle unexpected error with custom error handler", async () => {
            const { GET } = createRouter([session], {
                onError(error) {
                    return Response.json({ error: error.message }, { status: 500 })
                },
            })

            const get = await GET(new Request("https://example.com/session", { method: "GET" }))
            expect(get.status).toBe(500)
            expect(await get.json()).toEqual({ error: "Unexpected error in GET /session" })
        })

        test("Handle internal error within error handler", async () => {
            const { GET } = createRouter([session], {
                onError() {
                    throw new Error("Error within error handler")
                },
            })
            const get = await GET(new Request("https://example.com/session", { method: "GET" }))
            expect(get.status).toBe(500)
            expect(await get.json()).toEqual({
                type: "INTERNAL_SERVER_ERROR",
                code: "INTERNAL_SERVER_ERROR",
                message: "A critical failure occurred during error handling",
            })
        })

        test("Handle unexpected error with isRouterError", async () => {
            const { GET } = createRouter([getUsers], {
                onError(error) {
                    if (isRouterError(error)) {
                        return Response.json({ message: error.message }, { status: error.status })
                    }
                    return Response.json({ message: "Internal Server Error" }, { status: 500 })
                },
            })
            const get = await GET(new Request("https://example.com/user/12", { method: "GET" }))
            expect(get.status).toBe(400)
            expect(await get.json()).toEqual({ message: "Invalid user ID" })
        })
    })

    describe("Parsing context", () => {
        const getUser = createEndpoint(
            "POST",
            "/auth/credentials",
            async (ctx) => {
                /**
                 * The body is not used in this example, but we ensure that the request will be cloned by the getBody function
                 */
                await ctx.request.json()
                const { body } = ctx
                return Response.json({ message: "Get user", body }, { status: 200 })
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

        const router = createRouter([getUser])

        test("Get body with different methods", async () => {
            const { POST } = router
            const request = await POST(
                new Request("https://example.com/auth/credentials", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: "John",
                        password: "Doe",
                    }),
                })
            )
            expect(request.status).toBe(200)
            expect(await request.json()).toEqual({ message: "Get user", body: { username: "John", password: "Doe" } })
        })

        test("Get body with invalid content-type", async () => {
            const request = await router.POST(
                new Request("https://example.com/auth/credentials", {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain",
                    },
                    body: JSON.stringify({
                        username: "John",
                        password: "Doe",
                    }),
                })
            )
            expect(request.status).toBe(422)
            expect(await request.json()).toEqual({
                type: "VALIDATION",
                code: "UNPROCESSABLE_ENTITY",
                message: "The request body or parameter schema layout contains input format errors.",
                details: {
                    "": {
                        code: "invalid_type",
                        message: "Invalid input: expected object, received string",
                    },
                },
            })
        })

        test("Get body with invalid content-type using handle method", async () => {
            const request = await router.handle(
                new Request("https://example.com/auth/credentials", {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain",
                    },
                    body: JSON.stringify({
                        username: "John",
                        password: "Doe",
                    }),
                })
            )
            expect(request.status).toBe(422)
            expect(await request.json()).toEqual({
                type: "VALIDATION",
                code: "UNPROCESSABLE_ENTITY",
                message: "The request body or parameter schema layout contains input format errors.",
                details: {
                    "": {
                        code: "invalid_type",
                        message: "Invalid input: expected object, received string",
                    },
                },
            })
        })

        test("Types", () => {
            expectTypeOf<GetHttpHandlers<typeof router.__endpoints>>().toEqualTypeOf<{
                POST: (request: Request) => Awaitable<Response>
            }>()
        })
    })

    /**
     * For type-inference the user should augment the module to define the context type
     * but in this test we want to ensure that the global context is accessible even
     * without module augmentation
     */
    describe("With global context", () => {
        const endpoint = createEndpoint("GET", "/secret", (ctx) => {
            const secret = (ctx.context as any).secret
            return Response.json({ secret }, { status: 200 })
        })

        const wrongEndpoint = createEndpoint("GET", "/wrong", (ctx) => {
            const nonExistent = (ctx.context as any).nonExistent
            return Response.json({ nonExistent }, { status: 200 })
        })

        const { GET } = createRouter([endpoint, wrongEndpoint], {
            context: {
                secret: "my-global-secret",
            },
        })

        test("Access global context in endpoint without module augmentation", async () => {
            const get = await GET(new Request("https://example.com/secret", { method: "GET" }))
            expect(get.status).toBe(200)
            expect(await get.json()).toEqual({ secret: "my-global-secret" })
        })

        test("Access incorrect context property", async () => {
            const get = await GET(new Request("https://example.com/wrong", { method: "GET" }))
            expect(get.status).toBe(200)
            expect(await get.json()).toEqual({ nonExistent: undefined })
        })
    })
})
