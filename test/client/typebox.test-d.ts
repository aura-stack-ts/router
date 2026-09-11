import { describe, test, expectTypeOf } from "vitest"
import * as typebox from "typebox"
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

/**
 * Aura Router doesn't offer a complete type inference for TypeBox schemas, due to the
 * expensive computation operations performed by TypeBox and specifically the `Static` type.
 * This is a known limitation of TypeBox and is not specific to Aura Router. When the `Static` type
 * is used the `Instantiations` increase exponentially, from 301_598 (current) to 1_500_000 (with `Static`),
 * which can lead to performance issues and slow down the TypeScript compiler.
 *
 * We recommend use the `Static` inside the handler function.
 */
describe("Client type inference with Zod schemas", () => {
    test("With params", async () => {
        const getItemConfig = createEndpointConfig({
            schemas: {
                params: typebox.Object({ itemId: typebox.String() }),
            },
        })

        const getItem = createEndpoint(
            "GET",
            "/items/:itemId",
            (ctx) => {
                const params = ctx.params as any as { itemId: string }
                return ctx.json({ itemId: params.itemId })
            },
            getItemConfig
        )

        const getBooksConfig = createEndpointConfig({
            schemas: {
                params: typebox.Object({ bookId: typebox.String(), chapterId: typebox.String() }),
            },
        })

        const getBooks = createEndpoint(
            "GET",
            "/books/:bookId/chapters/:chapterId",
            (ctx) => {
                const params = ctx.params as any as { bookId: string; chapterId: string }
                return ctx.json({ bookId: params.bookId, chapterId: params.chapterId })
            },
            getBooksConfig
        )

        const deleteItemConfig = createEndpointConfig({
            schemas: {
                params: typebox.Object({ itemId: typebox.String() }),
                searchParams: typebox.Object({ force: typebox.Optional(typebox.String()) }),
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
                searchParams: typebox.Object({
                    page: typebox.Number(),
                    q: typebox.String(),
                    is_eval: typebox.Boolean(),
                }),
            },
        })

        const getItems = createEndpoint(
            "GET",
            "/items",
            (ctx) => {
                const params = ctx.searchParams as any as { page: number; q: string; is_eval: boolean }
                return ctx.json({ page: params.page, q: params.q, is_eval: params.is_eval })
            },
            getItemsConfig
        )

        const callbackConfig = createEndpointConfig({
            schemas: {
                searchParams: typebox.Object({
                    code: typebox.String(),
                    state: typebox.String(),
                    code_challenge: typebox.Optional(typebox.String()),
                }),
            },
        })

        const callback = createEndpoint(
            "POST",
            "/callback",
            (ctx) => {
                const searchParams = ctx.searchParams as any as { code: string; state: string; code_challenge?: string }
                return ctx.json({
                    code: searchParams.code,
                    state: searchParams.state,
                    code_challenge: searchParams.code_challenge,
                })
            },
            callbackConfig
        )

        const callbackParamConfig = createEndpointConfig({
            schemas: {
                searchParams: typebox.Object({
                    code: typebox.String(),
                    state: typebox.String(),
                    code_challenge: typebox.Optional(typebox.String()),
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
                searchParams: typebox.Object({
                    page: typebox.Number(),
                    q: typebox.String(),
                    is_eval: typebox.Boolean(),
                }),
            },
        })

        const withParams = createEndpoint(
            "GET",
            "/with-params/:param1/:param2",
            (ctx) => {
                const searchParams = ctx.searchParams as any as { page: number; q: string; is_eval: boolean }
                const params = ctx.params as any as { param1: string; param2: string }
                return ctx.json({
                    page: searchParams.page,
                    q: searchParams.q,
                    is_eval: searchParams.is_eval,
                    param1: params.param1,
                    param2: params.param2,
                })
            },
            withParamsConfig
        )

        const getMethodsConfig = createEndpointConfig({
            schemas: {
                searchParams: typebox.Object({
                    name: typebox.String(),
                    age: typebox.Optional(typebox.Number()),
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
                body: typebox.Object({
                    name: typebox.String(),
                    nickname: typebox.String(),
                    is_eval: typebox.Boolean(),
                    cash: typebox.Number(),
                    items: typebox.Array(typebox.String()),
                }),
            },
        })

        const createUser = createEndpoint(
            "POST",
            "/users",
            (ctx) => {
                const body = ctx.body as any as {
                    name: string
                    nickname: string
                    is_eval: boolean
                    cash: number
                    items: string[]
                }
                return ctx.json(body)
            },
            createUserConfig
        )

        const withParamsConfig = createEndpointConfig({
            schemas: {
                body: typebox.Object({
                    page: typebox.Number(),
                    q: typebox.String(),
                    is_eval: typebox.Boolean(),
                }),
            },
        })

        const withParams = createEndpoint(
            "GET",
            "/with-params/:param1/:param2",
            (ctx) => {
                const body = ctx.body as any as { page: number; q: string; is_eval: boolean }
                const params = ctx.params as any as { param1: string; param2: string }
                return ctx.json({
                    page: body.page,
                    q: body.q,
                    is_eval: body.is_eval,
                    param1: params.param1,
                    param2: params.param2,
                })
            },
            withParamsConfig
        )

        const getMethodsConfig = createEndpointConfig({
            schemas: {
                body: typebox.Object({
                    name: typebox.String(),
                    age: typebox.Optional(typebox.Number()),
                }),
            },
        })

        const getMethods = createEndpoint(
            ["GET", "POST", "DELETE"],
            "/methods/:methodId",
            (ctx) => {
                const params = ctx.params as any as { methodId: string }
                return ctx.json({ methodId: params.methodId, method: ctx.method })
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
                headers: typebox.Object({
                    authorization: typebox.String(),
                    "x-csrf-token": typebox.String(),
                }),
            },
        })

        const getUser = createEndpoint(
            "GET",
            "/users/:userId",
            (ctx) => {
                const headers = ctx.headers as any as { authorization: string; "x-csrf-token": string }
                return ctx.json({
                    authorization: headers.authorization,
                    csrfToken: headers["x-csrf-token"],
                })
            },
            getUserConfig
        )

        const createUserConfig = createEndpointConfig({
            schemas: {
                body: typebox.Object({
                    name: typebox.String(),
                    nickname: typebox.String(),
                    is_eval: typebox.Boolean(),
                    cash: typebox.Number(),
                    items: typebox.Array(typebox.String()),
                }),
                headers: typebox.Object({
                    authorization: typebox.String(),
                    "x-csrf-token": typebox.String(),
                }),
            },
        })

        const createUser = createEndpoint(
            "POST",
            "/users",
            (ctx) => {
                const body = ctx.body as any as {
                    name: string
                    nickname: string
                    is_eval: boolean
                    cash: number
                    items: string[]
                }
                return ctx.json(body)
            },
            createUserConfig
        )

        const withParamsConfig = createEndpointConfig({
            schemas: {
                headers: typebox.Object({
                    page: typebox.Number(),
                    q: typebox.String(),
                    is_eval: typebox.Boolean(),
                }),
            },
        })

        const withParams = createEndpoint(
            "GET",
            "/with-params/:param1/:param2",
            (ctx) => {
                const headers = ctx.headers as any as { page: number; q: string; is_eval: boolean }
                const params = ctx.params as any as { param1: string; param2: string }
                return ctx.json({
                    page: headers.page,
                    q: headers.q,
                    is_eval: headers.is_eval,
                    param1: params.param1,
                    param2: params.param2,
                })
            },
            withParamsConfig
        )

        const getMethodsConfig = createEndpointConfig({
            schemas: {
                headers: typebox.Object({
                    authorization: typebox.String(),
                    token: typebox.String(),
                }),
            },
        })

        const getMethods = createEndpoint(
            ["GET", "POST", "DELETE"],
            "/methods/:methodId",
            (ctx) => {
                const params = ctx.params as any as { methodId: string }
                const method = ctx.method as "GET" | "POST" | "DELETE"
                return ctx.json({ methodId: params.methodId, method: method })
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
            route: "/with-params/:param1/:param2",
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
                response: typebox.Object({
                    code: typebox.String(),
                    message: typebox.String(),
                    id: typebox.Number(),
                    is_eval: typebox.Boolean(),
                }),
            },
        })

        const multiStatusCodeConfig = createEndpointConfig({
            schemas: {
                response: {
                    200: typebox.Object({
                        message: typebox.String(),
                        code: typebox.String(),
                        id: typebox.Number(),
                        is_eval: typebox.Boolean(),
                    }),
                    404: typebox.Object({ error: typebox.String(), code: typebox.String(), id: typebox.Number() }),
                },
            },
        })

        const multiStatusCodeConfigWithDefault = createEndpointConfig({
            schemas: {
                response: {
                    200: typebox.Object({
                        code: typebox.String(),
                        message: typebox.String(),
                        id: typebox.Number(),
                        is_eval: typebox.Boolean(),
                    }),
                    204: typebox.Object({
                        code: typebox.String(),
                        message: typebox.String(),
                        id: typebox.Number(),
                        is_eval: typebox.Boolean(),
                    }),
                    302: typebox.Object({ location: typebox.String() }),
                    404: typebox.Object({ code: typebox.String(), id: typebox.Number(), error: typebox.String() }),
                    500: typebox.Object({ code: typebox.String(), id: typebox.Number(), error: typebox.String() }),
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
                    200: typebox.Object({
                        param1: typebox.String(),
                        param2: typebox.String(),
                    }),
                    4040: typebox.Object({
                        error: typebox.String(),
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
                response: typebox.Object({
                    message: typebox.String(),
                    code: typebox.String(),
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

        await client.get("/multi-status", {})
        const simpleStatusResponse = await client.get("/multi-status")
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
                body: typebox.Object({
                    name: typebox.String(),
                    nickname: typebox.String(),
                }),
                headers: typebox.Object({
                    authorization: typebox.String(),
                }),
                params: typebox.Object({
                    userId: typebox.String(),
                    itemId: typebox.String(),
                }),
                searchParams: typebox.Object({
                    page: typebox.Number(),
                    q: typebox.String(),
                }),
            },
        })

        const allSchemasEndpoint = createEndpoint(
            ["GET", "POST"],
            "/users/:userId/items/:itemId",
            (ctx) => {
                const body = ctx.body as any as { name: string; nickname: string }
                const headers = ctx.headers as any as { authorization: string }
                const params = ctx.params as any as { userId: string; itemId: string }
                const searchParams = ctx.searchParams as any as { page: number; q: string }
                return ctx.json({
                    body: body,
                    headers: headers,
                    params: params,
                    searchParams: searchParams,
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
