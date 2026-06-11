import { createEndpoint } from "@/endpoint.ts"
import { createRouter } from "@/router.ts"
import { describe, test, vi } from "vitest"
import { POSTRequest } from "./presets.ts"

describe("onBody hook (replaces getBody schema validation)", () => {
    test("receives raw parsed body and handler gets hook result", async ({ expect }) => {
        const endpoint = createEndpoint("POST", "/login", (ctx) => ctx.json({ body: ctx.body }), {
            hooks: {
                onBody: async (ctx) => {
                    const body = await ctx.request.json()
                    return { ...body, role: "admin" }
                },
            },
        })
        const response = await createRouter([endpoint]).POST(POSTRequest("/login", { username: "john" }))
        expect(await response.json()).toEqual({ body: { username: "john", role: "admin" } })
    })

    test("void return — raw parsed body passed as-is to handler", async ({ expect }) => {
        const endpoint = createEndpoint("POST", "/login", (ctx) => ctx.json({ body: ctx.body }), {
            hooks: { onBody: async () => {} },
        })
        const response = await createRouter([endpoint]).POST(POSTRequest("/login", { username: "jane" }))
        expect(await response.json()).toEqual({ body: { username: "jane" } })
    })

    test("returns Response — short-circuits pipeline", async ({ expect }) => {
        const handler = vi.fn(() => Response.json({ ok: true }))
        const endpoint = createEndpoint("POST", "/login", handler, {
            hooks: {
                onBody: () => Response.json({ error: "invalid payload" }, { status: 400 }),
            },
        })
        const response = await createRouter([endpoint]).POST(POSTRequest("/login", {}))
        expect(response.status).toBe(400)
        expect(handler).not.toHaveBeenCalled()
    })

    test("when defined, schema validation in getBody is skipped (invalid body still accepted)", async ({ expect }) => {
        const endpoint = createEndpoint("POST", "/login", (ctx) => ctx.json({ body: ctx.body }), {
            hooks: {
                onBody: async (ctx) => await ctx.request.json(),
            },
        })
        const response = await createRouter([endpoint]).POST(POSTRequest("/login", { username: "only" }))
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ body: { username: "only" } })
    })

    test("receives MatchHookContext with request", async ({ expect }) => {
        let hasRequest = false
        const endpoint = createEndpoint("POST", "/data", (ctx) => ctx.json({ body: ctx.body, ok: true }), {
            hooks: {
                onBody: async (ctx) => {
                    hasRequest = ctx.request instanceof Request
                    return ctx.body
                },
            },
        })
        const response = await createRouter([endpoint]).POST(POSTRequest("/data", { value: 123 }))
        expect(hasRequest).toBe(true)
        expect(await response.json()).toEqual({ body: { value: 123 }, ok: true })
    })
})
