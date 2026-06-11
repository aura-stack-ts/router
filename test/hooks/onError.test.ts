import { createEndpoint } from "@/endpoint.ts"
import { createRouter } from "@/router.ts"
import { describe, test } from "vitest"
import { GETRequest } from "./presets.ts"

describe("onError hook", () => {
    describe("Endpoint-level", () => {
        test("handles errors thrown in the handler", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/fail",
                () => {
                    throw new Error("boom")
                },
                {
                    hooks: {
                        onError: (ctx) => Response.json({ caught: (ctx.error as Error).message }, { status: 500 }),
                    },
                }
            )
            const res = await createRouter([endpoint]).GET(GETRequest("/fail"))
            expect(res.status).toBe(500)
            expect(await res.json()).toEqual({ caught: "boom" })
        })

        test("receives error context with request", async ({ expect }) => {
            let ctxHasRequest = false
            const endpoint = createEndpoint(
                "GET",
                "/fail",
                () => {
                    throw new Error("test")
                },
                {
                    hooks: {
                        onError: (ctx) => {
                            ctxHasRequest = ctx.request instanceof Request
                            return Response.json({ error: true }, { status: 500 })
                        },
                    },
                }
            )
            await createRouter([endpoint]).GET(GETRequest("/fail"))
            expect(ctxHasRequest).toBe(true)
        })

        test("endpoint onError takes precedence over global onError", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/fail",
                () => {
                    throw new Error("test")
                },
                {
                    hooks: {
                        onError: () => Response.json({ source: "endpoint" }, { status: 500 }),
                    },
                }
            )
            const { GET: get } = createRouter([endpoint], {
                hooks: {
                    onError: () => Response.json({ source: "global" }, { status: 500 }),
                },
            })
            const res = await get(GETRequest("/fail"))
            expect(await res.json()).toEqual({ source: "endpoint" })
        })
    })

    describe("Global-level (RouterConfig.hooks)", () => {
        test("handles errors from any endpoint", async ({ expect }) => {
            const a = createEndpoint("GET", "/a", () => {
                throw new Error("a-error")
            })
            const b = createEndpoint("GET", "/b", () => {
                throw new Error("b-error")
            })
            const router = createRouter([a, b], {
                hooks: {
                    onError: (ctx) => Response.json({ error: (ctx.error as Error).message }, { status: 500 }),
                },
            })
            const resA = await router.GET(GETRequest("/a"))
            const resB = await router.GET(GETRequest("/b"))
            expect(await resA.json()).toEqual({ error: "a-error" })
            expect(await resB.json()).toEqual({ error: "b-error" })
        })

        test("global onError runs when no endpoint onError is defined", async ({ expect }) => {
            const endpoint = createEndpoint("GET", "/fail", () => {
                throw new Error("fallback")
            })
            const { GET: get } = createRouter([endpoint], {
                hooks: {
                    onError: (ctx) => Response.json({ global: (ctx.error as Error).message }, { status: 503 }),
                },
            })
            const res = await get(GETRequest("/fail"))
            expect(res.status).toBe(503)
            expect(await res.json()).toEqual({ global: "fallback" })
        })
    })

    describe("Backward compatibility with config.onError", () => {
        test("legacy config.onError still works when no hooks.onError is defined", async ({ expect }) => {
            const endpoint = createEndpoint("GET", "/fail", () => {
                throw new Error("legacy")
            })
            const { GET: get } = createRouter([endpoint], {
                onError: (err) => Response.json({ legacy: (err as Error).message }, { status: 500 }),
            })
            const res = await get(GETRequest("/fail"))
            expect(res.status).toBe(500)
            expect(await res.json()).toEqual({ legacy: "legacy" })
        })

        test("hooks.onError takes priority over config.onError", async ({ expect }) => {
            const endpoint = createEndpoint("GET", "/fail", () => {
                throw new Error("x")
            })
            const { GET: get } = createRouter([endpoint], {
                onError: () => Response.json({ source: "config" }, { status: 500 }),
                hooks: {
                    onError: () => Response.json({ source: "hooks" }, { status: 500 }),
                },
            })
            const res = await get(GETRequest("/fail"))
            expect(await res.json()).toEqual({ source: "hooks" })
        })
    })
})
