import { createEndpoint } from "@/endpoint.ts"
import { createRouter } from "@/router.ts"
import { describe, test, vi } from "vitest"
import { GETRequest } from "./presets.ts"

describe("onMatch hook", () => {
    test("pass-through (void) — handler runs normally", async ({ expect }) => {
        const endpoint = createEndpoint("GET", "/items", (ctx) => ctx.json({ ok: true }), {
            hooks: { onMatch: async () => {} },
        })
        const res = await createRouter([endpoint]).GET(GETRequest("/items"))
        expect(res.status).toBe(200)
    })

    test("receives correct route and method in context", async ({ expect }) => {
        let captured: { route: string; method: string } | null = null
        const endpoint = createEndpoint("GET", "/items/:id", (ctx) => ctx.json({ ok: true }), {
            hooks: {
                onMatch: (ctx) => {
                    captured = { route: ctx.route, method: ctx.method }
                    return ctx
                },
            },
        })
        await createRouter([endpoint]).GET(GETRequest("/items/42"))
        expect(captured).toEqual({ route: "/items/:id", method: "GET" })
    })

    test("returns Response — short-circuits before params/body extraction", async ({ expect }) => {
        const handler = vi.fn(() => Response.json({ ok: true }))
        const endpoint = createEndpoint("GET", "/items/:id", handler, {
            hooks: {
                onMatch: (ctx) => ctx.json({ error: "not allowed" }, { status: 403 }),
            },
        })
        const response = await createRouter([endpoint]).GET(GETRequest("/items/42"))
        expect(response.status).toBe(403)
        expect(await response.json()).toEqual({ error: "not allowed" })
        expect(handler).not.toHaveBeenCalled()
    })
})
