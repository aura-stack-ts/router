import z from "zod"
import { describe, expect, test } from "vitest"
import { executeGlobalMiddlewares, executeMiddlewares } from "../src/middlewares.js"
import type { MiddlewareFunction, RequestContext } from "../src/types.js"

describe("executeGlobalMiddlewares", () => {
    test("No middlewares", async () => {
        const request = new Request("https://example.com")
        const result = await executeGlobalMiddlewares(request, undefined)
        expect(result).toEqual(request)
    })

    test("Single middleware that modifies request", async () => {
        const request = new Request("https://example.com")
        const middleware = async (req: Request) => {
            const newHeaders = new Headers(req.headers)
            newHeaders.set("X-Test", "true")
            return new Request(req, { headers: newHeaders })
        }
        const result = await executeGlobalMiddlewares(request, [middleware])
        expect(result.headers.get("X-Test")).toBe("true")
        expect(request.headers.get("X-Test")).toBeNull()
    })

    test("Middleware updates headers directly", async () => {
        const request = new Request("https://example.com")
        const middleware = async (req: Request) => {
            req.headers.set("X-Test-Direct", "true")
            return req
        }
        const result = await executeGlobalMiddlewares(request, [middleware])
        expect(result.headers.get("X-Test-Direct")).toBe("true")
        expect(request.headers.get("X-Test-Direct")).toBe("true")
    })

    test("Multiple middlewares", async () => {
        const request = new Request("https://example.com")
        const middleware1 = async (req: Request) => {
            const newHeaders = new Headers(req.headers)
            newHeaders.set("X-Test-1", "true")
            return new Request(req, { headers: newHeaders })
        }
        const middleware2 = async (req: Request) => {
            const newHeaders = new Headers(req.headers)
            newHeaders.set("X-Test-2", "true")
            return new Request(req, { headers: newHeaders })
        }
        const result = await executeGlobalMiddlewares(request, [middleware1, middleware2])
        expect(result.headers.get("X-Test-1")).toBe("true")
        expect(result.headers.get("X-Test-2")).toBe("true")
        expect(request.headers.get("X-Test-1")).toBeNull()
        expect(request.headers.get("X-Test-2")).toBeNull()
    })

    test("Middleware that returns a Response", async () => {
        const request = new Request("https://example.com")
        const middleware = async () => {
            return new Response("Blocked", { status: 403 })
        }
        const result = await executeGlobalMiddlewares(request, [middleware])
        expect(result).toBeInstanceOf(Response)
        expect((result as Response).status).toBe(403)
    })
})

describe("executeMiddlewares", () => {
    test.concurrent("Middleware with searchParams and headers context", async ({ expect }) => {
        const middlewares: MiddlewareFunction[] = [
            async (ctx) => {
                ctx.searchParams.set("code", "123abc")
                ctx.headers.set("Content-Type", "application/json")
                return ctx
            },
        ]
        const ctx = await executeMiddlewares(
            {
                searchParams: new URL("https://example.com").searchParams,
                headers: new Headers(),
                request: new Request("https://example.com"),
            } as RequestContext,
            middlewares
        )
        expect(ctx.searchParams.get("code")).toBe("123abc")
        expect(ctx.headers.get("Content-Type")).toBe("application/json")
    })

    test.concurrent("Two middlewares with searchParams and headers context", async ({ expect }) => {
        const middlewares: MiddlewareFunction[] = [
            async (ctx) => {
                ctx.searchParams.set("code", "123abc")
                ctx.searchParams.set("state", "xyz")
                return ctx
            },
            async (ctx) => {
                ctx.searchParams.set("state", "abc")
                ctx.headers.set("Authorization", "Bearer token")
                return ctx
            },
        ]
        const ctx = await executeMiddlewares(
            {
                searchParams: new URL("https://example.com").searchParams,
                headers: new Headers(),
                request: new Request("https://example.com"),
            } as RequestContext,
            middlewares
        )
        expect(ctx.searchParams.get("code")).toBe("123abc")
        expect(ctx.searchParams.get("state")).toBe("abc")
        expect(ctx.headers.get("Authorization")).toBe("Bearer token")
    })

    test.concurrent("Invalid middleware", async ({ expect }) => {
        const middlewares: MiddlewareFunction[] = [undefined as any]
        await expect(
            executeMiddlewares(
                {
                    searchParams: new URL("https://example.com").searchParams,
                    headers: new Headers(),
                    request: new Request("https://example.com"),
                } as RequestContext,
                middlewares
            )
        ).rejects.toThrowError(/Handler threw an error/)
    })

    test.concurrent("No middleware", async ({ expect }) => {
        const ctx = await executeMiddlewares({
            searchParams: new URL("https://example.com").searchParams,
            headers: new Headers(),
            request: new Request("https://example.com"),
        } as RequestContext)
        expect(ctx.searchParams.get("code")).toBe(null)
        expect(ctx.searchParams.get("state")).toBe(null)
        expect(ctx.headers.get("Content-Type")).toBe(null)
    })

    test.concurrent("Middleware with schema", async ({ expect }) => {
        const searchParamsShema = z.object({
            code: z.string().optional,
            state: z.string().optional(),
        })
        const middlewares: MiddlewareFunction<Record<string, string>, { schemas: { searchParams: typeof searchParamsShema } }>[] =
            [
                async (ctx) => {
                    ctx.searchParams.code = "123abc"
                    ctx.searchParams.state = "xyz"
                    return ctx
                },
            ]

        const ctx = await executeMiddlewares(
            {
                headers: new Headers(),
                searchParams: {
                    code: "123abc",
                    state: "xyz",
                },
                params: {},
                body: undefined,
                request: new Request("https://example.com"),
            } as RequestContext<Record<string, string>, { schemas: { searchParams: typeof searchParamsShema } }>,
            middlewares
        )

        expect(ctx.searchParams.code).toBe("123abc")
        expect(ctx.searchParams.state).toBe("xyz")
    })
})
