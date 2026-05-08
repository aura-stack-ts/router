import { createClient, createEndpoint, createRouter } from "../src/index.ts"
import { describe, expectTypeOf } from "vitest"
import type { HeadersBuilder } from "@/headers.ts"
import type {
    RoutePattern,
    GetRouteParams,
    MiddlewareFunction,
    RequestContext,
    EndpointConfig,
    ContextSearchParams,
    ContextBody,
    RouteHandler,
    RouteEndpoint,
    InferMethod,
    EndpointSchemas,
    HTTPMethod,
    Prettify,
    GlobalContext,
    JsonResponse,
    InferEndpoints,
    RouteHandlerReturn,
    ContextParams,
} from "@/@types/index.ts"
import { ZodEnum, type ZodObject, type ZodString } from "zod"
import type { EnumSchema, ObjectSchema, StringSchema } from "valibot"

type RoutePath = "/auth/:oauth"
type EmptyObject = Record<PropertyKey, never>

describe("RoutePattern", () => {
    expectTypeOf<"/users/:userId/books/:bookId">().toExtend<RoutePattern>()
    expectTypeOf<"/users/:userId/:bookId">().toExtend<RoutePattern>()
    // @ts-expect-error
    expectTypeOf<"-users/:userId/books/:bookId">().toExtend<RoutePattern>()
    // @ts-expect-error
    expectTypeOf<"users/:userId/books/:bookId">().toExtend<RoutePattern>()
})

describe("GetRouteParams", () => {
    expectTypeOf<GetRouteParams<"/users">>().toEqualTypeOf<{}>()
    expectTypeOf<GetRouteParams<"/:id/:userId">>().toEqualTypeOf<{
        id: string
        userId: string
    }>
    expectTypeOf<GetRouteParams<"/:id/:userId/books">>().toEqualTypeOf<{
        id: string
        userId: string
    }>()
    expectTypeOf<GetRouteParams<"/:userId/books/path">>().toEqualTypeOf<{
        userId: string
    }>
    expectTypeOf<GetRouteParams<"/users/:userId">>().toEqualTypeOf<{
        userId: string
    }>()
    expectTypeOf<GetRouteParams<"/users/:userId/books/:bookId">>().toEqualTypeOf<{
        userId: string
        bookId: string
    }>()
    expectTypeOf<GetRouteParams<"/users/:userId/:bookId">>().toEqualTypeOf<{
        userId: string
        bookId: string
    }>()
})

describe("RequestContext", () => {
    type Context<T extends Record<string, unknown>> = Prettify<
        {
            headers: HeadersBuilder
            request: Request
            url: URL
            method: HTTPMethod | HTTPMethod[]
            route: RoutePattern
            context: GlobalContext
            json: <T>(data: T, init?: ResponseInit) => JsonResponse<T>
        } & T
    >
    expectTypeOf<RequestContext>().toEqualTypeOf<
        Context<{
            params: {}
            body: undefined
            searchParams: URLSearchParams
        }>
    >()

    expectTypeOf<RequestContext<RoutePath>>().toEqualTypeOf<
        Context<{
            params: { oauth: string }
            body: undefined
            searchParams: URLSearchParams
            route: "/auth/:oauth"
        }>
    >()

    expectTypeOf<RequestContext<"/:oauth/:provider">>().toEqualTypeOf<
        Context<{
            params: { oauth: string; provider: string }
            body: undefined
            searchParams: URLSearchParams
            route: "/:oauth/:provider"
        }>
    >()

    expectTypeOf<
        RequestContext<
            RoutePath,
            {
                schemas: {
                    body: ZodObject<{ username: ZodString; password: ZodString }>
                }
            }
        >
    >().toEqualTypeOf<
        Context<{
            params: { oauth: string }
            body: { username: string; password: string }
            searchParams: URLSearchParams
            route: "/auth/:oauth"
        }>
    >()

    expectTypeOf<
        RequestContext<
            RoutePath,
            {
                schemas: {
                    searchParams: ZodObject<{ code: ZodString; state: ZodString }>
                }
            }
        >
    >().toEqualTypeOf<
        Context<{
            params: { oauth: string }
            body: undefined
            searchParams: { code: string; state: string }
            route: "/auth/:oauth"
        }>
    >()

    expectTypeOf<
        RequestContext<
            RoutePath,
            {
                schemas: {
                    body: ZodObject<{ username: ZodString; password: ZodString }>
                    searchParams: ZodObject<{ code: ZodString; state: ZodString }>
                }
            }
        >
    >().toEqualTypeOf<
        Context<{
            params: { oauth: string }
            body: { username: string; password: string }
            searchParams: { code: string; state: string }
            route: "/auth/:oauth"
        }>
    >()

    expectTypeOf<
        RequestContext<
            RoutePath,
            {
                schemas: {
                    body: ZodObject<{ username: ZodString; password: ZodString }>
                    searchParams: ZodObject<{ code: ZodString; state: ZodString }>
                }
            }
        >
    >().toEqualTypeOf<
        Context<{
            params: { oauth: string }
            body: { username: string; password: string }
            searchParams: { code: string; state: string }
            route: "/auth/:oauth"
        }>
    >()
})

