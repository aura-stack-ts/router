import { createEndpoint } from "@/endpoint.ts"
import { createRouter } from "@/router.ts"
import { describe, test, vi } from "vitest"
import { GETRequest } from "@test/hooks/presets.ts"

describe("onParams hook (replaces getRouteParams)", () => {
    test("receives raw trie params and handler gets hook result", async ({ expect }) => {
        let rawReceived: Record<string, string> | null = null
        const endpoint = createEndpoint("GET", "/users/:userId", (ctx) => ctx.json({ userId: ctx.params.userId }), {
            hooks: {
                onParams: (ctx) => {
                    rawReceived = ctx.params
                    return { userId: `transformed-${ctx.params.userId}` }
                },
            },
        })
        const response = await createRouter([endpoint]).GET(GETRequest("/users/123"))
        expect(rawReceived).toEqual({ userId: "123" })
        expect(await response.json()).toEqual({ userId: "transformed-123" })
    })

    test("void return — raw params passed as-is to handler", async ({ expect }) => {
        const endpoint = createEndpoint("GET", "/users/:userId", (ctx) => ctx.json({ userId: ctx.params.userId }), {
            hooks: {
                onParams: async () => {
                    /* void */
                },
            },
        })
        const response = await createRouter([endpoint]).GET(GETRequest("/users/99"))
        expect(await response.json()).toEqual({ userId: "99" })
    })

    test("returns Response — short-circuits pipeline", async ({ expect }) => {
        const handler = vi.fn(() => Response.json({ ok: true }))
        const endpoint = createEndpoint("GET", "/users/:userId", handler, {
            hooks: {
                onParams: () => Response.json({ error: "bad params" }, { status: 422 }),
            },
        })
        const res = await createRouter([endpoint]).GET(GETRequest("/users/bad"))
        expect(res.status).toBe(422)
        expect(await res.json()).toEqual({ error: "bad params" })
        expect(handler).not.toHaveBeenCalled()
    })

    test("when defined, schema validation in getRouteParams is skipped", async ({ expect }) => {
        const endpoint = createEndpoint("GET", "/auth/:oauth", (ctx) => ctx.json({ oauth: ctx.params.oauth }), {
            hooks: {
                onParams: (ctx) => {
                    return {
                        oauth: ctx.params.oauth.toUpperCase(),
                    }
                },
            },
        })
        const res = await createRouter([endpoint]).GET(GETRequest("/auth/not-a-valid-oauth"))
        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({ oauth: "NOT-A-VALID-OAUTH" })
    })

    test("receives MatchHookContext with route and method", async ({ expect }) => {
        let ctxCapture: { route: string; method: string } | null = null

        const endpoint = createEndpoint("GET", "/users/:userId", (ctx) => ctx.json({ ok: true }), {
            hooks: {
                onParams: (ctx) => {
                    ctxCapture = { route: ctx.route, method: ctx.method }
                },
            },
        })
        await createRouter([endpoint]).GET(GETRequest("/users/1"))
        expect(ctxCapture).toEqual({ route: "/users/:userId", method: "GET" })
    })
})
