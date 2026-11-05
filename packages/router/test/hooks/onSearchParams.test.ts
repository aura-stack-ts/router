import { createEndpoint } from "@/endpoint.ts"
import { createRouter } from "@/router.ts"
import { describe, test, vi } from "vitest"
import { GETRequest } from "./presets.ts"
import z from "zod"

describe("onSearchParams hook (replaces getSearchParams)", () => {
    test("receives raw URLSearchParams and handler gets hook result", async ({ expect }) => {
        let raw: URLSearchParams | null = null
        const endpoint = createEndpoint("GET", "/search", (ctx) => ctx.json({ q: (ctx.searchParams as any).q }), {
            hooks: {
                onSearchParams: (ctx) => {
                    raw = ctx.searchParams
                    return { q: ctx.searchParams.get("q")?.toUpperCase() }
                },
            },
        })
        const response = await createRouter([endpoint]).GET(GETRequest("/search?q=hello"))
        expect(raw).toBeInstanceOf(URLSearchParams)
        expect(raw!.get("q")).toBe("hello")
        expect(await response.json()).toEqual({ q: "HELLO" })
    })

    test("void return — raw URLSearchParams passed as-is to handler", async ({ expect }) => {
        const endpoint = createEndpoint(
            "GET",
            "/search",
            (ctx) => ctx.json({ isURLSearchParams: ctx.searchParams instanceof URLSearchParams }),
            { hooks: { onSearchParams: async () => {} } }
        )
        const response = await createRouter([endpoint]).GET(GETRequest("/search?q=test"))
        expect(await response.json()).toEqual({ isURLSearchParams: true })
    })

    test("returns Response — short-circuits pipeline", async ({ expect }) => {
        const handler = vi.fn(() => Response.json({ ok: true }))
        const endpoint = createEndpoint("GET", "/search", handler, {
            hooks: {
                onSearchParams: (ctx) => ctx.json({ error: "missing params" }, { status: 400 }),
            },
        })
        const response = await createRouter([endpoint]).GET(GETRequest("/search"))
        expect(response.status).toBe(400)
        expect(handler).not.toHaveBeenCalled()
    })

    test("when defined, schema validation in getSearchParams is skipped", async ({ expect }) => {
        const endpoint = createEndpoint("GET", "/search", (ctx) => ctx.json({ result: (ctx.searchParams as any).q }), {
            hooks: {
                onSearchParams: (ctx) => ({ q: ctx.searchParams.get("q") ?? "default" }),
            },
        })
        const response = await createRouter([endpoint]).GET(GETRequest("/search"))
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ result: "default" })
    })

    test("returns URLSearchParams", async ({ expect }) => {
        const endpoint = createEndpoint(
            "GET",
            "/search",
            (ctx) => {
                const q = ctx.searchParams.get("q")
                return ctx.json({ q })
            },
            {
                hooks: {
                    onSearchParams: (ctx) => ctx.searchParams,
                },
            }
        )
        const response = await createRouter([endpoint]).GET(GETRequest("/search?q=example"))
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ q: "example" })
    })

    test("returns new URLSearchParams", async ({ expect }) => {
        const endpoint = createEndpoint(
            "GET",
            "/search",
            (ctx) => {
                const q = ctx.searchParams.get("q")
                return ctx.json({ q })
            },
            {
                hooks: {
                    onSearchParams: () => new URLSearchParams({ q: "overridden" }),
                },
            }
        )
        const response = await createRouter([endpoint]).GET(GETRequest("/search?q=example"))
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ q: "overridden" })
    })

    test("modifies the search parameters", async ({ expect }) => {
        let raw: URLSearchParams | null = null
        const endpoint = createEndpoint(
            "GET",
            "/search",
            (ctx) => ctx.json({ q: ctx.searchParams.get("q"), extra: ctx.searchParams.get("extra") }),
            {
                hooks: {
                    onSearchParams: (ctx) => {
                        raw = ctx.searchParams
                        ctx.searchParams.append("extra", "value")
                        ctx.searchParams.set("q", ctx.searchParams.get("q")?.toUpperCase() ?? "")
                    },
                },
            }
        )
        const response = await createRouter([endpoint]).GET(GETRequest("/search?q=hello"))
        expect(raw).toBeInstanceOf(URLSearchParams)
        expect(raw!.get("q")).toBe("HELLO")
        expect(raw!.get("extra")).toBe("value")
        expect(await response.json()).toEqual({ q: "HELLO", extra: "value" })
    })

    test("modifies the search parameters and searchParams schema", async ({ expect }) => {
        let raw: URLSearchParams | null = null
        const endpoint = createEndpoint("GET", "/search", (ctx) => ctx.json({ ...ctx.searchParams }), {
            hooks: {
                onSearchParams: (ctx) => {
                    raw = ctx.searchParams
                    ctx.searchParams.append("extra", "value")
                    ctx.searchParams.set("q", ctx.searchParams.get("q")?.toUpperCase() ?? "")
                },
            },
            schemas: {
                searchParams: z.object({
                    q: z.string(),
                }),
            },
        })
        const response = await createRouter([endpoint]).GET(GETRequest("/search?q=hello"))
        expect(raw).toBeInstanceOf(URLSearchParams)
        expect(raw!.get("q")).toBe("HELLO")
        expect(await response.json()).toEqual({ q: "HELLO" })
    })
})
