import { describe, test, expectTypeOf } from "vitest"
import { z } from "zod"
import { createRouter } from "@/router.ts"
import { createEndpoint, createEndpointConfig } from "@/endpoint.ts"
import { createClient } from "@/client.ts"
import type { JsonResponse } from "@/@types/index.ts"

describe("Client type inference without schemas", async () => {
    test("With params", async () => {
        const getChannel = createEndpoint("GET", "/channel/:param1/:param2", (ctx) => {
            return ctx.json({ param1: ctx.params.param1, param2: ctx.params.param2 })
        })

        const getItems = createEndpoint("DELETE", "/items/:param1/:param2", (ctx) => {
            return ctx.json({ params1: ctx.params.param1, param2: ctx.params.param2 })
        })

        const router = createRouter([getChannel, getItems])
        const client = createClient<typeof router>({
            baseURL: "http://api.example.com",
        })

        await client.get("/channel/:param1/:param2", {
            params: {
                param1: "value1",
                param2: "value2",
            },
        })

        await client.delete("/items/:param1/:param2", {
            params: {
                param1: "value1",
                param2: "value2",
            },
        })
    })
})

describe("Client type inference with Zod schemas", () => {
    test("With params", async () => {
        const getItemConfig = createEndpointConfig({
            schemas: {
                params: z.object({ itemId: z.string() }),
            },
        })

        const getItem = createEndpoint(
            "GET",
            "/items/:itemId",
            (ctx) => {
                return ctx.json({ itemId: ctx.params.itemId })
            },
            getItemConfig
        )

        const getBooksConfig = createEndpointConfig({
            schemas: {
                params: z.object({ bookId: z.string(), chapterId: z.string() }),
            },
        })

        const getBooks = createEndpoint(
            "GET",
            "/books/:bookId/chapters/:chapterId",
            (ctx) => {
                return ctx.json({ bookId: ctx.params.bookId, chapterId: ctx.params.chapterId })
            },
            getBooksConfig
        )

        const deleteItemConfig = createEndpointConfig({
            schemas: {
                params: z.object({ itemId: z.string() }),
                searchParams: z.object({ force: z.string().optional() }),
            },
        })

        const deleteItem = createEndpoint(
            "DELETE",
            "/items/:itemId",
            (ctx) => {
                return ctx.json({ method: ctx.method })
            },
            deleteItemConfig
        )

        const getMethods = createEndpoint(["GET", "POST", "DELETE"], "/methods/:methodId", (ctx) => {
            return ctx.json({ methodId: ctx.params.methodId, method: ctx.method })
        })

        const router = createRouter([getItem, getBooks, deleteItem, getMethods])

        const client = createClient<typeof router>({
            baseURL: "http://api.example.com",
        })

        await client.get("/items/:itemId", {
            params: { itemId: "123" },
        })

        const item = await client.get("/items/:itemId", {
            params: { itemId: "123" },
        })
        expectTypeOf<typeof item>().toEqualTypeOf<JsonResponse<{ itemId: string }>>()

        const chapter = await client.get("/books/:bookId/chapters/:chapterId", {
            params: { bookId: "456", chapterId: "789" },
        })
        expectTypeOf<typeof chapter>().toEqualTypeOf<JsonResponse<{ bookId: string; chapterId: string }>>()

        const deletedItem = await client.delete("/items/:itemId", {
            params: { itemId: "123" },
            searchParams: { force: "true" },
        })
        expectTypeOf<typeof deletedItem>().toEqualTypeOf<JsonResponse<{ method: "DELETE" }>>()

        const getMethodResponse = await client.get("/methods/:methodId", {
            params: { methodId: "get" },
        })
        expectTypeOf<typeof getMethodResponse>().toEqualTypeOf<
            JsonResponse<{ methodId: string; method: "GET" | "POST" | "DELETE" }>
        >()

        const postMethodResponse = await client.post("/methods/:methodId", {
            params: { methodId: "post" },
        })
        expectTypeOf<typeof postMethodResponse>().toEqualTypeOf<
            JsonResponse<{ methodId: string; method: "GET" | "POST" | "DELETE" }>
        >()

        const deleteMethodResponse = await client.delete("/methods/:methodId", {
            params: { methodId: "delete" },
        })
        expectTypeOf<typeof deleteMethodResponse>().toEqualTypeOf<
            JsonResponse<{ methodId: string; method: "GET" | "POST" | "DELETE" }>
        >()
    })

    test("With searchParams", async () => {
        const getItemsConfig = createEndpointConfig({
            schemas: {
                searchParams: z.object({
                    page: z.number(),
                    q: z.string(),
                    is_eval: z.boolean(),
                }),
            },
        })

        const getItems = createEndpoint(
            "GET",
            "/items",
            (ctx) => {
                return ctx.json({ page: ctx.searchParams.page, q: ctx.searchParams.q, is_eval: ctx.searchParams.is_eval })
            },
            getItemsConfig
        )

        const callbackConfig = createEndpointConfig({
            schemas: {
                searchParams: z.object({
                    code: z.string(),
                    state: z.string(),
                    code_challenge: z.string().optional(),
                }),
            },
        })

        const callback = createEndpoint(
            "POST",
            "/callback",
            (ctx) => {
                return ctx.json({
                    code: ctx.searchParams.code,
                    state: ctx.searchParams.state,
                    code_challenge: ctx.searchParams.code_challenge,
                })
            },
            callbackConfig
        )

        const callbackParamConfig = createEndpointConfig({
            schemas: {
                searchParams: z.object({
                    code: z.string(),
                    state: z.string(),
                    code_challenge: z.string().optional(),
                }),
            },
        })

        const callbackParam = createEndpoint(
            "GET",
            "/callback/:callbackId",
            (ctx) => {
                return ctx.json({ callbackId: ctx.params.callbackId })
            },
            callbackParamConfig
        )

        const withParamsConfig = createEndpointConfig({
            schemas: {
                searchParams: z.object({
                    page: z.number(),
                    q: z.string(),
                    is_eval: z.boolean(),
                }),
            },
        })

        const withParams = createEndpoint(
            "GET",
            "/with-params/:param1/:param2",
            (ctx) => {
                return ctx.json({
                    page: ctx.searchParams.page,
                    q: ctx.searchParams.q,
                    is_eval: ctx.searchParams.is_eval,
                    param1: ctx.params.param1,
                    param2: ctx.params.param2,
                })
            },
            withParamsConfig
        )

        const getMethodsConfig = createEndpointConfig({
            schemas: {
                searchParams: z.object({
                    name: z.string(),
                    age: z.number().optional(),
                }),
            },
        })

        const getMethods = createEndpoint(
            ["GET", "POST", "DELETE"],
            "/methods/:methodId",
            (ctx) => {
                return ctx.json({ methodId: ctx.params.methodId, method: ctx.method })
            },
            getMethodsConfig
        )

        const router = createRouter([getItems, callback, withParams, callbackParam, getMethods])

        const client = createClient<typeof router>({
            baseURL: "http://api.example.com",
        })

        const items = await client.get("/items", {
            searchParams: { page: 1, q: "test", is_eval: true },
        })
        expectTypeOf<typeof items>().toEqualTypeOf<JsonResponse<{ page: number; q: string; is_eval: boolean }>>()

        const callbackResponse = await client.post("/callback", {
            searchParams: { code: "abc123", state: "xyz789" },
        })
        expectTypeOf<typeof callbackResponse>().toEqualTypeOf<
            JsonResponse<{ code: string; state: string; code_challenge: string | undefined }>
        >()

        await client.get("/with-params/:param1/:param2", {
            params: { param1: "value1", param2: "value2" },
            searchParams: { is_eval: false, page: 2, q: "search" },
        })

        const withParamsResponse = await client.get("/with-params/:param1/:param2", {
            params: { param1: "value1", param2: "value2" },
            searchParams: { page: 2, q: "search", is_eval: false },
        })
        expectTypeOf<typeof withParamsResponse>().toEqualTypeOf<
            JsonResponse<{ page: number; q: string; is_eval: boolean; param1: string; param2: string }>
        >()

        const getMethodResponse = await client.get("/methods/:methodId", {
            params: { methodId: "get" },
            searchParams: { name: "John", age: 30 },
        })
        expectTypeOf<typeof getMethodResponse>().toEqualTypeOf<
            JsonResponse<{ methodId: string; method: "GET" | "POST" | "DELETE" }>
        >()

        const postMethodResponse = await client.post("/methods/:methodId", {
            params: { methodId: "post" },
            searchParams: { name: "John", age: 30 },
        })
        expectTypeOf<typeof postMethodResponse>().toEqualTypeOf<
            JsonResponse<{ methodId: string; method: "GET" | "POST" | "DELETE" }>
        >()

        const deleteMethodResponse = await client.delete("/methods/:methodId", {
            params: { methodId: "delete" },
            searchParams: { name: "John", age: 30 },
        })
        expectTypeOf<typeof deleteMethodResponse>().toEqualTypeOf<
            JsonResponse<{ methodId: string; method: "GET" | "POST" | "DELETE" }>
        >()
    })

    test("With body", async () => {
        const createUserConfig = createEndpointConfig({
            schemas: {
                body: z.object({
                    name: z.string(),
                    nickname: z.string(),
                    is_eval: z.boolean(),
                    cash: z.number(),
                    items: z.array(z.string()),
                }),
            },
        })

        const createUser = createEndpoint(
            "POST",
            "/users",
            (ctx) => {
                return ctx.json(ctx.body)
            },
            createUserConfig
        )

        const withParamsConfig = createEndpointConfig({
            schemas: {
                body: z.object({
                    page: z.number(),
                    q: z.string(),
                    is_eval: z.boolean(),
                }),
            },
        })

        const withParams = createEndpoint(
            "GET",
            "/with-params/:param1/:param2",
            (ctx) => {
                return ctx.json({
                    page: ctx.body.page,
                    q: ctx.body.q,
                    is_eval: ctx.body.is_eval,
                    param1: ctx.params.param1,
                    param2: ctx.params.param2,
                })
            },
            withParamsConfig
        )

        const getMethodsConfig = createEndpointConfig({
            schemas: {
                body: z.object({
                    name: z.string(),
                    age: z.number().optional(),
                }),
            },
        })

        const getMethods = createEndpoint(
            ["GET", "POST", "DELETE"],
            "/methods/:methodId",
            (ctx) => {
                return ctx.json({ methodId: ctx.params.methodId, method: ctx.method })
            },
            getMethodsConfig
        )

        const router = createRouter([createUser, withParams, getMethods])

        const client = createClient<typeof router>({
            baseURL: "http://api.example.com",
        })

        const newUser = await client.post("/users", {
            body: {
                name: "John Doe",
                nickname: "johndoe",
                is_eval: true,
                cash: 100,
                items: ["item1", "item2"],
            },
        })
        expectTypeOf<typeof newUser>().toEqualTypeOf<
            JsonResponse<{
                name: string
                nickname: string
                is_eval: boolean
                cash: number
                items: string[]
            }>
        >()

        const withParamsResponse = await client.get("/with-params/:param1/:param2", {
            params: { param1: "value1", param2: "value2" },
            body: { page: 2, q: "search", is_eval: false },
        })
        expectTypeOf<typeof withParamsResponse>().toEqualTypeOf<
            JsonResponse<{ page: number; q: string; is_eval: boolean; param1: string; param2: string }>
        >()

        const getMethodResponse = await client.get("/methods/:methodId", {
            params: { methodId: "get" },
            body: { name: "John", age: 30 },
        })
        expectTypeOf<typeof getMethodResponse>().toEqualTypeOf<
            JsonResponse<{ methodId: string; method: "GET" | "POST" | "DELETE" }>
        >()

        const postMethodResponse = await client.post("/methods/:methodId", {
            params: { methodId: "post" },
            body: { name: "John", age: 30 },
        })
        expectTypeOf<typeof postMethodResponse>().toEqualTypeOf<
            JsonResponse<{ methodId: string; method: "GET" | "POST" | "DELETE" }>
        >()

        const deleteMethodResponse = await client.delete("/methods/:methodId", {
            params: { methodId: "delete" },
            body: { name: "John", age: 30 },
        })
        expectTypeOf<typeof deleteMethodResponse>().toEqualTypeOf<
            JsonResponse<{ methodId: string; method: "GET" | "POST" | "DELETE" }>
        >()
    })

    test("With headers", async () => {
        const getUserConfig = createEndpointConfig({
            schemas: {
                headers: z.object({
                    authorization: z.string(),
                    "x-csrf-token": z.string(),
                }),
            },
        })

        const getUser = createEndpoint(
            "GET",
            "/users/:userId",
            (ctx) => {
                return ctx.json({
                    authorization: ctx.headers.authorization,
                    csrfToken: ctx.headers["x-csrf-token"],
                })
            },
            getUserConfig
        )

        const createUserConfig = createEndpointConfig({
            schemas: {
                body: z.object({
                    name: z.string(),
                    nickname: z.string(),
                    is_eval: z.boolean(),
                    cash: z.number(),
                    items: z.array(z.string()),
                }),
                headers: z.object({
                    authorization: z.string(),
                    "x-csrf-token": z.string(),
                }),
            },
        })

        const createUser = createEndpoint(
            "POST",
            "/users",
            (ctx) => {
                return ctx.json(ctx.body)
            },
            createUserConfig
        )

        const withParamsConfig = createEndpointConfig({
            schemas: {
                headers: z.object({
                    page: z.number(),
                    q: z.string(),
                    is_eval: z.boolean(),
                }),
            },
        })

        const withParams = createEndpoint(
            "GET",
            "/with-params/:param1/:param2",
            (ctx) => {
                return ctx.json({
                    page: ctx.headers.page,
                    q: ctx.headers.q,
                    is_eval: ctx.headers.is_eval,
                    param1: ctx.params.param1,
                    param2: ctx.params.param2,
                })
            },
            withParamsConfig
        )

        const getMethodsConfig = createEndpointConfig({
            schemas: {
                headers: z.object({
                    authorization: z.string(),
                    token: z.string(),
                }),
            },
        })

        const getMethods = createEndpoint(
            ["GET", "POST", "DELETE"],
            "/methods/:methodId",
            (ctx) => {
                return ctx.json({ methodId: ctx.params.methodId, method: ctx.method })
            },
            getMethodsConfig
        )

        const router = createRouter([getUser, createUser, withParams, getMethods])

        const client = createClient<typeof router>({
            baseURL: "http://api.example.com",
        })

        await client.get("/users/:userId", {
            params: { userId: "123" },
            headers: {
                "x-csrf-token": "",
                authorization: "",
            },
        })
        const userResponse = await client.get("/users/:userId", {
            params: { userId: "123" },
            headers: {
                authorization: "Bearer token",
                "x-csrf-token": "csrf-token",
            },
        })
        expectTypeOf<typeof userResponse>().toEqualTypeOf<JsonResponse<{ authorization: string; csrfToken: string }>>()

        const newUser = await client.post("/users", {
            body: {
                name: "John Doe",
                nickname: "johndoe",
                is_eval: true,
                cash: 100,
                items: ["item1", "item2"],
            },
            headers: {
                authorization: "Bearer token",
                "x-csrf-token": "csrf-token",
            },
        })
        expectTypeOf<typeof newUser>().toEqualTypeOf<
            JsonResponse<{
                name: string
                nickname: string
                is_eval: boolean
                cash: number
                items: string[]
            }>
        >()

        const withParamsResponse = await client.get("/with-params/:param1/:param2", {
            params: {
                param1: "value1",
                param2: "value2",
            },
            headers: {
                is_eval: false,
                page: 2,
                q: "search",
            },
        })
        expectTypeOf<typeof withParamsResponse>().toEqualTypeOf<
            JsonResponse<{ page: number; q: string; is_eval: boolean; param1: string; param2: string }>
        >()

        const getMethodResponse = await client.get("/methods/:methodId", {
            params: { methodId: "get" },
            headers: { authorization: "bearer", token: "token" },
        })
        expectTypeOf<typeof getMethodResponse>().toEqualTypeOf<
            JsonResponse<{ methodId: string; method: "GET" | "POST" | "DELETE" }>
        >()

        const postMethodResponse = await client.post("/methods/:methodId", {
            params: { methodId: "post" },
            headers: { authorization: "bearer", token: "token" },
        })
        expectTypeOf<typeof postMethodResponse>().toEqualTypeOf<
            JsonResponse<{ methodId: string; method: "GET" | "POST" | "DELETE" }>
        >()

        const deleteMethodResponse = await client.delete("/methods/:methodId", {
            params: { methodId: "delete" },
            headers: { authorization: "bearer", token: "token" },
        })
        expectTypeOf<typeof deleteMethodResponse>().toEqualTypeOf<
            JsonResponse<{ methodId: string; method: "GET" | "POST" | "DELETE" }>
        >()
    })

    test("With response", async () => {
        const simpleStatusConfig = createEndpointConfig({
            schemas: {
                response: z.object({
                    code: z.string(),
                    message: z.string(),
                    id: z.number(),
                    is_eval: z.boolean(),
                }),
            },
        })

        const multiStatusCodeConfig = createEndpointConfig({
            schemas: {
                response: {
                    200: z.object({ message: z.string(), code: z.string(), id: z.number(), is_eval: z.boolean() }),
                    404: z.object({ error: z.string(), code: z.string(), id: z.number() }),
                },
            },
        })

        const multiStatusCodeConfigWithDefault = createEndpointConfig({
            schemas: {
                response: {
                    200: z.object({ code: z.string(), message: z.string(), id: z.number(), is_eval: z.boolean() }),
                    204: z.object({ code: z.string(), message: z.string(), id: z.number(), is_eval: z.boolean() }),
                    302: z.object({ location: z.string() }),
                    404: z.object({ code: z.string(), id: z.number(), error: z.string() }),
                    500: z.object({ code: z.string(), id: z.number(), error: z.string() }),
                },
            },
        })

        const simpleStatusCode = createEndpoint(
            "GET",
            "/simple-status",
            (ctx) => {
                return ctx.json({ code: "200", message: "OK", id: 1, is_eval: true })
            },
            simpleStatusConfig
        )

        const multiStatusCode = createEndpoint(
            "GET",
            "/not-found",
            (ctx) => {
                return ctx.json({ error: "Not Found" })
            },
            multiStatusCodeConfig
        )

        const multiStatusCodeWithDefault = createEndpoint(
            "GET",
            "/multi-status",
            (ctx) => {
                return ctx.json({ code: "200", message: "OK", id: 1, is_eval: true })
            },
            multiStatusCodeConfigWithDefault
        )

        const withParamsConfig = createEndpointConfig({
            schemas: {
                response: {
                    200: z.object({
                        param1: z.string(),
                        param2: z.string(),
                    }),
                    4040: z.object({
                        error: z.string(),
                    }),
                },
            },
        })

        const withParams = createEndpoint(
            "GET",
            "/with-params/:param1/:param2",
            (ctx) => {
                return ctx.json({
                    param1: ctx.params.param1,
                    param2: ctx.params.param2,
                })
            },
            withParamsConfig
        )

        const getMethodsConfig = createEndpointConfig({
            schemas: {
                response: z.object({
                    message: z.string(),
                    code: z.string(),
                }),
            },
        })

        const getMethods = createEndpoint(
            ["GET", "POST", "DELETE"],
            "/methods/:methodId",
            (ctx) => {
                return ctx.json({ methodId: ctx.params.methodId, method: ctx.method })
            },
            getMethodsConfig
        )

        const router = createRouter([simpleStatusCode, multiStatusCode, multiStatusCodeWithDefault, withParams, getMethods])

        const client = createClient<typeof router>({
            baseURL: "http://api.example.com",
        })

        const simpleStatusResponse = await client.get("/simple-status")
        expectTypeOf<typeof simpleStatusResponse>().toEqualTypeOf<
            JsonResponse<{ code: string; message: string; id: number; is_eval: boolean }>
        >()

        const multiStatusResponse = await client.get("/not-found")
        expectTypeOf<typeof multiStatusResponse>().toEqualTypeOf<JsonResponse<{ error: string }>>()

        const multiStatusCodeWithDefaultResponse = await client.get("/multi-status")
        expectTypeOf<typeof multiStatusCodeWithDefaultResponse>().toEqualTypeOf<
            JsonResponse<{ code: string; message: string; id: number; is_eval: boolean }>
        >()

        const withParamsResponse = await client.get("/with-params/:param1/:param2", {
            params: { param1: "value1", param2: "value2" },
        })
        expectTypeOf<typeof withParamsResponse>().toEqualTypeOf<JsonResponse<{ param1: string; param2: string }>>()

        const getMethodResponse = await client.get("/methods/:methodId", {
            params: { methodId: "get" },
        })
        expectTypeOf<typeof getMethodResponse>().toEqualTypeOf<
            JsonResponse<{ methodId: string; method: "GET" | "POST" | "DELETE" }>
        >()

        const postMethodResponse = await client.post("/methods/:methodId", {
            params: { methodId: "post" },
        })
        expectTypeOf<typeof postMethodResponse>().toEqualTypeOf<
            JsonResponse<{ methodId: string; method: "GET" | "POST" | "DELETE" }>
        >()

        const deleteMethodResponse = await client.delete("/methods/:methodId", {
            params: { methodId: "delete" },
        })
        expectTypeOf<typeof deleteMethodResponse>().toEqualTypeOf<
            JsonResponse<{ methodId: string; method: "GET" | "POST" | "DELETE" }>
        >()
    })

    test("With all schemas", async () => {
        const allSchemasConfig = createEndpointConfig({
            schemas: {
                body: z.object({
                    name: z.string(),
                    nickname: z.string(),
                }),
                headers: z.object({
                    authorization: z.string(),
                }),
                params: z.object({
                    userId: z.string(),
                    itemId: z.string(),
                }),
                searchParams: z.object({
                    page: z.number(),
                    q: z.string(),
                }),
            },
        })

        const allSchemasEndpoint = createEndpoint(
            ["GET", "POST"],
            "/users/:userId/items/:itemId",
            (ctx) => {
                return ctx.json({
                    body: ctx.body,
                    headers: ctx.headers,
                    params: ctx.params,
                    searchParams: ctx.searchParams,
                })
            },
            allSchemasConfig
        )

        const router = createRouter([allSchemasEndpoint])
        const client = createClient<typeof router>({
            baseURL: "http://api.example.com",
        })

        const allSchemasResponse = await client.post("/users/:userId/items/:itemId", {
            params: { userId: "123", itemId: "456" },
            searchParams: { page: 1, q: "test" },
            headers: { authorization: "Bearer token" },
            body: { name: "John Doe", nickname: "johndoe" },
        })

        expectTypeOf<typeof allSchemasResponse>().toEqualTypeOf<
            JsonResponse<{
                body: { name: string; nickname: string }
                headers: { authorization: string }
                params: { userId: string; itemId: string }
                searchParams: { page: number; q: string }
            }>
        >()
    })
})
