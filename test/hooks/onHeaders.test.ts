import { describe, test, vi } from "vitest"
import { z } from "zod/v4"
import { createRouter } from "@/router.ts"
import { createEndpoint } from "@/endpoint.ts"
import { GETRequest } from "@test/hooks/presets.ts"

describe("onHeaders hook (replaces getRouteParams)", () => {
    test("receives raw trie params and handler gets hook result", async ({ expect }) => {
        const endpoint = createEndpoint(
            "GET",
            "/users/:userId",
            (ctx) => {
                return ctx.json({ userId: ctx.headers.getHeader("x-user-id") })
            },
            {
                hooks: {
                    onHeaders: (ctx) => {
                        ctx.headers.setHeader("x-user-id", "transformed-123")
                    },
                },
            }
        )
        const response = await createRouter([endpoint]).GET(GETRequest("/users/123"))
        expect(await response.json()).toEqual({ userId: "transformed-123" })
    })

    test("returns Response — short-circuits pipeline", async ({ expect }) => {
        const handler = vi.fn(() => Response.json({ ok: true }))
        const endpoint = createEndpoint("GET", "/users/:userId", handler, {
            hooks: {
                onHeaders: () => Response.json({ error: "bad params" }, { status: 422 }),
            },
        })
        const res = await createRouter([endpoint]).GET(GETRequest("/users/bad"))
        expect(res.status).toBe(422)
        expect(await res.json()).toEqual({ error: "bad params" })
        expect(handler).not.toHaveBeenCalled()
    })

    test("returns Response — short-circuits pipeline (async)", async ({ expect }) => {
        const handler = vi.fn(() => Response.json({ ok: true }))
        const endpoint = createEndpoint("GET", "/users/:userId", handler, {
            hooks: {
                onHeaders: async () => Response.json({ error: "bad params" }, { status: 422 }),
            },
        })
        const res = await createRouter([endpoint]).GET(GETRequest("/users/bad"))
        expect(res.status).toBe(422)
        expect(await res.json()).toEqual({ error: "bad params" })
        expect(handler).not.toHaveBeenCalled()
    })

    test("validates headers with Zod schema", async ({ expect }) => {
        const endpoint = createEndpoint(
            "GET",
            "/users/:userId",
            (ctx) => {
                return ctx.json({ userId: ctx.headers["x-user-id"] })
            },
            {
                hooks: {
                    onHeaders: (ctx) => {
                        ctx.headers.setHeader("x-user-id", "transformed-123")
                    },
                },
                schemas: {
                    headers: z.object({
                        "x-user-id": z.string(),
                    }),
                },
            }
        )
        const response = await createRouter([endpoint]).GET(GETRequest("/users/123"))
        expect(await response.json()).toEqual({ userId: "transformed-123" })
    })

    test("throws validation error if headers do not match schema", async ({ expect }) => {
        const endpoint = createEndpoint(
            "GET",
            "/users/:userId",
            (ctx) => {
                return ctx.json({ userId: ctx.headers["x-user-id"] })
            },
            {
                hooks: {
                    onHeaders: (ctx) => {
                        ctx.headers.setHeader("x-user-id-invalid", "123")
                    },
                },
                schemas: {
                    headers: z.object({
                        "x-user-id": z.string(),
                    }),
                },
            }
        )
        const response = await createRouter([endpoint]).GET(GETRequest("/users/123"))
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            type: "VALIDATION",
            code: "UNPROCESSABLE_ENTITY",
            message: "The request body or parameter schema layout contains input format errors.",
            details: {
                "x-user-id": {
                    code: "invalid_type",
                    message: "Invalid input: expected string, received undefined",
                },
            },
        })
    })

    test("don't override headers", async ({ expect }) => {
        const endpoint = createEndpoint(
            "GET",
            "/users/:userId",
            (ctx) => {
                return ctx.json({ userId: ctx.headers["x-user-id"], csrfToken: ctx.headers["x-csrf-token"] })
            },
            {
                hooks: {
                    onHeaders: (ctx) => {
                        ctx.request.headers.set("x-csrf-token", "token-123")
                        ctx.headers.setHeader("x-user-id", "user-id-123")
                    },
                },
                schemas: {
                    headers: z.object({
                        "x-user-id": z.string(),
                        "x-csrf-token": z.string(),
                    }),
                },
            }
        )

        const response = await createRouter([endpoint]).GET(GETRequest("/users/123"))
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            type: "VALIDATION",
            code: "UNPROCESSABLE_ENTITY",
            message: "The request body or parameter schema layout contains input format errors.",
            details: {
                "x-csrf-token": {
                    code: "invalid_type",
                    message: "Invalid input: expected string, received undefined",
                },
            },
        })
    })
})
