import { createEndpoint } from "@/endpoint.ts"
import { createRouter } from "@/router.ts"
import { describe, test, vi } from "vitest"
import { GETRequest } from "./presets.ts"

describe("onHandler hook", () => {
    test("pass-through (void) — handler receives unchanged context", async ({ expect }) => {
        const endpoint = createEndpoint("GET", "/ping", (ctx) => ctx.json({ pong: true }), {
            hooks: { onHandler: async () => {} },
        })
        const response = await createRouter([endpoint]).GET(GETRequest("/ping"))
        expect(await response.json()).toEqual({ pong: true })
    })

    test("mutates context before handler — handler sees modified ctx", async ({ expect }) => {
        const endpoint = createEndpoint("GET", "/users/:userId", (ctx) => ctx.json({ userId: ctx.params.userId }), {
            hooks: {
                onHandler: (ctx) => {
                    ctx.params = { userId: "overridden" }
                    return ctx
                },
            },
        })
        const response = await createRouter([endpoint]).GET(GETRequest("/users/123"))
        expect(await response.json()).toEqual({ userId: "overridden" })
    })

    test("returns Response — short-circuits before handler call", async ({ expect }) => {
        const handler = vi.fn(() => Response.json({ ok: true }))
        const endpoint = createEndpoint("GET", "/users", handler, {
            hooks: {
                onHandler: (ctx) => ctx.json({ intercepted: true }, { status: 202 }),
            },
        })
        const response = await createRouter([endpoint]).GET(GETRequest("/users"))
        expect(response.status).toBe(202)
        expect(await response.json()).toEqual({ intercepted: true })
        expect(handler).not.toHaveBeenCalled()
    })

    test("runs after endpoint middlewares", async ({ expect }) => {
        const order: string[] = []
        const endpoint = createEndpoint(
            "GET",
            "/order",
            (ctx) => {
                order.push("handler")
                return ctx.json({ order })
            },
            {
                use: [
                    (ctx) => {
                        order.push("middleware")
                        return ctx
                    },
                ],
                hooks: {
                    onHandler: (ctx) => {
                        order.push("onHandler")
                        return ctx
                    },
                },
            }
        )
        const response = await createRouter([endpoint]).GET(GETRequest("/order"))
        const body = await response.json()
        expect(body.order).toEqual(["middleware", "onHandler", "handler"])
    })

    test("throws error", async ({ expect }) => {
        const endpoint = createEndpoint("GET", "/ping", (ctx) => ctx.json({ pong: true }), {
            hooks: {
                onHandler: async () => {
                    throw new Error("onHandler error")
                },
                onError: (ctx) => {
                    return ctx.json({ phase: ctx.phase })
                },
            },
        })
        const response = await createRouter([endpoint]).GET(GETRequest("/ping"))
        expect(await response.json()).toEqual({ phase: "onHandler" })
    })
})
