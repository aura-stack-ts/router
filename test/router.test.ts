import z from "zod"
import { describe, expect, expectTypeOf, test } from "vitest"
import { RouterError } from "../src/error.js"
import { createRouter } from "../src/router.js"
import { isRouterError } from "../src/assert.js"
import { createEndpoint, createEndpointConfig } from "../src/endpoint.js"

describe("createRouter", () => {
    describe("OAuth endpoints", () => {
        const signInConfig = createEndpointConfig("/auth/signin/:oauth", {
            schemas: {
                searchParams: z.object({
                    redirect_uri: z.string(),
                }),
            },
        })
        const sessionConfig = createEndpointConfig({
            middlewares: [
                (ctx) => {
                    ctx.headers.set("session-token", "123abc-token")
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

        const router = createRouter([signIn, callback, session, credentials])

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
            expect(await get.json()).toMatchObject({ error: "validation_error", details: {} })
        })

        test("Sign-in handler with missing route param", async () => {
            const { GET } = router
            const get = await GET(new Request("https://example.com/auth/signin?redirect_uri=url_to_redirect", { method: "GET" }))
            expect(get.status).toBe(404)
            expect(get.ok).toBeFalsy()
            expect(await get.json()).toEqual({ message: "No route found for path: /auth/signin" })
        })

        test("Session handler with middleware", async () => {
            const { GET } = router
            const get = await GET(new Request("https://example.com/auth/session", { method: "GET" }))
            expect(get.status).toBe(200)
            expect(get.ok).toBeTruthy()
            expect(await get.json()).toEqual({ message: "Get user session" })
            expect(get.headers.get("session-token")).toBe("123abc-token")
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
            expect(await post.json()).toMatchObject({ error: "validation_error", details: {} })
            expect(post.status).toBe(422)
        })
    })

    describe("Invalid endpoints", () => {
        test("No HTTP handlers defined", async () => {
            const router = createRouter([])
            const cast = router as any
            expect(cast).not.toHaveProperty("POST")
            expect(cast).not.toHaveProperty("PUT")
        })

        test("No HTTP handlers defined but accessing GET", async () => {
            const get = createEndpoint("GET", "/session", async () => {
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
            const get = createEndpoint("GET", "/session", async () => {
                return Response.json({ message: "Get user session" }, { status: 200 })
            })
            const { GET } = createRouter([get])
            const response = await GET(new Request("https://example.com/session", { method: "DELETE" }))
            expect(response.status).toBe(405)
            expect(await response.json()).toEqual({ message: "The HTTP method 'DELETE' is not allowed" })
        })
    })

    describe("With base path", () => {
        const session = createEndpoint("GET", "/session", async () => {
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
            expect(await get.json()).toEqual({ message: "No route found for path: /session" })
        })
    })

    describe("With global middlewares", () => {
        const session = createEndpoint("GET", "/session", async (ctx) => {
            return Response.json({ message: "Get user session" }, { status: 200, headers: ctx.headers.toHeaders() })
        })

        const signIn = createEndpoint("POST", "/auth/:oauth", async (ctx) => {
            return Response.json({ message: "Sign in with OAuth" }, { status: 200, headers: ctx.headers.toHeaders() })
        })

        describe("Add headers middleware", async () => {
            const router = createRouter([session, signIn], {
                middlewares: [
                    async (ctx) => {
                        ctx.request.headers.set("x-powered-by", "@aura-stack")
                        return ctx
                    },
                ],
            })
            const { GET, POST } = router

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
        })

        describe("Block request middleware", async () => {
            const router = createRouter([session], {
                middlewares: [
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
            const { GET } = router

            test("Block request without authorization header", async () => {
                const get = await GET(new Request("https://example.com/session", { method: "GET" }))
                expect(get).toBeInstanceOf(Response)
                expect(get.status).toBe(403)
                expect(await get.json()).toEqual({ message: "Forbidden" })
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
            expect(await get.json()).toEqual({ message: "A critical failure occurred during error handling" })
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

    describe("Parsing context", async () => {
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
    })

    /**
     * For type-inference the user should augment the module to define the context type
     * but in this test we want to ensure that the global context is accessible even
     * without module augmentation
     */
    describe("With global context", () => {
        const endpoint = createEndpoint("GET", "/secret", async (ctx) => {
            const secret = (ctx.context as any).secret
            return Response.json({ secret }, { status: 200 })
        })

        const wrongEndpoint = createEndpoint("GET", "/wrong", async (ctx) => {
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
