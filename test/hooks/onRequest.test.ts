import { createEndpoint } from "@/endpoint.ts"
import { createRouter } from "@/router.ts"
import { describe, test, vi } from "vitest"
import { GETRequest } from "./presets.ts"

describe("onRequest hook", () => {
    describe("Endpoint-level", () => {
        test("pass-through (void) — handler runs normally", async ({ expect }) => {
            const endpoint = createEndpoint("GET", "/users", (ctx) => ctx.json({ ok: true }), {
                hooks: {
                    onRequest: async () => {
                        /* void */
                    },
                },
            })
            const { GET } = createRouter([endpoint])
            const res = await GET(GETRequest("/users"))
            expect(res.status).toBe(200)
            expect(await res.json()).toEqual({ ok: true })
        })

        test("mutates context — modified request is available in handler", async ({ expect }) => {
            const endpoint = createEndpoint("GET", "/users", (ctx) => ctx.json({ header: ctx.request.headers.get("x-hook") }), {
                hooks: {
                    onRequest: (ctx) => {
                        ctx.request.headers.set("x-hook", "injected")
                        return ctx
                    },
                },
            })
            const { GET } = createRouter([endpoint])
            const res = await GET(GETRequest("/users"))
            expect(await res.json()).toEqual({ header: "injected" })
        })

        test("returns Response — short-circuits pipeline, handler never runs", async ({ expect }) => {
            const handler = vi.fn(() => Response.json({ ok: true }))

            const endpoint = createEndpoint("GET", "/users", handler, {
                hooks: {
                    onRequest: (ctx) => ctx.json({ blocked: true }, { status: 401 }),
                },
            })
            const { GET } = createRouter([endpoint])
            const res = await GET(GETRequest("/users"))
            expect(res.status).toBe(401)
            expect(await res.json()).toEqual({ blocked: true })
            expect(handler).not.toHaveBeenCalled()
        })
    })

    describe("Global-level (RouterConfig.hooks)", () => {
        test("applies to all endpoints in the router", async ({ expect }) => {
            const first = createEndpoint("GET", "/first", (ctx) => ctx.json({ route: "first" }))
            const second = createEndpoint("POST", "/second", (ctx) =>
                ctx.json(
                    { route: "second", headers: ctx.headers.getHeader("x-global")! },
                    {
                        headers: ctx.headers.toHeaders(),
                    }
                )
            )
            const router = createRouter([first, second], {
                hooks: {
                    onRequest: (ctx) => {
                        ctx.request.headers.set("x-global", "yes")
                        return ctx
                    },
                },
            })
            const responseA = await router.GET(GETRequest("/first"))
            const responseB = await router.POST(new Request("https://example.com/second", { method: "POST" }))
            expect(await responseA.json()).toEqual({ route: "first" })
            expect(await responseB.json()).toEqual({ route: "second", headers: "yes" })
            expect(responseA.headers.get("x-global")).toBeNull()
            expect(responseA.ok).toBe(true)
            expect(responseB.headers.get("x-global")).toBe("yes")
            expect(responseB.ok).toBe(true)
        })

        test("global onRequest short-circuits before endpoint runs", async ({ expect }) => {
            const handler = vi.fn(() => Response.json({ ok: true }))
            const endpoint = createEndpoint("GET", "/secret", handler)
            const { GET } = createRouter([endpoint], {
                hooks: {
                    onRequest: (ctx) => ctx.json({ error: "forbidden" }, { status: 403 }),
                },
            })
            const response = await GET(GETRequest("/secret"))
            expect(response.status).toBe(403)
            expect(await response.json()).toEqual({ error: "forbidden" })
            expect(handler).not.toHaveBeenCalled()
        })

        test("global runs before endpoint onRequest", async ({ expect }) => {
            const order: string[] = []
            const endpoint = createEndpoint("GET", "/order", (ctx) => ctx.json({ order }), {
                hooks: {
                    onRequest: (ctx) => {
                        order.push("endpoint")
                        return ctx
                    },
                },
            })
            const { GET: get } = createRouter([endpoint], {
                hooks: {
                    onRequest: (ctx) => {
                        order.push("global")
                        return ctx
                    },
                },
            })
            await get(GETRequest("/order"))
            expect(order).toEqual(["global", "endpoint"])
        })
    })
})