describe("MiddlewareFunction", () => {
    type ReturnCtx<Route extends RoutePattern = RoutePattern, Config extends EndpointConfig = EndpointConfig> =
        | Response
        | RequestContext<Route, Config>
        | Promise<Response | RequestContext<Route, Config>>

    type Body = ZodObject<{ username: ZodString; password: ZodString }>
    type SearchParams = ZodObject<{ code: ZodString; state: ZodString }>
    expectTypeOf<
        MiddlewareFunction<
            RoutePath,
            {
                body: Body
            }
        >
    >().toEqualTypeOf<
        (
            ctx: RequestContext<
                RoutePath,
                {
                    schemas: {
                        body: Body
                    }
                }
            >
        ) => ReturnCtx<
            RoutePath,
            {
                schemas: {
                    body: Body
                }
            }
        >
    >()

    expectTypeOf<
        MiddlewareFunction<
            RoutePath,
            {
                searchParams: SearchParams
            }
        >
    >().toEqualTypeOf<
        (
            ctx: RequestContext<
                RoutePath,
                {
                    schemas: {
                        searchParams: SearchParams
                    }
                }
            >
        ) => ReturnCtx<
            RoutePath,
            {
                schemas: {
                    searchParams: SearchParams
                }
            }
        >
    >()

    expectTypeOf<
        MiddlewareFunction<
            RoutePath,
            {
                body: Body
                searchParams: SearchParams
            }
        >
    >().toEqualTypeOf<
        (
            ctx: RequestContext<
                RoutePath,
                {
                    schemas: {
                        body: Body
                        searchParams: SearchParams
                    }
                }
            >
        ) => ReturnCtx<
            RoutePath,
            {
                schemas: {
                    body: Body
                    searchParams: SearchParams
                }
            }
        >
    >()

    expectTypeOf<MiddlewareFunction<RoutePath, {}>>().toEqualTypeOf<
        (ctx: RequestContext<RoutePath, { schemas: {} }>) => ReturnCtx<RoutePath, { schemas: {} }>
    >()

    expectTypeOf<MiddlewareFunction<RoutePath>>().toEqualTypeOf<
        (ctx: RequestContext<RoutePath, { schemas: {} }>) => ReturnCtx<RoutePath, { schemas: {} }>
    >()

    expectTypeOf<
        MiddlewareFunction<
            RoutePath,
            {
                searchParams: ZodObject<{ state: ZodString }>
            }
        >
    >().toEqualTypeOf<
        (
            ctx: RequestContext<RoutePath, { schemas: { searchParams: ZodObject<{ state: ZodString }> } }>
        ) => ReturnCtx<RoutePath, { schemas: { searchParams: ZodObject<{ state: ZodString }> } }>
    >()
})

describe("ContextSearchParams", () => {
    describe("URLSearchParams instance", () => {
        expectTypeOf<ContextSearchParams<{}>>().toEqualTypeOf<URLSearchParams>()
    })

    describe("ZodObject instance", () => {
        expectTypeOf<
            ContextSearchParams<{
                searchParams: ZodObject<{
                    code: ZodString
                }>
            }>
        >().toEqualTypeOf<{ code: string }>()

        expectTypeOf<
            ContextSearchParams<{
                searchParams: ZodObject<{
                    code: ZodString
                    state: ZodString
                }>
            }>
        >().toEqualTypeOf<{ code: string; state: string }>()
    })

    describe("ObjectSchema instance", () => {
        expectTypeOf<
            ContextSearchParams<{
                searchParams: ObjectSchema<
                    {
                        code: StringSchema<undefined>
                    },
                    undefined
                >
            }>
        >().toEqualTypeOf<{ code: string }>()

        expectTypeOf<
            ContextSearchParams<{
                searchParams: ObjectSchema<
                    {
                        code: StringSchema<undefined>
                        state: StringSchema<undefined>
                    },
                    undefined
                >
            }>
        >().toEqualTypeOf<{ code: string; state: string }>()
    })
})

