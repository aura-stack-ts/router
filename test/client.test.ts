import { describe, test, expect, vi, beforeEach } from "vitest"
import { z } from "zod"
import { createRouter } from "@/router.ts"
import { createEndpoint } from "@/endpoint.ts"
import { createClient } from "@/client.ts"

describe("Client", () => {
    beforeEach(() => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                return new Response(JSON.stringify({ success: true }), { status: 200 })
            })
        )
    })

    const router = createRouter([
        createEndpoint("GET", "/users", () => new Response("")),
        createEndpoint("GET", "/users/:userId", () => new Response(""), {
            schemas: { params: z.object({ userId: z.string() }) },
        }),
        createEndpoint("POST", "/users", () => new Response(""), {
            schemas: { body: z.object({ name: z.string() }) },
        }),
        createEndpoint("DELETE", "/users/:userId", () => new Response(""), {
            schemas: {
                params: z.object({ userId: z.string() }),
                searchParams: z.object({ force: z.string().optional() }),
            },
        }),
    ])
    const client = createClient<typeof router>({
        baseURL: "http://api.example.com",
    })

    test("GET request", async () => {
        await client.get("/users")
        expect(fetch).toHaveBeenCalledWith(
            "http://api.example.com/users",
            expect.objectContaining({
                method: "GET",
            })
        )
    })

    test("GET request with dynamic params", async () => {
        await client.get("/users/:userId", {
            params: { userId: "123" },
        })
        expect(fetch).toHaveBeenCalledWith(
            "http://api.example.com/users/123",
            expect.objectContaining({
                method: "GET",
            })
        )
    })

    test("POST request with search parameters", async () => {
        await client.post("/users", {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            // @ts-expect-error @todo: add support for different body types
            body: new URLSearchParams({ name: "Jane Doe" }),
        })
    })

    test("POST request with body", async () => {
        const body = { name: "John Doe" }
        await client.post("/users", { body, headers: { "Content-Type": "application/json" } })

        expect(fetch).toHaveBeenCalledWith(
            "http://api.example.com/users",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json",
                },
            })
        )
    })

    test("DELETE request with search parameters", async () => {
        await client.delete("/users/:userId", {
            params: { userId: "456" },
            searchParams: { force: "true" },
        })

        expect(fetch).toHaveBeenCalledWith(
            "http://api.example.com/users/456?force=true",
            expect.objectContaining({
                method: "DELETE",
            })
        )
    })

    test("createClient headers merging", async () => {
        const client = createClient<typeof router>({
            baseURL: "http://api.example.com",
            headers: { "X-API-KEY": "secret" },
        })

        await client.get("/users", {
            headers: { "X-Custom": "val" },
        })

        expect(fetch).toHaveBeenCalledWith(
            "http://api.example.com/users",
            expect.objectContaining({
                headers: expect.objectContaining({
                    "X-API-KEY": "secret",
                    "X-Custom": "val",
                }),
            })
        )
    })

    test("createClient with basePath", async () => {
        const client = createClient<typeof router>({
            baseURL: "http://api.example.com",
            basePath: "/v1",
        })

        await client.get("/users")
        expect(fetch).toHaveBeenCalledWith("http://api.example.com/v1/users", expect.objectContaining({}))
    })

    test("createClient with headers as a function", async () => {
        const client = createClient<typeof router>({
            baseURL: "http://api.example.com",
            headers: () => ({ "content-type": "application/json", "x-custom-header": "custom-value" }),
        })
        await client.get("/users")
        expect(fetch).toHaveBeenCalledWith(
            "http://api.example.com/users",
            expect.objectContaining({
                headers: expect.objectContaining({
                    "content-type": "application/json",
                    "x-custom-header": "custom-value",
                }),
            })
        )
    })

    test("createClient with dynamic headers as a function", async () => {
        const client = createClient<typeof router>({
            baseURL: "http://api.example.com",
            headers: async () => {
                const token = await Promise.resolve("dynamic-token")
                return {
                    "content-type": "application/json",
                    "x-dynamic-token": token,
                }
            },
        })
        await client.get("/users")
        expect(fetch).toHaveBeenCalledWith(
            "http://api.example.com/users",
            expect.objectContaining({
                headers: expect.objectContaining({
                    "content-type": "application/json",
                    "x-dynamic-token": "dynamic-token",
                }),
            })
        )
    })
})
