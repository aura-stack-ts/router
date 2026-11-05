import { createEndpoint } from "@/endpoint.ts"
import { createRouter } from "@/router.ts"
import { describe, test, vi } from "vitest"
import { GETRequest, POSTRequest } from "./presets.ts"

describe("Hook composition", () => {
    test("all hooks fire in correct pipeline order", async ({ expect }) => {
        const order: string[] = []

        const endpoint = createEndpoint(
            "POST",
            "/users/:userId",
            () => {
                order.push("handler")
                return Response.json({ ok: true })
            },
            {
                hooks: {
                    onRequest: (ctx) => {
                        order.push("onRequest")
                        return ctx
                    },
                    onMatch: (ctx) => {
                        order.push("onMatch")
                        return ctx
                    },
                    onParams: (ctx) => {
                        order.push("onParams")
                        return ctx.params
                    },
                    onSearchParams: () => {
                        order.push("onSearchParams")
                        return {}
                    },
                    onBody: (ctx) => {
                        order.push("onBody")
                        return ctx.body
                    },
                    onHandler: (ctx) => {
                        order.push("onHandler")
                        return ctx
                    },
                    onResponse: (ctx) => {
                        order.push("onResponse")
                        return ctx.response
                    },
                },
            }
        )

        await createRouter([endpoint]).POST(POSTRequest("/users/1?page=1", { name: "John" }))

        expect(order).toEqual([
            "onRequest",
            "onMatch",
            "onParams",
            "onSearchParams",
            "onBody",
            "onHandler",
            "handler",
            "onResponse",
        ])
    })

    test("short-circuit in onMatch skips onParams, onBody, onHandler", async ({ expect }) => {
        const called: string[] = []
        const handler = vi.fn(() => Response.json({ ok: true }))

        const endpoint = createEndpoint("POST", "/users/:id", handler, {
            hooks: {
                onMatch: () => {
                    called.push("onMatch")
                    return Response.json({ stopped: true }, { status: 401 })
                },
                onParams: () => {
                    called.push("onParams")
                },
                onBody: () => {
                    called.push("onBody")
                },
                onHandler: () => {
                    called.push("onHandler")
                },
            },
        })

        const res = await createRouter([endpoint]).POST(POSTRequest("/users/1", {}))
        expect(res.status).toBe(401)
        expect(called).toEqual(["onMatch"])
        expect(handler).not.toHaveBeenCalled()
    })

    test("global onRequest + endpoint onMatch + global onResponse all cooperate", async ({ expect }) => {
        const endpoint = createEndpoint("GET", "/data", () => Response.json({ value: 42 }), {
            hooks: {
                onMatch: (ctx) => {
                    const req = new Request(ctx.request, {
                        headers: { ...Object.fromEntries(ctx.request.headers), "x-matched": "true" },
                    })
                    return { ...ctx, request: req }
                },
            },
        })

        const { GET: get } = createRouter([endpoint], {
            hooks: {
                onRequest: (ctx) => {
                    const req = new Request(ctx.request, {
                        headers: { ...Object.fromEntries(ctx.request.headers), "x-global-req": "true" },
                    })
                    return { ...ctx, request: req }
                },
                onResponse: (ctx) => {
                    const r = new Response(ctx.response.body, ctx.response)
                    r.headers.set("x-global-res", "true")
                    return r
                },
            },
        })

        const res = await get(GETRequest("/data"))
        expect(res.headers.get("x-global-res")).toBe("true")
        expect(await res.json()).toEqual({ value: 42 })
    })
})