describe("ContextBody", () => {
    describe("undefined body", () => {
        expectTypeOf<ContextBody<{}>>().toEqualTypeOf<undefined>()
    })

    describe("ZodObject instance", () => {
        expectTypeOf<
            ContextBody<{
                body: ZodObject<{
                    username: ZodString
                    password: ZodString
                }>
            }>
        >().toEqualTypeOf<{ username: string; password: string }>()

        expectTypeOf<
            ContextBody<{
                body: ZodObject<{
                    oauth: ZodString
                }>
            }>
        >().toEqualTypeOf<{ oauth: string }>()
    })

    describe("ObjectSchema instance", () => {
        expectTypeOf<
            ContextBody<{
                body: ObjectSchema<
                    {
                        username: StringSchema<undefined>
                        password: StringSchema<undefined>
                    },
                    undefined
                >
            }>
        >().toEqualTypeOf<{ username: string; password: string }>()

        expectTypeOf<
            ContextBody<{
                body: ObjectSchema<
                    {
                        oauth: StringSchema<undefined>
                    },
                    undefined
                >
            }>
        >().toEqualTypeOf<{ oauth: string }>()
    })
})

describe("ContextParams", () => {
    describe("No route params", () => {
        expectTypeOf<ContextParams<{}, {}>>().toEqualTypeOf<{}>()
        expectTypeOf<ContextParams<{}>>().toEqualTypeOf<Record<string, string>>()
    })

    describe("With route params", () => {
        expectTypeOf<ContextParams<{}, GetRouteParams<RoutePath>>>().toEqualTypeOf<{ oauth: string }>()
        expectTypeOf<ContextParams<EndpointSchemas, GetRouteParams<RoutePath>>>().toEqualTypeOf<{
            oauth: string
        }>()
    })

    describe("With route params and schemas", () => {
        expectTypeOf<
            ContextParams<
                {
                    params: ZodObject<{
                        oauth: ZodString
                    }>
                },
                GetRouteParams<RoutePath>
            >
        >().toEqualTypeOf<{ oauth: string }>()

        expectTypeOf<
            ContextParams<{
                params: ZodObject<{
                    role: ZodEnum<{ admin: "admin"; user: "user"; guest: "guest" }>
                }>
            }>
        >().toEqualTypeOf<{ role: "admin" | "user" | "guest" }>()

        expectTypeOf<
            ContextParams<{
                params: ObjectSchema<
                    {
                        oauth: EnumSchema<{ admin: "admin"; user: "user"; guest: "guest" }, undefined>
                    },
                    undefined
                >
            }>
        >().toEqualTypeOf<{ oauth: "admin" | "user" | "guest" }>()

        expectTypeOf<
            ContextParams<
                {
                    params: ZodObject<{
                        userId: ZodString
                        itemId: ZodString
                    }>
                },
                GetRouteParams<RoutePath>
            >
        >().toEqualTypeOf<{ userId: string; itemId: string }>()

        expectTypeOf<
            ContextParams<
                {
                    params: ObjectSchema<
                        {
                            oauth: StringSchema<undefined>
                        },
                        undefined
                    >
                },
                GetRouteParams<RoutePath>
            >
        >().toEqualTypeOf<{ oauth: string }>()
        expectTypeOf<
            ContextParams<
                {
                    params: ObjectSchema<
                        {
                            userId: StringSchema<undefined>
                            itemId: StringSchema<undefined>
                        },
                        undefined
                    >
                },
                GetRouteParams<RoutePath>
            >
        >().toEqualTypeOf<{ userId: string; itemId: string }>()
    })
})

