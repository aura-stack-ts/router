import { createEndpoint } from "@/endpoint.ts"
import { createRouter } from "@/router.ts"
import { describe, test } from "vitest"
import { GETRequest } from "./presets.ts"

describe("onResponse hook", () => {
    describe("Endpoint-level", () => {
        test("transforms the response returned by handler", async ({ expect }) => {
            const endpoint = createEndpoint("GET", "/data", (ctx) => ctx.json({ value: 1 }), {
                hooks: {
                    onResponse: async (ctx) => {
                        const body = await ctx.response.json()
                        return ctx.json({ ...body, extra: "added" })
                    },
                },
            })
            const res = await createRouter([endpoint]).GET(GETRequest("/data"))
            expect(await res.json()).toEqual({ value: 1, extra: "added" })
        })

        test("can add response headers using ctx", async ({ expect }) => {
            const endpoint = createEndpoint("GET", "/data", (ctx) => ctx.json({ ok: true }), {
                hooks: {
                    onResponse: (ctx) => {
                        const clone = ctx.json(ctx.response.body, ctx.response)
                        clone.headers.set("x-hook", "response-hook")
                        return clone
                    },
                },
            })
            const res = await createRouter([endpoint]).GET(GETRequest("/data"))
            expect(res.headers.get("x-hook")).toBe("response-hook")
        })

        test("always must return a Response (no void support)", async ({ expect }) => {
            const endpoint = createEndpoint("GET", "/data", (ctx) => ctx.json({ ok: true }), {
                hooks: {
                    onResponse: (ctx) => ctx.response,
                },
            })
            const res = await createRouter([endpoint]).GET(GETRequest("/data"))
            expect(res.status).toBe(200)
        })
    })

    describe("Global-level (RouterConfig.hooks)", () => {
        test("wraps responses from all endpoints", async ({ expect }) => {
            const a = createEndpoint("GET", "/a", (ctx) => ctx.json({ route: "a" }))
            const b = createEndpoint("GET", "/b", (ctx) => ctx.json({ route: "b" }))
            const router = createRouter([a, b], {
                hooks: {
                    onResponse: (ctx) => {
                        const wrapped = ctx.json(ctx.response.body, ctx.response)
                        wrapped.headers.set("x-global-response", "true")
                        return wrapped
                    },
                },
            })
            const resA = await router.GET(GETRequest("/a"))
            const resB = await router.GET(GETRequest("/b"))
            expect(resA.headers.get("x-global-response")).toBe("true")
            expect(resB.headers.get("x-global-response")).toBe("true")
        })

        test("endpoint onResponse runs before global onResponse", async ({ expect }) => {
            const order: string[] = []
            const endpoint = createEndpoint("GET", "/order", (ctx) => ctx.json({ ok: true }), {
                hooks: {
                    onResponse: (ctx) => {
                        order.push("endpoint")
                        return ctx.response
                    },
                },
            })
            const { GET: get } = createRouter([endpoint], {
                hooks: {
                    onResponse: (ctx) => {
                        order.push("global")
                        return ctx.response
                    },
                },
            })
            await get(GETRequest("/order"))
            expect(order).toEqual(["endpoint", "global"])
        })
    })
})
