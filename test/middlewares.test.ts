import z from "zod"
import { describe, expect, test } from "vitest"
import { HeadersBuilder } from "@/headers.ts"
import { executeGlobalMiddlewares, executeMiddlewares } from "@/middlewares.ts"
import type { GlobalMiddlewareContext, MiddlewareFunction, RequestContext } from "@/types.ts"

describe("executeGlobalMiddlewares", () => {
    test("No middlewares", async () => {
        const request = new Request("https://example.com")
        const ctx = await executeGlobalMiddlewares({ request, context: {} }, undefined)
        expect(ctx).toEqual({ request, context: {} })
    })

    test("Single middleware that modifies request", async () => {
        const request = new Request("https://example.com")
        const middleware = (ctx: GlobalMiddlewareContext) => {
            const newHeaders = new Headers(ctx.request.headers)
            newHeaders.set("X-Test", "true")
            return { ...ctx, request: new Request(ctx.request, { headers: newHeaders }) }
        }
        const ctx = (await executeGlobalMiddlewares({ request, context: {} }, [middleware])) as GlobalMiddlewareContext
        expect(ctx.request.headers.get("X-Test")).toBe("true")
        expect(request.headers.get("X-Test")).toBeNull()
    })

    test("Middleware updates headers directly", async () => {
        const request = new Request("https://example.com")
        const middleware = (ctx: GlobalMiddlewareContext) => {
            ctx.request.headers.set("X-Test-Direct", "true")
            return ctx
        }
        const ctx = (await executeGlobalMiddlewares({ request, context: {} }, [middleware])) as GlobalMiddlewareContext
        expect(ctx.request.headers.get("X-Test-Direct")).toBe("true")
        expect(request.headers.get("X-Test-Direct")).toBe("true")
    })

    test("Multiple middlewares", async () => {
        const request = new Request("https://example.com")
        const middleware1 = (ctx: GlobalMiddlewareContext) => {
            const newHeaders = new Headers(ctx.request.headers)
            newHeaders.set("X-Test-1", "true")
            return { ...ctx, request: new Request(ctx.request, { headers: newHeaders }) }
        }
        const middleware2 = (ctx: GlobalMiddlewareContext) => {
            const newHeaders = new Headers(ctx.request.headers)
            newHeaders.set("X-Test-2", "true")
            return { ...ctx, request: new Request(ctx.request, { headers: newHeaders }) }
        }
        const ctx = (await executeGlobalMiddlewares({ request, context: {} }, [
            middleware1,
            middleware2,
        ])) as GlobalMiddlewareContext
        expect(ctx.request.headers.get("X-Test-1")).toBe("true")
        expect(ctx.request.headers.get("X-Test-2")).toBe("true")
        expect(request.headers.get("X-Test-1")).toBeNull()
        expect(request.headers.get("X-Test-2")).toBeNull()
    })

    test("Middleware that returns a Response", async () => {
        const request = new Request("https://example.com")
        const middleware = () => {
            return new Response("Blocked", { status: 403 })
        }
        const result = await executeGlobalMiddlewares({ request, context: {} }, [middleware])
        expect(result).toBeInstanceOf(Response)
        expect((result as Response).status).toBe(403)
    })

    test("override global context in middleware", async () => {
        const request = new Request("https://example.com")
        const middleware = (ctx: GlobalMiddlewareContext) => {
            ;(ctx.context as any).modified = true
            return { request: new Request("https://modified.com"), context: ctx.context }
        }
        const ctx = (await executeGlobalMiddlewares({ request, context: { modified: false } }, [
            middleware,
        ])) as GlobalMiddlewareContext
        expect(ctx.request.url).toBe("https://modified.com/")
        expect((ctx.context as any).modified).toBe(true)
    })
})

describe("executeMiddlewares", () => {
    test.concurrent("Middleware with searchParams and headers context", async ({ expect }) => {
        const middlewares: MiddlewareFunction[] = [
            (ctx) => {
                ctx.searchParams.set("code", "123abc")
                ctx.headers.setHeader("Content-Type", "application/json")
                return ctx
            },
        ]
        const ctx = await executeMiddlewares(
            {
                searchParams: new URL("https://example.com").searchParams,
                headers: new HeadersBuilder(),
                request: new Request("https://example.com"),
            } as RequestContext,
            middlewares
        )
        expect(ctx.searchParams.get("code")).toBe("123abc")
        expect(ctx.headers.getHeader("Content-Type")).toBe("application/json")
    })

    test.concurrent("Two middlewares with searchParams and headers context", async ({ expect }) => {
        const middlewares: MiddlewareFunction[] = [
            (ctx) => {
                ctx.searchParams.set("code", "123abc")
                ctx.searchParams.set("state", "xyz")
                return ctx
            },
            (ctx) => {
                ctx.searchParams.set("state", "abc")
                ctx.headers.setHeader("Authorization", "Bearer token")
                return ctx
            },
        ]
        const ctx = await executeMiddlewares(
            {
                searchParams: new URL("https://example.com").searchParams,
                headers: new HeadersBuilder(),
                request: new Request("https://example.com"),
            } as RequestContext,
            middlewares
        )
        expect(ctx.searchParams.get("code")).toBe("123abc")
        expect(ctx.searchParams.get("state")).toBe("abc")
        expect(ctx.headers.getHeader("Authorization")).toBe("Bearer token")
    })

    test.concurrent("Invalid middleware", async ({ expect }) => {
        const middlewares: MiddlewareFunction[] = [undefined as any]
        await expect(
            executeMiddlewares(
                {
                    searchParams: new URL("https://example.com").searchParams,
                    headers: new HeadersBuilder(),
                    request: new Request("https://example.com"),
                } as RequestContext,
                middlewares
            )
        ).rejects.toThrowError(/Handler threw an error/)
    })

    test.concurrent("No middleware", async ({ expect }) => {
        const ctx = await executeMiddlewares({
            searchParams: new URL("https://example.com").searchParams,
            headers: new HeadersBuilder(),
            request: new Request("https://example.com"),
        } as RequestContext)
        expect(ctx.searchParams.get("code")).toBe(null)
        expect(ctx.searchParams.get("state")).toBe(null)
        expect(ctx.headers.getHeader("Content-Type")).toBe(null)
    })

    test.concurrent("Middleware with schema", async ({ expect }) => {
        const searchParamsShema = z.object({
            code: z.string().optional,
            state: z.string().optional(),
        })
        const middlewares: MiddlewareFunction<Record<string, string>, { schemas: { searchParams: typeof searchParamsShema } }>[] =
            [
                (ctx) => {
                    ctx.searchParams.code = "123abc"
                    ctx.searchParams.state = "xyz"
                    return ctx
                },
            ]

        const ctx = await executeMiddlewares(
            {
                headers: new HeadersBuilder(),
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