describe("EndpointConfig", () => {
    expectTypeOf<EndpointConfig<"/">>().toEqualTypeOf<{
        schemas?: EndpointSchemas
        use?: MiddlewareFunction<"/", EndpointSchemas>[]
    }>()

    expectTypeOf<
        EndpointConfig<
            "/",
            {
                body: ZodObject<{ username: ZodString; password: ZodString }>
            }
        >
    >().toEqualTypeOf<{
        schemas?: { body: ZodObject<{ username: ZodString; password: ZodString }> }
        use?: MiddlewareFunction<
            "/",
            {
                body: ZodObject<{ username: ZodString; password: ZodString }>
            }
        >[]
    }>()
})

describe("RouteHandler", () => {
    expectTypeOf<RouteHandler<"/auth/:oauth", EmptyObject>>().toBeFunction()
    expectTypeOf<RouteHandler<"/auth/session", EmptyObject>>().toBeFunction()
    expectTypeOf<
        RouteHandler<
            "/auth/:oauth",
            {
                schemas: {
                    searchParams: ZodObject<{ state: ZodString }>
                }
            }
        >
    >().toBeFunction()
})

describe("RouteEndpoint", () => {
    expectTypeOf<RouteEndpoint<"GET", "/auth/:oauth", EndpointConfig<"/auth/:oauth">>>().toEqualTypeOf<{
        method: "GET"
        route: "/auth/:oauth"
        config: EndpointConfig<"/auth/:oauth">
        handler: RouteHandler<"/auth/:oauth", EndpointConfig<"/auth/:oauth">, RouteHandlerReturn, "GET">
    }>()

    expectTypeOf<RouteEndpoint<"GET", "/auth/:oauth", EndpointConfig<"/auth/:oauth">>>().toEqualTypeOf<{
        method: "GET"
        route: "/auth/:oauth"
        config: EndpointConfig<"/auth/:oauth">
        handler: RouteHandler<"/auth/:oauth", EndpointConfig<"/auth/:oauth">, RouteHandlerReturn, "GET">
    }>()

    expectTypeOf<
        RouteEndpoint<
            "GET",
            "/auth/:oauth",
            {
                schemas: {
                    searchParams: ZodObject<{ state: ZodString }>
                }
            }
        >
    >().toEqualTypeOf<{
        method: "GET"
        route: "/auth/:oauth"
        config: {
            schemas: {
                searchParams: ZodObject<{ state: ZodString }>
            }
        }
        handler: RouteHandler<
            "/auth/:oauth",
            {
                schemas: {
                    searchParams: ZodObject<{ state: ZodString }>
                }
            },
            RouteHandlerReturn,
            "GET"
        >
    }>()
})

describe("InferMethod", () => {
    expectTypeOf<InferMethod<[RouteEndpoint<"GET", "/auth/:oauth", EmptyObject>]>>().toEqualTypeOf<"GET">()
    expectTypeOf<
        InferMethod<[RouteEndpoint<"GET", "/auth/:oauth", EmptyObject>, RouteEndpoint<"GET", "/auth/session", EmptyObject>]>
    >().toEqualTypeOf<"GET">()
    expectTypeOf<
        InferMethod<[RouteEndpoint<"GET", "/auth/:oauth", EmptyObject>, RouteEndpoint<"POST", "/auth/signOut", EmptyObject>]>
    >().toEqualTypeOf<"GET" | "POST">()
    expectTypeOf<
        InferMethod<
            [
                RouteEndpoint<"GET", "/auth/:oauth", EmptyObject>,
                RouteEndpoint<"POST", "/auth/signOut", EmptyObject>,
                RouteEndpoint<"PUT", "/auth/session", EmptyObject>,
            ]
        >
    >().toEqualTypeOf<"GET" | "POST" | "PUT">()
})

describe("RouteEndpoint response inference from ctx.json", async () => {
    const endpoint = createEndpoint("GET", "/test", (ctx) => ctx.json({ id: 1 }))

    expectTypeOf<ReturnType<typeof endpoint.handler>>().toEqualTypeOf<JsonResponse<{ id: number }>>()

    const router = createRouter([endpoint])
    expectTypeOf<InferEndpoints<typeof router>>().toEqualTypeOf<[typeof endpoint]>()

    const client = createClient<typeof router>({
        baseURL: "https://api.example.com",
    })
    const response = await client.get("/test")
    expectTypeOf<typeof response>().toEqualTypeOf<JsonResponse<{ id: number }>>()
})
