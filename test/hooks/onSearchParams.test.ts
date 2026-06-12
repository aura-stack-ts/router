import { createEndpoint } from "@/endpoint.ts"
import { createRouter } from "@/router.ts"
import { describe, test, vi } from "vitest"
import { GETRequest } from "./presets.ts"

describe("onSearchParams hook (replaces getSearchParams)", () => {
    test("receives raw URLSearchParams and handler gets hook result", async ({ expect }) => {
        let rawReceived: URLSearchParams | null = null
        const endpoint = createEndpoint("GET", "/search", (ctx) => ctx.json({ q: (ctx.searchParams as any).q }), {
            hooks: {
                onSearchParams: (ctx) => {
                    rawReceived = ctx.searchParams
                    return { q: ctx.searchParams.get("q")?.toUpperCase() }
                },
            },
        })
        const response = await createRouter([endpoint]).GET(GETRequest("/search?q=hello"))
        expect(rawReceived).toBeInstanceOf(URLSearchParams)
        expect(rawReceived!.get("q")).toBe("hello")
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
})
